<!-- src/components/WaterAccess.vue -->
<template>
  <div class="map-wrap">
    <div v-if="loading" class="loading">Loading fountains…</div>
    <div ref="mapEl" class="map"></div>

    <!-- Graphic control panel -->
    <div class="panel fancy">
      <h3 class="section-title">🚰 Water Access (Drinking Fountains)</h3>
       <!-- Toggle icons -->
      <div class="row wrap">
        <button class="btn ghost" :class="{active: showIcons}" @click="showIcons = !showIcons">
          {{ showIcons ? '🙈 Hide icons' : '💧 Show icons' }}
        </button>
      </div>
      <!-- Data sync -->
      <div class="row small muted">
        Last updated: {{ lastSyncLabel }}
      </div>

      <!-- Progress -->
      <div class="row" v-if="counting">
        <div class="progress"><div class="bar" :style="{ width: Math.round(countProgress*100)+'%' }"></div></div>
        <span class="small muted">{{ Math.round(countProgress*100) }}%</span>
      </div>

      <!-- Legend -->
      <div class="legend-card">
        <div class="legend-title">Legend</div>
        <div class="legend-desc small">💧 Darker blue = more fountains<br/>Hover for exact counts</div>
      </div>

      <!-- Ranking -->
      <div class="section">
        <div class="section-title">🏆 Explore Suburbs <span class="muted" v-if="rankedTotal>0">· {{ rankedTotal }} found</span></div>

        <div class="controls">
          <input class="search" v-model.trim="search" placeholder="🔍 Search suburb…" @keydown.stop />
          <div class="toggle">
            <button class="chip" :class="{active: sortMode==='desc'}" @click="sortMode='desc'">⬆️ Most</button>
            <button class="chip" :class="{active: sortMode==='asc'}" @click="sortMode='asc'">⬇️ Least</button>
          </div>
          <div class="slider-row">
            <span>Show</span>
            <input type="range" min="5" max="50" step="5" v-model.number="limit" />
            <span>{{ limit }}</span>
          </div>
        </div>

        <div class="rank-list">
          <div
            v-for="item in rankedLimited"
            :key="item.id"
            class="rank-item"
            :class="{selected: isSelected(item.id)}"
            @click="toggleSelect(item.id)"
            @dblclick.stop="zoomToItems([item.id])"
          >
            <div class="rank-name">
              <span class="bullet" :style="{background: item.color}"></span>
              {{ item.name }}
            </div>
            <div class="rank-value">{{ item.count }}</div>
          </div>
          <div v-if="!loading && rankedLimited.length===0" class="muted">No suburbs match search.</div>
        </div>
      </div>

      <!-- Selection summary -->
      <div class="section" v-if="selectedIds.length">
        <div class="section-title">📍 Selected</div>
        <div class="selection">
          <div v-for="sid in selectedIds" :key="sid" class="pill">{{ idToName.get(sid) || sid }}</div>
        </div>
        <div class="row wrap">
          <button class="btn" @click="zoomToItems(selectedIds)">🔎 Zoom</button>
          <button class="btn ghost" @click="clearSelection">Clear</button>
        </div>
        <div class="empty-note" v-if="selectedZeroCount">🚱 No fountains recorded here.</div>
      </div>

      <div class="hint">💡 Tip: Hover suburbs for names & counts. Click icons to zoom & select.</div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import * as turf from '@turf/turf'

// -------------------- PATHS --------------------
const GEOJSON_PATH = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/georef-australia-state-suburb.geojson'
const FOUNTAINS_PATH = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/osm_fountains_metro_melb.geojson'
const FOUNTAIN_ICON_URL = '/icons/fountain.png' // put a 32px PNG here

// -------------------- JOIN KEYS ----------------
let BOUNDARY_JOIN_KEY = 'scc_name' // polygon property for suburb name

// -------------------- MAP VIEW -----------------
const DEFAULT_VIEW = { center: [144.9631, -37.8136], zoom: 9, pitch: 50, bearing: 0 }
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const VIEW_KEY = 'waterAccess:view'

