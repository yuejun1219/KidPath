<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import * as turf from '@turf/turf'

/* ---------- Props (host your GeoJSONs somewhere; pass URLs in parent) ---------- */
const props = defineProps({
  parksUrl:  { type: String, required: true }, // e.g. https://.../parks.geojson
  treesUrl:  { type: String, required: true }, // e.g. https://.../trees.geojson
  grassUrl:  { type: String, default: '' },    // optional (visual only)
  basemap:   { type: String, default: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' }
})

/* ---------- State ---------- */
const mapEl = ref(null)
let map = null

const start = ref(null)          // [lng, lat]
const end   = ref(null)          // [lng, lat]
const picking = ref('start')     // 'start' | 'end'
const loading = ref(false)
const loadingMsg = ref('Scoring route alternatives…')
const error = ref('')

const shadeWeight = ref(0.75)    // how much we prioritize shade vs distance in ranking
const parkWeight  = ref(0.6)     // inside ShadeScore: parks vs trees
const treeWeight  = computed(() => 1 - parkWeight.value)

let parksFC  = null
let treesFC  = null
let grassFC  = null // visual only

const routes = ref([])           // [{id, feature, distance, duration, shadeScore}]
const bestRouteId = ref(null)

const hasPoints = computed(() => Array.isArray(start.value) && Array.isArray(end.value))

/* ---------- PERF CONSTANTS ---------- */
const MAX_SAMPLES_PER_ROUTE = 280     // cap samples per route
const TREE_GRID_SIZE_DEG    = 0.002   // ~200–220 m grid cells (lon/lat)
const PARK_NEAR_M           = 30
const TREE_NEAR_M           = 15

/* ---------- UTILS ---------- */
const metersToDeg = (m, lat=-37.8) => {
  const degLat = m / 111320
  const degLon = m / (111320 * Math.cos(lat * Math.PI/180))
  return {degLat, degLon}
}

function toFC(geom){
  return { type:'FeatureCollection', features: Array.isArray(geom?.features) ? geom.features : [] }
}
function setSourceData(id, data){
  if (map && map.getSource(id)) map.getSource(id).setData(data)
}
function km(m){ return (m/1000).toFixed(2) }
function min(s){ return Math.round(s/60) }

/* ---------- Tree spatial index (grid) ---------- */
let treeGrid = new Map()
let treeGridSize = TREE_GRID_SIZE_DEG

function buildTreeGrid(treeFeatures){
  treeGrid = new Map()
  for (const f of treeFeatures){
    const [x,y] = f.geometry.coordinates
    const ix = Math.floor(x / treeGridSize)
    const iy = Math.floor(y / treeGridSize)
    const k = ix + '|' + iy
    if (!treeGrid.has(k)) treeGrid.set(k, [])
    treeGrid.get(k).push(f)
  }
}
function treesInBBoxGrid(bbox){
  const [minX,minY,maxX,maxY] = bbox
  const minIX = Math.floor(minX / treeGridSize)
  const maxIX = Math.floor(maxX / treeGridSize)
  const minIY = Math.floor(minY / treeGridSize)
  const maxIY = Math.floor(maxY / treeGridSize)
  const out = []
  for (let ix=minIX; ix<=maxIX; ix++){
    for (let iy=minIY; iy<=maxIY; iy++){
      const k = ix + '|' + iy
      const arr = treeGrid.get(k)
      if (arr) out.push(...arr)
    }
  }
  return { type:'FeatureCollection', features: out }
}

/* ---------- Parks bbox cache (prefilter) ---------- */
let parkPolys = []
let parkBoxes = [] // [{bbox:[minX,minY,maxX,maxY], f:feature}]

function buildParkBoxes(fc){
  parkPolys = fc.features.filter(f => f.geometry && (f.geometry.type==='Polygon' || f.geometry.type==='MultiPolygon'))
  parkBoxes = parkPolys.map(f => ({ bbox: turf.bbox(f), f }))
}

function rectIntersects(b, pxMin, pyMin, pxMax, pyMax){
  const [minX,minY,maxX,maxY] = b
  return !(maxX < pxMin || minX > pxMax || maxY < pyMin || minY > pyMax)
}

/* ---------- Samplers & proximity tests ---------- */
function sampleAlong(line){
  const lenM = turf.length(line, { units:'kilometers' }) * 1000
  const step = Math.max(20, Math.ceil(lenM / MAX_SAMPLES_PER_ROUTE)) // dynamic step to cap samples
  const pts = []
  for (let d=0; d<=lenM; d+=step){
    pts.push(turf.along(line, d/1000, { units:'kilometers' }))
  }
  return pts
}

function isNearParkFast(pt, bufferMeters = PARK_NEAR_M){
  const [px,py] = pt.geometry.coordinates
  const {degLat,degLon} = metersToDeg(bufferMeters, py)
  const rxMin = px - degLon, rxMax = px + degLon, ryMin = py - degLat, ryMax = py + degLat

  // bbox prefilter
  const candidates = []
  for (const pb of parkBoxes){
    if (rectIntersects(pb.bbox, rxMin, ryMin, rxMax, ryMax)) candidates.push(pb.f)
  }
  if (!candidates.length) return false

  // inside polygon?
  for (const f of candidates){
    if (turf.booleanPointInPolygon(pt, f)) return true
  }

  // near edge ⇒ intersect buffered point with polygon
  const circle = turf.buffer(pt, bufferMeters, { units:'meters' })
  for (const f of candidates){
    if (turf.booleanDisjoint(circle, f) === false) return true
  }
  return false
}

function treesAroundLine(line, padMeters = 150){
  const buf = turf.buffer(line, padMeters, { units:'meters' })
  const bb = turf.bbox(buf)
  return treesInBBoxGrid(bb)
}

function isNearTree(pt, treesSubset, radiusMeters = TREE_NEAR_M){
  const rkm = radiusMeters / 1000
  const [px,py] = pt.geometry.coordinates
  for (const t of treesSubset.features){
    const [tx,ty] = t.geometry.coordinates
    // quick heuristic bbox in degrees
    if (Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001) continue
    const d = turf.distance(pt, t, { units:'kilometers' })
    if (d <= rkm) return true
  }
  return false
}

/* ---------- Shade score & ranking ---------- */
function shadeScore(line){
  if (!parksFC || !treesFC) return 0
  const pts = sampleAlong(line)               // ≤ 280 samples
  const nearTrees = treesAroundLine(line, 150)

  let inParkCnt=0, nearTreeCnt=0
  for (const pt of pts){
    if (isNearParkFast(pt, PARK_NEAR_M)) inParkCnt++
    if (isNearTree(pt, nearTrees, TREE_NEAR_M)) nearTreeCnt++
  }
  const parkRatio = pts.length ? inParkCnt/pts.length : 0
  const treeRatio = pts.length ? nearTreeCnt/pts.length : 0
  return parkWeight.value*parkRatio + treeWeight.value*treeRatio
}

function routeScoreForRanking(rt){
  if (!routes.value.length) return rt.shadeScore
  const ds = routes.value.map(r => r.distance)
  const minD = Math.min(...ds), maxD = Math.max(...ds)
  const distNorm = (maxD === minD) ? 0 : (rt.distance - minD) / (maxD - minD) // 0 shortest → 1 longest
  const coolness = rt.shadeScore
  const efficiency = 1 - distNorm
  return shadeWeight.value*coolness + (1 - shadeWeight.value)*efficiency
}

/* ---------- Routing (OSRM) ---------- */
async function fetchAlternatives(startLngLat, endLngLat){
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort('timeout'), 8000) // 8s

  // Try alternatives first
  let url = `https://router.project-osrm.org/route/v1/foot/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?alternatives=true&steps=false&geometries=geojson&overview=full`
  try {
    const r = await fetch(url, { signal: controller.signal })
    clearTimeout(t)
    if (r.ok) {
      const json = await r.json()
      if (json.routes?.length) return json.routes
    }
  } catch { /* fall through */ }

  // Fallback: single route (faster)
  const r2 = await fetch(
    `https://router.project-osrm.org/route/v1/foot/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?alternatives=false&steps=false&geometries=geojson&overview=full`
  )
  if (!r2.ok) throw new Error('OSRM route fetch failed')
  const j2 = await r2.json()
  return j2.routes || []
}

