<template>
  <div class="map-wrap">
    <div v-if="loading" class="loading">Loading suburbs…</div>
    <div ref="mapEl" class="map"></div>

    <div class="panel">
      <h3>Tree Canopy</h3>

      <div class="row">
        <label>Taller bars show more tree cover.</label>
      </div>

      <div class="row">
        <label>Bar height:</label>
        <input type="range" min="0" max="10" step="0.5" v-model.number="extrudeX" />
        <span>{{ extrudeX.toFixed(1) }}×</span>
      </div>

      <!-- Continuous gradient legend -->
      <div class="legend">
        <div class="legend-title">% tree cover</div>
        <div class="legend-gradient" :style="{ background: legendGradientCss }"></div>
        <div class="legend-labels">
          <span class="end">Lower</span>
          <span class="value">{{ Math.round(colorMin) }}%</span>
          <span class="spacer"></span>
          <span class="value">{{ Math.round(colorMax) }}%</span>
          <span class="end">Higher</span>
        </div>
      </div>


      <!-- ===== RANKING ===== -->
      <div class="section">
        <div class="section-title">
          Explore suburbs
          <span class="muted" v-if="rankedTotal > 0">· {{ rankedTotal }} found</span>
        </div>

        <div class="controls">
          <input
            class="search"
            v-model.trim="search"
            placeholder="Search suburb…"
            @keydown.stop
          />
          <div class="toggle">
            <button
              class="chip"
              :class="{active: sortMode==='desc'}"
              @click="sortMode='desc'"
            >
              Most shaded
            </button>
            <button
              class="chip"
              :class="{active: sortMode==='asc'}"
              @click="sortMode='asc'"
            >
              Least shaded
            </button>
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
            title="Click to select; double-click to zoom"
          >
            <div class="rank-name">
              <span class="bullet" :style="{background: item.color}"></span>
              {{ item.name }}
            </div>
            <div class="rank-value">{{ Math.round(item.value) }}%</div>
          </div>
          <div v-if="!loading && rankedLimited.length===0" class="muted">No suburbs match that search.</div>
        </div>
      </div>

      <!-- ===== COMPARISON ===== -->
      <div class="section" v-if="compareReady">
        <div class="section-title">Compare suburbs</div>
        <div class="compare">
          <div class="col">
            <div class="suburb">{{ compareA.name }}</div>
            <div class="big">{{ Math.round(compareA.value) }}%</div>
          </div>
          <div class="vs">
            <div>vs</div>
            <div class="delta" :class="{up: delta>=0, down: delta<0}">
              {{ delta>=0 ? '+' : '' }}{{ Math.round(delta) }}%
            </div>
          </div>
          <div class="col">
            <div class="suburb">{{ compareB.name }}</div>
            <div class="big">{{ Math.round(compareB.value) }}%</div>
          </div>
        </div>
        <div class="compare-actions">
          <button class="btn" @click="zoomToItems(selectedIds)">Zoom to both</button>
          <button class="btn ghost" @click="clearSelection">Clear</button>
        </div>
        <div class="tiny-muted">Tip: click any two suburbs on the map or in the list.</div>
      </div>

      <div class="hint">Hover a suburb for its name and tree cover.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer } from '@deck.gl/layers'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import { csvParse } from 'd3-dsv'

// import 'maplibre-gl/dist/maplibre-gl.css'  // ensure this is in main.js once

// -------------------- PATHS --------------------
const GEOJSON_PATH = '/datasets/Boundaries_Victoria/georef-australia-state-suburb.geojson'
const CSV_PATH     = '/datasets/suburb-treeVegetation.csv'

// -------------------- JOIN KEYS ----------------
let BOUNDARY_JOIN_KEY = 'scc_name'
let CSV_JOIN_KEY      = 'Suburb'
let CSV_VALUE_COL     = 'Tree Coverage'

// -------------------- MAP VIEW -----------------
const DEFAULT_VIEW = { center: [144.9631, -37.8136], zoom: 8.6, pitch: 55, bearing: 0 }
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const VIEW_KEY = 'canopy3d:view'

// -------------------- STATE --------------------
const mapEl = ref(null)
let map = null
let deckOverlay = null
const extrudeX = ref(4)
const loading = ref(true)