// -------------------- LIGHTING -----------------
const ambient = new AmbientLight({ color: [255,255,255], intensity: 0.9 })
const dirLight = new DirectionalLight({ color: [255,255,255], intensity: 1.2, direction: [ -1, -3, -1 ] })
const lighting = new LightingEffect({ ambient, dirLight })

// -------------------- STATE --------------------
const mapEl = ref(null)
let map = null
let deckOverlay = null
const loading = ref(true)
const lastSync = ref(null)

const fountains = ref({ type: 'FeatureCollection', features: [] }) // points
const geojson = ref(null)  // polygons
const features = ref([])   // polygons with __fountainCount

// Ranking/selection UI
const search = ref('')
const sortMode = ref('desc') // 'desc' = most fountains
const limit = ref(20)
const selectedIds = ref([])

// Progress for counting
const counting = ref(false)
const countProgress = ref(0) // 0..1

const showIcons = ref(true)   // NEW toggle for fountain icons

// -------------------- COLOR SCALE (BLUE) --------------
const START = [227, 242, 253]  // light blue (#E3F2FD)
const END   = [ 13,  71, 161]  // dark blue  (#0D47A1)
function clamp01(t){return Math.max(0, Math.min(1, t))}
function lerp(a,b,t){return a + (b-a)*t}
function lerpRGB(t){
  t = clamp01(t)
  return [
    Math.round(lerp(START[0], END[0], t)),
    Math.round(lerp(START[1], END[1], t)),
    Math.round(lerp(START[2], END[2], t))
  ]
}

// -------------------- HELPERS ------------------
function baseNorm(s) {
  if (Array.isArray(s)) s = s[0]
  return (s ?? '')
    .toString().normalize('NFKD').toUpperCase()
    .replace(/[’'`]/g, '').replace(/\(.*?\)/g, '')
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\bSHIRE\b|\bCITY\b|\bRURAL\b|\bCOUNCIL\b|\bOF\b/g, '')
    .replace(/\s+/g, ' ').trim()
}
const getName = (props) => Array.isArray(props?.[BOUNDARY_JOIN_KEY]) ? props[BOUNDARY_JOIN_KEY][0] : props?.[BOUNDARY_JOIN_KEY]
const getId = (props) => baseNorm(getName(props))
const idToName = computed(() => {
  const m = new Map()
  for (const f of features.value) m.set(getId(f.properties), getName(f.properties))
  return m
})

function hasValidCoord(g) {
  const scan = (coords) => {
    if (!Array.isArray(coords)) return false
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords
      return Number.isFinite(lon) && Number.isFinite(lat) && lon>=-180&&lon<=180&&lat>=-90&&lat<=90
    }
    return coords.some(scan)
  }
  return scan(g.coordinates || [])
}
function computeBounds(feats) {
  let minLon=Infinity, minLat=Infinity, maxLon=-Infinity, maxLat=-Infinity
  const push = (p) => {
    if (!p) return
    const [lon, lat] = p
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return
    if (lon<minLon) minLon=lon
    if (lat<minLat) minLat=lat
    if (lon>maxLon) maxLon=lon
    if (lat>maxLat) maxLat=lat
  }
  const walk = (coords) => {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') push(coords)
    else coords.forEach(walk)
  }
  for (const f of feats) if (f?.geometry) walk(f.geometry.coordinates)
  return [[minLon, minLat],[maxLon, maxLat]]
}
function fitToDataByIds(ids, animate=true) {
  const set = new Set(ids.map(String))
  const feats = features.value.filter(f => set.has(getId(f.properties)))
  if (!feats.length) return
  const bounds = computeBounds(feats)
  map.fitBounds(bounds, { padding: { top: 60, right: 40, bottom: 60, left: 320 }, duration: animate ? 1000 : 0 })
}
function fitAll() {
  const fts = features.value?.length ? features.value : (geojson.value?.features || [])
  if (!fts.length) return
  const bounds = computeBounds(fts)
  map.fitBounds(bounds, { padding: { top: 60, right: 40, bottom: 60, left: 320 }, duration: 1000 })
}
function saveView() {
  const c = map.getCenter()
  const payload = { center: [c.lng, c.lat], zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() }
  localStorage.setItem(VIEW_KEY, JSON.stringify(payload))
}
function loadSavedView() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null')
    if (v && Array.isArray(v.center) && Number.isFinite(v.zoom)) return v
  } catch {}
  return null
}
const lastSyncLabel = computed(() => lastSync.value ? new Date(lastSync.value).toLocaleString() : 'never')