async function computeRoutes(){
  if (!hasPoints.value) return
  loading.value = true; error.value = ''; loadingMsg.value = 'Fetching routes…'
  try {
    const alts = await fetchAlternatives(start.value, end.value)
    loadingMsg.value = `Scoring ${alts.length} alternative(s)…`

    const out = alts.map((r, idx) => {
      const feat = turf.feature(r.geometry, { id:`r${idx}`, distance:r.distance, duration:r.duration })
      const s = shadeScore(feat)
      return { id:`r${idx}`, feature:feat, distance:r.distance, duration:r.duration, shadeScore:s }
    })
    routes.value = out

    if (routes.value.length){
      const ranked = routes.value
        .map(rt => ({ id:rt.id, score: routeScoreForRanking(rt) }))
        .sort((a,b) => b.score - a.score)
      bestRouteId.value = ranked[0].id
    } else {
      bestRouteId.value = null
    }

    const fcAll = { type:'FeatureCollection', features: routes.value.map(r => ({...r.feature, properties:{...r.feature.properties, id:r.id}})) }
    setSourceData('routes-all', fcAll)
    const best = routes.value.find(r => r.id === bestRouteId.value)
    setSourceData('route-best', best ? { type:'FeatureCollection', features:[best.feature] } : { type:'FeatureCollection', features:[] })
  } catch (e){
    console.error(e); error.value = e.message || 'Failed to compute route'
  } finally {
    loading.value = false
  }
}

