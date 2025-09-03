<!-- src/components/NearbyFountains.vue -->
<template>
  <div class="map-wrap">
    <div v-if="loading" class="loading">Loading nearby fountains…</div>
    <div ref="mapEl" class="map"></div>

    <!-- Graphic control panel -->
    <div class="panel fancy">
      <h3 class="section-title">🚰 Nearby Drinking Fountains</h3>

      <!-- Stat card / empty state -->
      <div v-if="searchCenter" class="stat-card">
        <span class="stat-number">{{ nearbyCount }}</span>
        <span class="stat-label">
          fountain{{ nearbyCount===1?'':'s' }} within {{ radiusKm.toFixed(1) }} km
        </span>
      </div>
      <div v-else class="empty-note">📍 Choose a center to see fountains nearby.</div>

      <!-- Controls -->
      <div class="row wrap">
        <button class="btn" @click="requestLocation" :disabled="locating">
          {{ locating ? '⏳ Getting…' : (userLoc ? '📍 Re-locate me' : '📍 Use my location') }}
        </button>
        <button class="btn ghost" @click="useMapCenter">🎯 Use map center</button>
        <button class="btn ghost" :class="{active: pickingOnMap}" @click="togglePickOnMap">
          {{ pickingOnMap ? '🖱️ Click map… (esc)' : '🖱️ Click map to set' }}
        </button>
      </div>

      <div class="row small muted" v-if="locError">{{ locError }}</div>
      <div class="row small muted" v-else-if="searchCenter">
        Center: {{ searchCenter[1].toFixed(4) }}, {{ searchCenter[0].toFixed(4) }}
        <span v-if="usingUserLoc">(from device)</span>
        <span v-else>(manual)</span>
      </div>

      <!-- Radius slider -->
      <div class="row slider-row" v-if="searchCenter">
        <label>Search radius</label>
        <input type="range" min="0.2" max="5" step="0.2" v-model.number="radiusKm" />
        <span>{{ radiusKm.toFixed(1) }} km</span>
      </div>

      <!-- Directions -->
      <div v-if="selectedFountain" class="directions-card">
        <div class="title">💧 {{ selectedFountain.properties?.name || 'Drinking fountain' }}</div>
        <div class="coords small muted">
          {{ selectedFountain.geometry.coordinates[1].toFixed(5) }},
          {{ selectedFountain.geometry.coordinates[0].toFixed(5) }}
        </div>
        <a class="btn wide" :href="directionsUrl" target="_blank" rel="noopener">➡️ Get directions</a>
        <button class="btn ghost wide" @click="selectedFountain=null">Close</button>
        <div class="tiny">Opens Google Maps walking directions in a new tab.</div>
      </div>

      <div class="hint">💡 Tip: Allow location or pick a map point to start.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer, IconLayer, ScatterplotLayer } from '@deck.gl/layers'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import * as turf from '@turf/turf'

// ---------- DATA PATHS ----------
const FOUNTAINS_PATH = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/osm_fountains_metro_melb.geojson'
const FOUNTAIN_ICON_URL = '/icons/fountain.png' // recommend 64x64 or 96x96 PNG
const DEFAULT_VIEW = { center: [144.9631, -37.8136], zoom: 12, pitch: 50, bearing: 0 }
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// ---------- STATE ----------
const mapEl = ref(null)
let map = null
let deckOverlay = null
const loading = ref(true)

const fountains = ref({ type: 'FeatureCollection', features: [] })

// centers
const userLoc = ref(null)        // [lon, lat] from geolocation
const manualCenter = ref(null)   // [lon, lat] from map center or click
const mapCenter = ref(DEFAULT_VIEW.center) // live map center tracking
const usingUserLoc = computed(() => !!userLoc.value && !manualCenter.value)
const searchCenter = computed(() => manualCenter.value || userLoc.value || null)

const locating = ref(false)
const locError = ref('')
const pickingOnMap = ref(false)

const radiusKm = ref(1.0)
const selectedFountain = ref(null)

// ---------- LIGHTING ----------
const ambient = new AmbientLight({ color: [255,255,255], intensity: 0.9 })
const dirLight = new DirectionalLight({ color: [255,255,255], intensity: 1.2, direction: [-1,-3,-1] })
const lighting = new LightingEffect({ ambient, dirLight })

// ---------- LOAD FOUNTAINS ----------
async function loadFountains() {
  const resp = await fetch(FOUNTAINS_PATH)
  if (!resp.ok) throw new Error(`Failed to load fountains: ${resp.status}`)
  fountains.value = await resp.json()
}