// -------------------- LOAD LOCAL -----------------------
async function loadLocalFountains () {
  const resp = await fetch(FOUNTAINS_PATH)
  if (!resp.ok) throw new Error(`Failed to load fountains file: ${resp.status}`)
  fountains.value = await resp.json()
  lastSync.value = Date.now()
}

// Find which suburb polygon contains [lon, lat]
function suburbIdAt(lon, lat) {
  const pt = [lon, lat]
  for (const f of features.value) {
    // quick bbox reject
    const [minX, minY, maxX, maxY] = turf.bbox(f)
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue
    if (turf.booleanPointInPolygon(pt, f)) return getId(f.properties)
  }
  return null
}

// -------------------- COUNT PER SUBURB (BATCHED) -------
async function countFountainsPerSuburb() {
  if (!features.value?.length) return
  const pts = fountains.value?.features || []
  if (!pts.length) {
    for (const f of features.value) f.properties.__fountainCount = 0
    return
  }

  counting.value = true
  countProgress.value = 0

  const P = pts.map(p => p.geometry.coordinates) // [lon, lat]
  const total = features.value.length
  const BATCH = 12

  for (let start = 0; start < total; start += BATCH) {
    const end = Math.min(total, start + BATCH)

    for (let i = start; i < end; i++) {
      const f = features.value[i]
      const poly = { type: 'Feature', geometry: f.geometry, properties: {} }

      const [minX, minY, maxX, maxY] = turf.bbox(poly)
      let count = 0
      for (let k = 0; k < P.length; k++) {
        const [x, y] = P[k]
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          if (turf.booleanPointInPolygon(P[k], poly)) count++
        }
      }
      f.properties.__fountainCount = count
    }

    countProgress.value = (end / total)
    await new Promise(r => setTimeout(r, 0)) // yield
  }

  counting.value = false
  countProgress.value = 1
}

// -------------------- RANKING --------------------------
const ranked = computed(() => {
  const counts = features.value
    .map(f => f.properties?.__fountainCount ?? 0)
    .sort((a,b) => a - b)
  const min = counts[0] ?? 0
  const max = counts[counts.length-1] ?? 0
  const denom = Math.max(1, max - min)

  return features.value
    .map(f => {
      const name = getName(f.properties)
      const count = f.properties?.__fountainCount ?? 0
      const t = (count - min) / denom
      const [r,g,b] = lerpRGB(Math.pow(t, 0.7))
      return { id: getId(f.properties), name, count, color: `rgb(${r},${g},${b})` }
    })
    .filter(it => it.name && it.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a,b) => sortMode.value === 'desc' ? b.count - a.count : a.count - b.count)
})
const rankedTotal = computed(() => ranked.value.length)
const rankedLimited = computed(() => ranked.value.slice(0, limit.value))

function isSelected(id){ return selectedIds.value.includes(id) }
function toggleSelect(id) {
  const arr = selectedIds.value.slice()
  const i = arr.indexOf(id)
  if (i >= 0) arr.splice(i,1)
  else arr.push(id)
  selectedIds.value = arr
}
function clearSelection(){ selectedIds.value = [] }
function zoomToItems(ids){ fitToDataByIds(ids, true) }

const selectedZeroCount = computed(() => {
  if (!selectedIds.value.length) return false
  const set = new Set(selectedIds.value)
  return features.value
    .filter(f => set.has(getId(f.properties)))
    .every(f => (f.properties?.__fountainCount ?? 0) === 0)
})