/* ---------- Map ---------- */
async function initMap(){
  map = new MapLibreMap({
    container: mapEl.value,
    style: props.basemap,
    center: [144.9631, -37.8136], // Melbourne CBD
    zoom: 12,
    attributionControl: true
  })

  map.on('load', async () => {
    // Sources
    map.addSource('parks', { type:'geojson', data: props.parksUrl })
    if (props.grassUrl) map.addSource('grass', { type:'geojson', data: props.grassUrl })
    map.addSource('trees', { type:'geojson', data: props.treesUrl })

    map.addSource('start',      { type:'geojson', data:{ type:'FeatureCollection', features: [] } })
    map.addSource('end',        { type:'geojson', data:{ type:'FeatureCollection', features: [] } })
    map.addSource('routes-all', { type:'geojson', data:{ type:'FeatureCollection', features: [] } })
    map.addSource('route-best', { type:'geojson', data:{ type:'FeatureCollection', features: [] } })

    // Green layers
    map.addLayer({ id:'parks-fill', type:'fill', source:'parks', paint:{ 'fill-color':'#a5d6a7', 'fill-opacity':0.35 } })
    map.addLayer({ id:'parks-line', type:'line', source:'parks', paint:{ 'line-color':'#388e3c', 'line-width':1 } })
    if (props.grassUrl){
      map.addLayer({ id:'grass-fill', type:'fill', source:'grass', paint:{ 'fill-color':'#cdeac5', 'fill-opacity':0.22 } })
    }
    map.addLayer({ id:'trees-circles', type:'circle', source:'trees', paint:{
      'circle-radius': 2.4, 'circle-color':'#2e7d32', 'circle-opacity':0.55
    }})

    // Routing layers
    map.addLayer({ id:'routes-all-line', type:'line', source:'routes-all', paint:{
      'line-color':'#8e8e8e', 'line-width':3, 'line-dasharray':[2,2], 'line-opacity':0.7
    }})
    map.addLayer({ id:'route-best-line', type:'line', source:'route-best', paint:{
      'line-color':'#1b5e20', 'line-width':6, 'line-opacity':0.95
    }})

    // Start/End markers
    map.addLayer({ id:'start-pt', type:'circle', source:'start', paint:{
      'circle-radius':6, 'circle-color':'#2962ff', 'circle-stroke-color':'#fff', 'circle-stroke-width':2
    }})
    map.addLayer({ id:'end-pt', type:'circle', source:'end', paint:{
      'circle-radius':6, 'circle-color':'#ff1744', 'circle-stroke-color':'#fff', 'circle-stroke-width':2
    }})

    // Click to pick
    map.on('click', (e) => {
      const lngLat = [e.lngLat.lng, e.lngLat.lat]
      if (picking.value === 'start'){ start.value = lngLat }
      else { end.value = lngLat }
    })

    // Preload datasets for scoring & build indexes
    try {
      const [p, t] = await Promise.all([
        fetch(props.parksUrl).then(r => r.json()),
        fetch(props.treesUrl).then(r => r.json())
      ])
      parksFC = toFC(p)
      treesFC = toFC(t)
      buildParkBoxes(parksFC)
      buildTreeGrid(treesFC.features)
      if (props.grassUrl) grassFC = toFC(await fetch(props.grassUrl).then(r => r.json()))
    } catch (e){
      console.warn('Failed to preload greens:', e)
    }
  })
}