// ---------- LOCATION ----------
function requestLocation() {
  locError.value = ''
  selectedFountain.value = null
  if (!('geolocation' in navigator)) {
    locError.value = 'Geolocation not supported by this browser.'
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      const { longitude, latitude } = pos.coords
      userLoc.value = [longitude, latitude]
      manualCenter.value = null // prefer device location
      map?.flyTo({ center: [longitude, latitude], zoom: Math.max(14, map.getZoom()), duration: 800 })
      setDeckLayers()
    },
    err => {
      locating.value = false
      locError.value = err?.message === 'Timeout expired'
        ? 'Location timeout. Try again, or use “map center / click map”.'
        : (err?.message || 'Could not get location. Use “map center / click map”.')
    },
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
  )
}

function useMapCenter() {
  if (!map) return
  const c = map.getCenter()
  manualCenter.value = [c.lng, c.lat]
  setDeckLayers()
}

function togglePickOnMap() {
  pickingOnMap.value = !pickingOnMap.value
  if (pickingOnMap.value) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        pickingOnMap.value = false
        window.removeEventListener('keydown', onEsc)
      }
    }
    window.addEventListener('keydown', onEsc, { once: true })
  }
}

// ---------- NEARBY FILTER ----------
const nearbyFountains = computed(() => {
  if (!searchCenter.value) return []
  const center = searchCenter.value
  return fountains.value.features.filter(f => {
    const p = f.geometry.coordinates
    const d = turf.distance([center[0], center[1]], [p[0], p[1]], { units: 'kilometers' })
    return d <= radiusKm.value
  })
})
const nearbyCount = computed(() => nearbyFountains.value.length)

// ---------- LAYERS ----------
function buildUserLayer() {
  if (!searchCenter.value) return null
  const isDevice = usingUserLoc.value
  return new ScatterplotLayer({
    id: 'center-dot',
    data: [{ position: searchCenter.value }],
    getPosition: d => d.position,
    getRadius: 12, radiusUnits: 'pixels',
    getFillColor: isDevice ? [13,71,161,255] : [0,121,107,255],
    pickable: false
  })
}

function buildRadiusRing() {
  if (!searchCenter.value) return null
  const circle = turf.circle([searchCenter.value[0], searchCenter.value[1]], radiusKm.value, { units: 'kilometers', steps: 120 })
  return new GeoJsonLayer({
    id: 'radius',
    data: circle,
    stroked: true,
    filled: true,
    getLineColor: [13,71,161,200],
    getLineWidth: 2,
    lineWidthMinPixels: 2,
    getFillColor: [13,71,161,40],
    pickable: false,
    parameters: {
      depthTest: true,
      depthMask: false
    }
  })
}

function buildFountainsLayer() {
  const data = searchCenter.value ? nearbyFountains.value : []
  const SRC_W = 64, SRC_H = 64
  const z = map?.getZoom?.() ?? 12
  const sizePx = Math.max(22, Math.min(60, 22 + (z - 10) * 4))

  return new IconLayer({
    id: 'fountains',
    data,
    pickable: true,
    sizeUnits: 'pixels',
    sizeScale: 1,
    getSize: () => sizePx,
    sizeMinPixels: 22,
    sizeMaxPixels: 64,
    getPosition: f => f.geometry.coordinates,
    getIcon: () => ({
      url: FOUNTAIN_ICON_URL,
      width: SRC_W,
      height: SRC_H,
      anchorY: SRC_H,
    }),
    parameters: {
      depthTest: false,
      depthFunc: 'always'
    },
    onClick: ({object}) => {
      if (!object) return
      selectedFountain.value = object
      const [lon, lat] = object.geometry.coordinates
      map.flyTo({ center: [lon, lat], zoom: Math.max(15, map.getZoom()), duration: 700 })
    },
    updateTriggers: { getSize: [map?.getZoom?.(), radiusKm.value, !!searchCenter.value] }
  })
}

function setDeckLayers() {
  if (!deckOverlay) return
  const layers = [buildFountainsLayer()]
  const userLayer = buildUserLayer()
  const ringLayer = buildRadiusRing()
  if (ringLayer) layers.unshift(ringLayer)
  if (userLayer) layers.unshift(userLayer)

  deckOverlay.setProps({
    layers,
    effects: [lighting],
    getCursor: ({isHovering}) => isHovering ? 'pointer' : (pickingOnMap.value ? 'crosshair' : 'default'),
    getTooltip: ({ object, layer }) => {
      if (layer?.id === 'fountains' && object) {
        return { text: `${object.properties?.name || 'Drinking fountain'}\nClick for directions` }
      }
      return null
    }
  })
}

