<!-- src/components/NearbyFountains.vue -->
<template>
  <div class="map-wrap">
    <div v-if="loading" class="loading">Loading nearby fountains…</div>
    <div ref="mapEl" class="map"></div>

    <div class="panel">
      <h3>Nearby Drinking Fountains</h3>

      <div class="row">
        <button class="btn" @click="requestLocation" :disabled="locating">
          {{ locating ? 'Getting location…' : (userLoc ? 'Re-locate me' : 'Use my location') }}
        </button>
        <span v-if="locError" class="err">{{ locError }}</span>
        <span v-else-if="userLoc" class="muted small">
          {{ userLoc[1].toFixed(5) }}, {{ userLoc[0].toFixed(5) }}
        </span>
      </div>

      <div class="row" v-if="userLoc">
        <label>Search radius (km)</label>
        <input type="range" min="0.2" max="5" step="0.2" v-model.number="radiusKm" />
        <span>{{ radiusKm.toFixed(1) }} km</span>
      </div>

      <div class="row" v-if="userLoc">
        <div class="muted small">Found <b>{{ nearbyCount }}</b> fountain{{ nearbyCount===1?'':'s' }} within {{ radiusKm.toFixed(1) }} km.</div>
      </div>

      <div v-if="selectedFountain" class="directions-card">
        <div class="title">{{ selectedFountain.properties?.name || 'Drinking fountain' }}</div>
        <div class="coords small muted">
          {{ selectedFountain.geometry.coordinates[1].toFixed(5) }},
          {{ selectedFountain.geometry.coordinates[0].toFixed(5) }}
        </div>
        <a class="btn wide" :href="directionsUrl" target="_blank" rel="noopener">Get directions</a>
        <button class="btn ghost wide" @click="selectedFountain=null">Close</button>
        <div class="tiny">Opens Google Maps walking directions in a new tab.</div>
      </div>

      <div class="hint">
        Tip: move the radius slider to include more/less fountains.
      </div>
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
const FOUNTAINS_PATH = '/datasets/osm_fountains_metro_melb.geojson'
const FOUNTAIN_ICON_URL = '/icons/fountain.png' // 32px PNG
const DEFAULT_VIEW = { center: [144.9631, -37.8136], zoom: 12, pitch: 50, bearing: 0 }
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

// ---------- STATE ----------
const mapEl = ref(null)
let map = null
let deckOverlay = null
const loading = ref(true)

const fountains = ref({ type: 'FeatureCollection', features: [] })
const userLoc = ref(null)   // [lon, lat]
const locating = ref(false)
const locError = ref('')
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
  // Note: requires HTTPS or localhost
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      const { longitude, latitude } = pos.coords
      userLoc.value = [longitude, latitude]
      // Center map to user
      map?.flyTo({ center: [longitude, latitude], zoom: Math.max(14, map.getZoom()), duration: 800 })
      setDeckLayers()
    },
    err => {
      locating.value = false
      locError.value = err.message || 'Could not get location.'
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  )
}

// ---------- NEARBY FILTER ----------
const nearbyFountains = computed(() => {
  if (!userLoc.value) return []
  const center = userLoc.value
  return fountains.value.features.filter(f => {
    const p = f.geometry.coordinates
    const d = turf.distance([center[0], center[1]], [p[0], p[1]], { units: 'kilometers' })
    return d <= radiusKm.value
  })
})
const nearbyCount = computed(() => nearbyFountains.value.length)

// ---------- LAYERS ----------
function buildUserLayer() {
  if (!userLoc.value) return null
  return new ScatterplotLayer({
    id: 'me',
    data: [{ position: userLoc.value }],
    getPosition: d => d.position,
    getRadius: 12, radiusUnits: 'pixels',
    getFillColor: [13,71,161,255], // deep blue
    pickable: false
  })
}
function buildRadiusRing() {
  if (!userLoc.value) return null
  const circle = turf.circle([userLoc.value[0], userLoc.value[1]], radiusKm.value, { units: 'kilometers', steps: 120 })
  return new GeoJsonLayer({
    id: 'radius',
    data: circle,
    stroked: true,
    filled: true,
    getLineColor: [13,71,161,200],
    getLineWidth: 2,
    lineWidthMinPixels: 2,
    getFillColor: [13,71,161,40],
    pickable: false
  })
}
function buildFountainsLayer() {
  const data = userLoc.value ? nearbyFountains.value : fountains.value.features

  const SRC_W = 64
  const SRC_H = 64
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
      url: FOUNTAIN_ICON_URL, // your PNG
      width: SRC_W,
      height: SRC_H,
      anchorY: SRC_H
    }),
    onClick: ({object}) => {
      if (!object) return
      selectedFountain.value = object
      const [lon, lat] = object.geometry.coordinates
      map.flyTo({ center: [lon, lat], zoom: Math.max(15, map.getZoom()), duration: 700 })
    },
    updateTriggers: {
      getSize: [map?.getZoom?.()]
    }
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
    getCursor: ({isHovering}) => isHovering ? 'pointer' : 'default',
    getTooltip: ({ object, layer }) => {
      if (layer?.id === 'fountains' && object) {
        return { text: `${object.properties?.name || 'Drinking fountain'}\nClick for details` }
      }
      return null
    }
  })
}

// ---------- DIRECTIONS URL ----------
const directionsUrl = computed(() => {
  if (!selectedFountain.value) return '#'
  const [lon, lat] = selectedFountain.value.geometry.coordinates
  // Google Maps Directions API (walking)
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lon)}&travelmode=walking`
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

  await loadFountains()
  setDeckLayers()

  // Ask for location immediately (you can remove this if you prefer a manual button only)
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

// Update layers when user moves the radius or we got location
watch([userLoc, radiusKm, () => fountains.value], () => setDeckLayers())
</script>

<style scoped>
.map-wrap { position: relative; height: 75vh; border-radius: 16px; overflow: hidden; box-shadow: 0 14px 32px rgba(0,0,0,0.12); background: #eef2f3; }
.map { height: 100%; width: 100%; }

.loading { position: absolute; z-index: 3; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); padding: 8px 12px; border-radius: 10px; font-size: .9rem; color: #0d47a1; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }

.panel { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 24px rgba(0,0,0,0.12); font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; width: 340px; max-height: calc(100% - 24px); overflow: auto; }
.panel h3 { font-size: 1.05rem; margin: 0 0 8px; color: #0d47a1; letter-spacing: .2px; }

.row { display: flex; align-items: center; gap: 10px; font-size: .92rem; margin: 8px 0; flex-wrap: wrap; }
.row label { color: #333; }
.small { font-size: .8rem; }
.muted { color: #555; }
.err { color: #b00020; font-size: .85rem; }

.btn { background: #0d47a1; color: #fff; border: none; padding: 6px 10px; border-radius: 8px; font-size: .85rem; cursor: pointer; }
.btn:hover { filter: brightness(1.05); }
.btn.ghost { background: transparent; color: #0d47a1; border: 1px solid #0d47a1; }
.btn.wide { width: 100%; text-align: center; }

.hint { margin-top: 8px; font-size: .78rem; color: #555; }

.directions-card {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 4;
  background: rgba(255,255,255,0.97);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  padding: 12px;
  width: 260px;
}
.directions-card .title { font-weight: 700; color: #0d47a1; margin-bottom: 4px; }
.directions-card .coords { margin-bottom: 8px; }
.directions-card .tiny { font-size: 11px; color: #666; margin-top: 6px; }
</style>