function useMyLocation(){
  if (!navigator.geolocation) return alert('Geolocation not available')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lngLat = [pos.coords.longitude, pos.coords.latitude]
      if (picking.value === 'start') start.value = lngLat
      else end.value = lngLat
      map && map.flyTo({ center: lngLat, zoom: 15 })
    },
    () => alert('Could not get your location'),
    { enableHighAccuracy:true, timeout:8000 }
  )
}

function swapPoints(){
  const s = start.value; start.value = end.value; end.value = s
}

function clearPoints(){
  start.value = null; end.value = null; routes.value = []; bestRouteId.value = null
  setSourceData('start', turf.featureCollection([]))
  setSourceData('end',   turf.featureCollection([]))
  setSourceData('routes-all', turf.featureCollection([]))
  setSourceData('route-best', turf.featureCollection([]))
}

/* ---------- Lifecycle ---------- */
onMounted(() => { initMap() })
onBeforeUnmount(() => { if (map) map.remove() })

/* ---------- Watchers ---------- */
watch(start, (v) => setSourceData('start', v ? turf.featureCollection([turf.point(v)]) : turf.featureCollection([])))
watch(end,   (v) => setSourceData('end',   v ? turf.featureCollection([turf.point(v)]) : turf.featureCollection([])))

watch([start, end], () => { if (hasPoints.value) computeRoutes() })

watch([shadeWeight, parkWeight], () => {
  if (!routes.value.length) return
  const ranked = routes.value
    .map(rt => ({ id:rt.id, score:routeScoreForRanking(rt) }))
    .sort((a,b) => b.score - a.score)
  bestRouteId.value = ranked[0].id
  const best = routes.value.find(r => r.id === bestRouteId.value)
  setSourceData('route-best', best ? { type:'FeatureCollection', features:[best.feature] } : { type:'FeatureCollection', features:[] })
})
</script>