// Ranking/compare UI
const search = ref('')
const sortMode = ref('desc') // 'desc' = most shaded
const limit = ref(20)
const selectedIds = ref([]) // up to 2 ids

// -------------------- LIGHTING -----------------
const ambient = new AmbientLight({ color: [255, 255, 255], intensity: 0.9 })
const dirLight = new DirectionalLight({ color: [255, 255, 255], intensity: 1.2, direction: [ -1, -3, -1 ] })
const lighting = new LightingEffect({ ambient, dirLight })

// -------------------- CONTINUOUS COLOR (with contrast) -------------------
const START = [247, 252, 245]
const END   = [ 27,  94,  32]
const CONTRAST_LOW_PCT  = 5
const CONTRAST_HIGH_PCT = 95
const GAMMA = 0.72

const colorMin = ref(0)
const colorMax = ref(60)
const legendGradientCss =
  `linear-gradient(to right, rgb(${START.join(',')}), rgb(${END.join(',')}))`



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
function colorForValue(v){
  if (!Number.isFinite(v)) return [210,210,210,160]
  let t = (v - colorMin.value) / (colorMax.value - colorMin.value || 1)
  t = clamp01(Math.pow(t, GAMMA))
  const [r,g,b] = lerpRGB(t)
  return [r,g,b,235]
}

// -------------------- DATA ---------------------
// ✅ make features reactive so ranking/comparison update
const joinedFeatures = ref([])     // was: let joinedFeatures = []
let geojson = null

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
function computeBounds(features) {
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
  for (const f of features) if (f?.geometry) walk(f.geometry.coordinates)
  return [[minLon, minLat],[maxLon, maxLat]]
}
function fitToDataByIds(ids, animate=true) {
  const set = new Set(ids.map(String))
  const feats = joinedFeatures.value.filter(f => set.has(getId(f.properties)))
  if (!feats.length) return
  const bounds = computeBounds(feats)
  map.fitBounds(bounds, { padding: { top: 60, right: 40, bottom: 60, left: 320 }, duration: animate ? 1000 : 0 })
}
function fitToAllMatched() {
  const matched = joinedFeatures.value.filter(f => Number.isFinite(f.properties?.__canopyPct))
  const fts = matched.length ? matched : joinedFeatures.value
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

// --------- JOIN (array-safe) ---------------
function joinCSVToGeoJSON(geojson, table, boundaryKey, csvKey, valueCol) {
  const idx = new Map()
  for (const row of table) {
    const k = baseNorm(row[csvKey])
    const v = Number(row[valueCol])
    if (!k || !Number.isFinite(v)) continue
    if (!idx.has(k)) idx.set(k, [])
    idx.get(k).push(v)
  }

  let matched = 0, multi = 0
  for (const f of geojson.features) {
    const props = f.properties || {}
    const raw = props[boundaryKey]
    const names = Array.isArray(raw) ? raw : [raw]

    let agg = null
    for (const nm of names) {
      const key = baseNorm(nm)
      const vals = idx.get(key)
      if (vals?.length) {
        matched++
        if (vals.length > 1) multi++
        const sum = vals.reduce((a,b)=>a+b,0)
        agg = sum / vals.length
        break
      }
    }

    f.properties = { ...props, __canopyPct: Number.isFinite(agg) ? agg : null }
  }
  console.log(`Join matches: ${matched}/${geojson.features.length}; multi-row suburbs: ${multi}`)
  return geojson.features
}

// -------------------- RANKING + COMPARISON --------------------
const ranked = computed(() => {
  const list = joinedFeatures.value
    .filter(f => Number.isFinite(f.properties?.__canopyPct))
    .map(f => {
      const name = getName(f.properties)
      const value = f.properties.__canopyPct
      const [r,g,b] = colorForValue(value)
      return { id: getId(f.properties), name, value, color: `rgb(${r},${g},${b})` }
    })
    .filter(it => it.name && it.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a,b) => sortMode.value === 'desc' ? b.value - a.value : a.value - b.value)
  return list
})
const rankedTotal = computed(() => ranked.value.length)
const rankedLimited = computed(() => ranked.value.slice(0, limit.value))