// -------------------- LAYERS ---------------------------
function buildPolygonLayer() {
  const counts = features.value.map(f => f.properties?.__fountainCount ?? 0)
  const min = Math.min(...counts, 0)
  const max = Math.max(...counts, 1)
  const denom = Math.max(1, max - min)

  return new GeoJsonLayer({
    id: 'suburbs-fountain-choropleth',
    data: { type: 'FeatureCollection', features: features.value },
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: f => {
      const count = f.properties?.__fountainCount ?? 0
      const t = (count - min) / denom
      const [r,g,b] = lerpRGB(Math.pow(t, 0.7))
      return [r,g,b,220]
    },
    // outline is blue when selected
    getLineColor: f => isSelected(getId(f.properties)) ? [13,71,161] : [120,120,120],
    getLineWidth: f => isSelected(getId(f.properties)) ? 2 : 0.6,
    lineWidthMinPixels: 0.6,
    updateTriggers: {
      getFillColor: [features.value.length, ...counts],
      getLineColor: [selectedIds.value.join('|')],
      getLineWidth: [selectedIds.value.join('|')]
    },
    onClick: ({object}) => {
      if (!object) return
      toggleSelect(getId(object.properties))
    }
  })
}
function buildFountainLayer () {
  return new IconLayer({
    id: 'fountains',
    data: fountains.value.features,
    pickable: true,
    sizeUnits: 'pixels',
    sizeScale: 1,
    getSize: 24,
    getPosition: f => f.geometry.coordinates,
    getIcon: () => ({
      url: FOUNTAIN_ICON_URL,
      width: 32,
      height: 32,
      anchorY: 32
    }),
    onClick: ({object}) => {
      if (!object) return
      const [lon, lat] = object.geometry.coordinates
      // select the suburb containing this fountain
      const sid = suburbIdAt(lon, lat)
      if (sid) toggleSelect(sid)
      // and zoom
      map.flyTo({ center: [lon, lat], zoom: Math.max(14, map.getZoom()), duration: 800 })
    }
  })
}
function setDeckLayers() {
  if (!deckOverlay) return
  const layers = [buildPolygonLayer()]

  if (showIcons.value) {
    layers.push(buildFountainLayer())
  }

  deckOverlay.setProps({
    layers,
    effects: [lighting],
    getCursor: ({isHovering}) => isHovering ? 'pointer' : 'default',
    getTooltip: ({ object, layer }) => {
      if (!object) return null
      if (layer.id === 'fountains') {
        return { text: `${object.properties?.name || 'Drinking fountain'}\nClick to zoom & select suburb` }
      }
      const name = getName(object.properties)
      const cnt = object.properties?.__fountainCount ?? 0
      const line = cnt > 0 ? `Fountains: ${cnt}` : 'No fountains recorded'
      return { text: `${name ?? 'Suburb'}\n${line}\nClick to select` }
    }
  })
}