<template>
  <div class="cool-route-wrap">
    <div class="sidebar">
      <h2>Cool Route <span class="beta">beta</span></h2>
      <p class="muted">
        Pick two points. We’ll fetch walking routes and choose the
        <strong>coolest</strong> using nearby parks & street trees.
      </p>

      <div class="controls">
        <div class="row">
          <label>Pick</label>
          <div class="seg">
            <button :class="{active: picking==='start'}" @click="picking='start'">Start</button>
            <button :class="{active: picking==='end'}"   @click="picking='end'">End</button>
          </div>
          <div class="seg small">
            <button class="link" @click="useMyLocation">Use my location</button>
            <button class="link" @click="swapPoints" :disabled="!start || !end">Swap</button>
            <button class="link" @click="clearPoints" :disabled="!start && !end">Clear</button>
          </div>
        </div>

        <div class="row">
          <label>Prefer coolness</label>
          <input type="range" min="0" max="1" step="0.05" v-model.number="shadeWeight" />
          <span class="mono">{{ Math.round(shadeWeight*100) }}%</span>
        </div>

        <div class="row">
          <label>Shade mix</label>
          <div class="tiny">Parks</div>
          <input type="range" min="0" max="1" step="0.05" v-model.number="parkWeight" />
          <div class="tiny">Trees</div>
        </div>
      </div>

      <div v-if="loading" class="loading">{{ loadingMsg }}</div>
      <div v-if="error" class="err">⚠️ {{ error }}</div>

      <div v-if="routes.length" class="routes-list">
        <div
          v-for="r in routes"
          :key="r.id"
          class="route-item"
          :class="{best: r.id===bestRouteId}"
          @click="bestRouteId=r.id; setSourceData('route-best', {type:'FeatureCollection', features:[r.feature]})"
        >
          <div class="row1">
            <strong>{{ r.id===bestRouteId ? 'Coolest' : 'Alternative' }}</strong>
            <span class="score">Shade {{ Math.round(r.shadeScore*100) }}%</span>
          </div>
          <div class="row2">
            <span>🛣️ {{ km(r.distance) }} km</span>
            <span>⏱️ {{ min(r.duration) }} min</span>
          </div>
        </div>
      </div>

      <div v-else class="hint">
        Click the map to set <strong>{{ picking==='start' ? 'Start' : 'End' }}</strong>.
      </div>
    </div>

    <div ref="mapEl" class="map"></div>
  </div>
</template>

<style scoped>
.cool-route-wrap{
  display:grid; grid-template-columns: 360px 1fr; gap:16px;
  height: 72vh; max-height: 780px;
}
@media (max-width: 980px){ .cool-route-wrap{ grid-template-columns: 1fr; height: 70vh } }

.sidebar{
  background:#fff; border:1px solid rgba(0,0,0,.08);
  border-radius:16px; padding:12px; overflow:auto;
  box-shadow:0 14px 32px rgba(0,0,0,.08);
}
.beta{
  font-size:.75rem; background:#e8f5e9; color:#1b5e20;
  padding:2px 6px; border-radius:999px; border:1px solid #b9dec1
}
.muted{ color:#566; font-size:.92rem; margin: 4px 0 10px }

.controls{ display:grid; gap:10px; }
.row{
  display:grid; grid-template-columns: 90px 1fr auto;
  align-items:center; gap:8px
}
.seg{ display:flex; gap:6px; flex-wrap:wrap }
.seg.small button{ font-size:.86rem }
.seg button{
  border:1px solid rgba(0,0,0,.12); background:#fff;
  border-radius:8px; padding:6px 10px; cursor:pointer
}
.seg button.active{ background:#e8f5e9; color:#1b5e20; border-color:#1b5e20 }
.link{ background:transparent; border:0; color:#2962ff; cursor:pointer }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.loading{ font-size:.92rem; color:#1b5e20 }
.err{ color:#b00020; margin-top:6px }

.routes-list{ margin-top:10px; display:grid; gap:8px }
.route-item{
  border:1px solid rgba(0,0,0,.08); border-radius:12px;
  padding:8px 10px; cursor:pointer; background:#fff
}
.route-item.best{ outline:2px solid #a5d6a7; background:#f7fbf8 }
.row1{ display:flex; justify-content:space-between; align-items:center; }
.score{ font-weight:700; color:#1b5e20 }
.row2{ display:flex; gap:12px; color:#566; font-size:.92rem }

.map{
  width:100%; height:100%; border-radius:16px;
  overflow:hidden; box-shadow:0 14px 32px rgba(0,0,0,.08)
}
</style>