function isSelected(id){ return selectedIds.value.includes(id) }
function toggleSelect(id) {
  const arr = selectedIds.value.slice()
  const i = arr.indexOf(id)
  if (i >= 0) arr.splice(i,1)
  else {
    if (arr.length >= 2) arr.shift()
    arr.push(id)
  }
  selectedIds.value = arr
}
function clearSelection(){ selectedIds.value = [] }
function zoomToItems(ids){ fitToDataByIds(ids, true) }

const compareReady = computed(() => selectedIds.value.length === 2)
const compareA = computed(() => {
  if (!compareReady.value) return {name:'', value:NaN}
  return ranked.value.find(r => r.id === selectedIds.value[0]) || {name:'', value:NaN}
})
const compareB = computed(() => {
  if (!compareReady.value) return {name:'', value:NaN}
  return ranked.value.find(r => r.id === selectedIds.value[1]) || {name:'', value:NaN}
})
const delta = computed(() => (compareB.value.value ?? 0) - (compareA.value.value ?? 0))

// -------------------- LAYER --------------------
function buildLayer() {
  return new GeoJsonLayer({
    id: 'canopy-3d',
    data: { type: 'FeatureCollection', features: joinedFeatures.value }, // ✅
    pickable: true,
    extruded: true,
    wireframe: false,
    getElevation: f => {
      const v = f.properties?.__canopyPct
      return (Number.isFinite(v) ? v : 0) * 40 * extrudeX.value
    },
    getFillColor: f => colorForValue(f.properties?.__canopyPct),
    getLineColor: f => isSelected(getId(f.properties)) ? [30,120,40] : [120,120,120],
    getLineWidth: f => isSelected(getId(f.properties)) ? 3 : 0.5,
    lineWidthMinPixels: 0.5,
    material: { ambient: 0.5, diffuse: 0.7, shininess: 16 },
    updateTriggers: {
      getElevation: [extrudeX.value],
      getFillColor: [colorMin.value, colorMax.value],
      getLineColor: [selectedIds.value.join('|')],
      getLineWidth: [selectedIds.value.join('|')]
    },
    onClick: ({object}) => {
      if (!object) return
      toggleSelect(getId(object.properties))
    }
  })
}

function setDeckLayers() {
  if (!deckOverlay) return
  deckOverlay.setProps({
    layers: [buildLayer()],
    effects: [lighting],
    getTooltip: ({ object }) => {
      if (!object) return null
      const name = getName(object.properties)
      const v = object.properties?.__canopyPct
      const val = Number.isFinite(v) ? `${Math.round(v)}%` : 'Not available'
      return { text: `${name ?? 'Suburb'}\nTree cover: ${val}\n\nClick to compare` }
    }
  })
}

function resetView() { fitToAllMatched() }

// -------------------- INIT --------------------
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

  // Data
  const gjResp = await fetch(GEOJSON_PATH)
  if (!gjResp.ok) throw new Error(`Failed to fetch GeoJSON: ${gjResp.status} ${gjResp.statusText}`)
  geojson = await gjResp.json()

  // Filter invalid geoms
  const before = geojson.features.length
  geojson.features = geojson.features.filter(f =>
    f && f.geometry &&
    (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') &&
    hasValidCoord(f.geometry)
  )
  console.log(`Filtered geometries: kept ${geojson.features.length}/${before}`)

  // CSV
  const csvText = await fetch(CSV_PATH).then(r => r.text())
  const table = csvParse(csvText)

  // Join
  joinedFeatures.value = joinCSVToGeoJSON(geojson, table, BOUNDARY_JOIN_KEY, CSV_JOIN_KEY, CSV_VALUE_COL) // ✅

  // Color domain (percentile stretch)
  const vals = joinedFeatures.value
    .map(f => f.properties.__canopyPct)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b)

  if (vals.length) {
    const q = p => vals[Math.max(0, Math.min(vals.length-1, Math.round((p/100)*(vals.length-1))))]
    colorMin.value = q(CONTRAST_LOW_PCT)
    colorMax.value = q(CONTRAST_HIGH_PCT)
    console.log(`Color stretch: p${CONTRAST_LOW_PCT}=${colorMin.value.toFixed(1)} → p${CONTRAST_HIGH_PCT}=${colorMax.value.toFixed(1)} (gamma=${GAMMA})`)
  }

  setDeckLayers()

  if (!saved) resetView()

  loading.value = false
}