// -------------------- INIT -----------------------------
async function init() {
  await nextTick()
  if (!mapEl.value) throw new Error('Map container not ready')

  const saved = loadSavedView()
  const start = saved || DEFAULT_VIEW

  map = new MapLibreMap({
    container: mapEl.value,
    style: BASEMAP_STYLE,
    center: start.center,
    zoom: start.zoom,
    pitch: start.pitch,
    bearing: start.bearing,
    attributionControl: true,
    antialias: true
  })
  deckOverlay = new MapboxOverlay({ interleaved: true })
  map.addControl(deckOverlay)
  map.on('moveend', saveView)

  // Load polygons
  const gjResp = await fetch(GEOJSON_PATH)
  if (!gjResp.ok) throw new Error(`Failed to fetch GeoJSON: ${gjResp.status} ${gjResp.statusText}`)
  const gj = await gjResp.json()

  // Keep only valid polygon geometries
  gj.features = (gj.features || []).filter(f =>
    f && f.geometry &&
    (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') &&
    hasValidCoord(f.geometry)
  )
  geojson.value = gj
  features.value = gj.features.map(f => ({
    ...f,
    properties: { ...f.properties, __fountainCount: 0 }
  }))

  // Load local fountains, compute counts (batched), render
  await loadLocalFountains()
  await countFountainsPerSuburb()
  setDeckLayers()

  if (!saved) fitAll()
  loading.value = false
}

onMounted(() => {
  init().catch(err => {
    console.error(err)
    alert('Could not load water access. Please try again.')
  })
})
onBeforeUnmount(() => {
  if (deckOverlay) deckOverlay.finalize()
  if (map) map.remove()
})

// Re-render layers on selection / data changes
watch(
  [selectedIds, () => fountains.value, () => features.value?.length, showIcons],
  () => setDeckLayers()
)
</script>

<style scoped>
.map-wrap { position: relative; height: 75vh; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 36px rgba(0,0,0,0.12); background: #eef2f3; }
.map { height: 100%; width: 100%; }

.loading { position: absolute; z-index: 3; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); padding: 8px 12px; border-radius: 10px; font-size: .9rem; color: #1565c0; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }

/* Panel */
.panel.fancy { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.95); backdrop-filter: blur(6px); border-radius: 16px; padding: 16px; box-shadow: 0 12px 28px rgba(0,0,0,0.12); width: 360px; max-height: calc(100% - 24px); overflow: auto; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; border: 1px solid rgba(0,0,0,0.08); }
.section-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 8px; color: #0d47a1; display: flex; align-items: center; gap: 6px; }
.legend-card { background:#e3f2fd; border:1px solid #bbdefb; border-radius:12px; padding:8px 10px; margin:10px 0; }
.legend-title { font-weight: 700; color:#0d47a1; margin-bottom: 2px; }

/* Controls */
.controls { display: grid; gap: 8px; }
.search { width: 100%; padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15); font-size: .9rem; }
.toggle { display: flex; gap: 6px; }
.chip { padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); background: #fff; cursor: pointer; font-size: .85rem; }
.chip.active { background: #e3f2fd; border-color: #0d47a1; color: #0d47a1; }
.slider-row { display: flex; align-items: center; gap: 8px; font-size: .85rem; }

/* Ranking */
.rank-list { margin-top: 6px; border-top: 1px dashed rgba(0,0,0,0.12); padding-top: 6px; max-height: 220px; overflow: auto; }
.rank-item { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 6px 4px; border-radius: 8px; cursor: pointer; transition: background .15s; }
.rank-item:hover { background: rgba(0,0,0,0.05); }
.rank-item.selected { background: #e3f2fd; outline: 1px solid #bbdefb; }
.rank-name { display: flex; align-items: center; gap: 8px; }
.bullet { width: 14px; height: 10px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); }
.rank-value { font-weight: 700; color: #0d47a1; }

/* Selection */
.selection { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
.pill { background: #e3f2fd; color: #0d47a1; border: 1px solid #bbdefb; padding: 2px 8px; border-radius: 999px; font-size: .8rem; }

/* Buttons */
.btn { background: #0d47a1; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: .85rem; cursor: pointer; transition: transform .1s ease; }
.btn:hover { transform: scale(1.04); }
.btn.ghost { background: transparent; color: #0d47a1; border: 1px solid #0d47a1; }
.btn:disabled { opacity: .6; cursor: default; }

/* Misc */
.small { font-size: .8rem; }
.muted { color: #555; }
.hint { margin-top: 10px; font-size: .78rem; color: #555; }
.empty-note { margin-top: 8px; background: #fff3e0; border: 1px solid #ffe0b2; color: #e65100; padding: 8px; border-radius: 8px; font-size: .85rem; }

.progress { flex: 1; height: 6px; background: #e0e0e0; border-radius: 999px; overflow: hidden; }
.progress .bar { height: 100%; width: 0%; background: #0d47a1; transition: width .15s linear; }
</style>