// ---------- DIRECTIONS URL ----------
const directionsUrl = computed(() => {
  if (!selectedFountain.value) return '#'
  const [lon, lat] = selectedFountain.value.geometry.coordinates
  const origin = userLoc.value ? `&origin=${encodeURIComponent(userLoc.value[1] + ',' + userLoc.value[0])}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lon)}&travelmode=walking${origin}`
})

// ---------- INIT ----------
async function init() {
  await nextTick()
  map = new MapLibreMap({
    container: mapEl.value,
    style: BASEMAP_STYLE,
    center: DEFAULT_VIEW.center,
    zoom: DEFAULT_VIEW.zoom,
    pitch: DEFAULT_VIEW.pitch,
    bearing: DEFAULT_VIEW.bearing,
    attributionControl: true,
    antialias: true
  })
  deckOverlay = new MapboxOverlay({ interleaved: true })
  map.addControl(deckOverlay)

  map.on('move', () => { const c = map.getCenter(); mapCenter.value = [c.lng, c.lat] })
  map.on('zoom', () => setDeckLayers())
  map.on('click', (e) => {
    if (!pickingOnMap.value) return
    manualCenter.value = [e.lngLat.lng, e.lngLat.lat]
    pickingOnMap.value = false
    setDeckLayers()
  })

  await loadFountains()
  setDeckLayers()

  // Try to locate right away (optional)
  requestLocation()

  loading.value = false
}

onMounted(() => {
  init().catch(err => {
    console.error(err)
    alert('Could not load nearby fountains.')
  })
})
onBeforeUnmount(() => {
  if (deckOverlay) deckOverlay.finalize()
  if (map) map.remove()
})
watch([searchCenter, radiusKm, () => fountains.value], () => setDeckLayers())
</script>

<style scoped>
.map-wrap { position: relative; height: 75vh; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 36px rgba(0,0,0,0.12); background: #eef2f3; }
.map { height: 100%; width: 100%; }

.loading { position: absolute; z-index: 3; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); padding: 8px 12px; border-radius: 10px; font-size: .9rem; color: #0d47a1; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }

/* Pretty panel */
.panel.fancy {
  position: absolute; top: 12px; left: 12px;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(6px);
  border-radius: 16px; padding: 16px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.12);
  width: 360px; max-height: calc(100% - 24px); overflow: auto;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  border: 1px solid rgba(0,0,0,0.08);
}
.section-title {
  font-size: 1.15rem; font-weight: 700; margin: 0 0 12px;
  padding: 6px 12px; border-radius: 12px;
  background: linear-gradient(90deg, #e3f2fd, #bbdefb);
  color: #0d47a1;
}

/* Stat card */
.stat-card {
  background: #e3f2fd; border: 1px solid #bbdefb;
  border-radius: 12px; padding: 10px; text-align: center; margin-bottom: 12px;
}
.stat-number { font-size: 1.6rem; font-weight: 700; color: #0d47a1; }
.stat-label { font-size: .85rem; color: #555; }

/* Buttons */
.btn { background: #0d47a1; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: .85rem; cursor: pointer; transition: transform .1s ease; }
.btn:hover { transform: scale(1.04); }
.btn:disabled { opacity: .6; cursor: default; }
.btn.ghost { background: transparent; color: #0d47a1; border: 1px solid #0d47a1; }
.btn.ghost.active { background: #e3f2fd; }
.btn.wide { width: 100%; margin-top: 6px; }

/* Rows / slider */
.row { display: flex; align-items: center; gap: 10px; margin: 8px 0; flex-wrap: wrap; }
.slider-row { display: flex; align-items: center; gap: 8px; font-size: .85rem; }
input[type="range"] { width: 160px; accent-color: #0d47a1; }

.small { font-size: .8rem; }
.muted { color: #555; }
.err { color: #b00020; font-size: .85rem; }
.hint { margin-top: 10px; font-size: .78rem; color: #555; }

/* Directions card */
.directions-card {
  margin-top: 12px; background: #fff;
  border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 12px; text-align: center;
}
.directions-card .title { font-weight: 700; margin-bottom: 4px; color: #0d47a1; }
.directions-card .coords { margin-bottom: 8px; font-size: .8rem; }
.directions-card .tiny { font-size: 11px; color: #666; margin-top: 6px; }
.empty-note { background: #fff3e0; border: 1px solid #ffe0b2; color: #e65100; padding: 8px; border-radius: 8px; font-size: .85rem; margin-bottom: 10px; }
</style>