onMounted(() => {
  init().catch(err => {
    console.error(err)
    alert('Could not load map data. Please try again.')
  })
})
onBeforeUnmount(() => {
  if (deckOverlay) deckOverlay.finalize()
  if (map) map.remove()
})

// Re-render on UI changes
watch([extrudeX, selectedIds], () => setDeckLayers())
</script>

<style scoped>
/* (same styles you had in the previous version) */
.map-wrap { position: relative; height: 75vh; border-radius: 16px; overflow: hidden; box-shadow: 0 14px 32px rgba(0,0,0,0.12); background: #eef2f3; }
.map { height: 100%; width: 100%; }

.loading { position: absolute; z-index: 3; top: 12px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.95); padding: 8px 12px; border-radius: 10px; font-size: .9rem; color: #2e7d32; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }

.panel { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 24px rgba(0,0,0,0.12); font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; width: 340px; max-height: calc(100% - 24px); overflow: auto; }
.panel h3 { font-size: 1.05rem; margin: 0 0 8px; color: #1b5e20; letter-spacing: .2px; }

.row { display: flex; align-items: center; gap: 10px; font-size: .92rem; margin: 8px 0; }
.row input[type="range"] { flex: 1; accent-color: #7c4dff; }
.row label { color: #333; flex: 1; }

.legend { margin: 10px 0 6px; }
.legend-title { font-size: .85rem; color: #333; margin-bottom: 6px; }
.legend-gradient { height: 14px; border-radius: 7px; border: 1px solid rgba(0,0,0,0.12); box-shadow: inset 0 0 6px rgba(0,0,0,0.06); }
.legend-labels { display: grid; grid-template-columns: auto auto 1fr auto auto; align-items: center; gap: 8px; margin-top: 6px; font-size: .8rem; color: #555; }
.legend-labels .end { color: #666; }
.legend-labels .value { font-weight: 600; color: #1b5e20; }
.legend-labels .spacer { width: 100%; }

.buttons { margin-top: 8px; }
.btn { background: #2e7d32; color: #fff; border: none; padding: 6px 10px; border-radius: 8px; font-size: .85rem; cursor: pointer; }
.btn:hover { filter: brightness(1.05); }
.btn.ghost { background: transparent; color: #2e7d32; border: 1px solid #2e7d32; }

.section { margin-top: 12px; }
.section-title { font-size: .9rem; font-weight: 700; color: #1b5e20; margin-bottom: 6px; }

.controls { display: grid; gap: 8px; }
.search { width: 100%; padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15); font-size: .9rem; }
.toggle { display: flex; gap: 6px; }
.chip { padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); background: #fff; cursor: pointer; font-size: .85rem; }
.chip.active { background: #e8f5e9; border-color: #2e7d32; color: #2e7d32; }
.slider-row { display: flex; align-items: center; gap: 8px; font-size: .85rem; }

.rank-list { margin-top: 6px; border-top: 1px dashed rgba(0,0,0,0.12); padding-top: 6px; max-height: 240px; overflow: auto; }
.rank-item { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 6px 4px; border-radius: 8px; cursor: pointer; }
.rank-item:hover { background: rgba(0,0,0,0.05); }
.rank-item.selected { background: #e6f4ea; outline: 1px solid #c5e1ca; }
.rank-name { display: flex; align-items: center; gap: 8px; }
.bullet { width: 14px; height: 10px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); }
.rank-value { font-weight: 700; color: #1b5e20; }
.muted { color: #666; font-size: .85rem; }
.tiny-muted { color: #666; font-size: .75rem; margin-top: 6px; }

.compare { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; padding: 8px; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; background: rgba(255,255,255,0.6); }
.col { text-align: center; }
.suburb { font-weight: 600; margin-bottom: 4px; }
.big { font-size: 1.2rem; font-weight: 800; color: #1b5e20; }
.vs { text-align: center; color: #444; }
.delta { font-size: .9rem; font-weight: 700; }
.delta.up { color: #1b5e20; }
.delta.down { color: #b00020; }
.compare-actions { display: flex; gap: 8px; margin-top: 6px; }
.hint { margin-top: 8px; font-size: .78rem; color: #555; }
</style>
