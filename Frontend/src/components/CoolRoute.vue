<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import * as turf from '@turf/turf'

/* ---------- Props (host your GeoJSONs somewhere; pass URLs in parent) ---------- */
const props = defineProps({
  parksUrl:  { type: String, required: true }, // e.g. https://.../parks.geojson
  treesUrl:  { type: String, required: true }, // e.g. https://.../trees.geojson
  basemap:   { type: String, default: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  showSidebar: { type: Boolean, default: false } // Control sidebar visibility
})

/* ---------- Emits ---------- */
const emit = defineEmits(['toggle-sidebar'])

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

const routes = ref([])           // [{id, feature, distance, duration, shadeScore}]
const bestRouteId = ref(null)
const showResultsPanel = ref(false)
const showAddressPanel = ref(false)
const startAddress = ref('')
const endAddress = ref('')

// Trees lazy-loading controls
const treesAdded = ref(false)
const treesVisible = ref(false) // default off to save bandwidth/rendering

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

  // 1) Try OSRM alternatives (using cycling profile for better pedestrian routes)
  let url = `https://router.project-osrm.org/route/v1/bike/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?alternatives=true&steps=false&geometries=geojson&overview=full`
  try {
    const r = await fetch(url, { signal: controller.signal })
    clearTimeout(t)
    if (r.ok) {
      const json = await r.json()
      if (json.routes?.length > 1) return json.routes
      if (json.routes?.length === 1) {
        // keep OSRM’s main route, but also synthesize alts
        return await synthesizeAlternatives(startLngLat, endLngLat, json.routes[0])
      }
    }
  } catch { /* fall through */ }

  // 2) Fallback: single route only
  const r2 = await fetch(
    `https://router.project-osrm.org/route/v1/bike/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?alternatives=false&steps=false&geometries=geojson&overview=full`
  )
  if (!r2.ok) throw new Error('OSRM route fetch failed')
  const j2 = await r2.json()
  if (!j2.routes?.length) return []

  return await synthesizeAlternatives(startLngLat, endLngLat, j2.routes[0])
}

// helper: build fake alternatives by inserting offset midpoints
async function synthesizeAlternatives(startLngLat, endLngLat, baseRoute){
  const mid = turf.midpoint(turf.point(startLngLat), turf.point(endLngLat))
  const bearing = turf.bearing(turf.point(startLngLat), turf.point(endLngLat))

  const offsets = [200, 350] // meters
  const candidates = []
  for (const m of offsets){
    const left  = turf.destination(mid, m/1000, bearing - 90, {units:'kilometers'})
    const right = turf.destination(mid, m/1000, bearing + 90, {units:'kilometers'})
    candidates.push(left, right)
  }

  const alts = []
  for (const c of candidates){
    try {
      const a = await fetch(`https://router.project-osrm.org/route/v1/bike/${startLngLat[0]},${startLngLat[1]};${c.geometry.coordinates[0]},${c.geometry.coordinates[1]}?alternatives=false&steps=false&geometries=geojson&overview=full`).then(r=>r.json())
      const b = await fetch(`https://router.project-osrm.org/route/v1/bike/${c.geometry.coordinates[0]},${c.geometry.coordinates[1]};${endLngLat[0]},${endLngLat[1]}?alternatives=false&steps=false&geometries=geojson&overview=full`).then(r=>r.json())
      if (a.routes?.length && b.routes?.length){
        alts.push({
          distance: a.routes[0].distance + b.routes[0].distance,
          duration: a.routes[0].duration + b.routes[0].duration,
          geometry: { type:'LineString', coordinates:[...a.routes[0].geometry.coordinates, ...b.routes[0].geometry.coordinates] }
        })
      }
    } catch { /* skip failed leg */ }
  }

  // dedup + combine with base
  const all = [baseRoute, ...alts]
  const uniq = []
  for (const r of all){
    if (!uniq.find(u => Math.abs(u.distance - r.distance) < 25)) uniq.push(r)
  }
  return uniq
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
    // Retro video game aesthetic
    renderWorldCopies: false,
    attributionControl: true
  })

  map.on('load', async () => {
    // Sources
    map.addSource('parks', { type:'geojson', data: props.parksUrl })
    // trees source will be added lazily when zoom >= 15 or when explicitly enabled

    map.addSource('start',      { type:'geojson', data:{ type:'FeatureCollection', features: [] } })
    map.addSource('end',        { type:'geojson', data:{ type:'FeatureCollection', features: [] } })
    map.addSource('routes-all', { type:'geojson', data:{ type:'FeatureCollection', features: [] } })
    map.addSource('route-best', { type:'geojson', data:{ type:'FeatureCollection', features: [] } })

    // Retro green layers
    map.addLayer({ id:'parks-fill', type:'fill', source:'parks', paint:{ 'fill-color':'#00ff41', 'fill-opacity':0.4 } })
    map.addLayer({ id:'parks-line', type:'line', source:'parks', paint:{ 'line-color':'#00ff41', 'line-width':2 } })
    // Trees layer will be added lazily with visibility controlled by treesVisible

    // Retro routing layers
    map.addLayer({ id:'routes-all-line', type:'line', source:'routes-all', paint:{
      'line-color':'#666', 'line-width':4, 'line-dasharray':[4,4], 'line-opacity':0.8
    }})
    // Black outline for best route
    map.addLayer({ id:'route-best-outline', type:'line', source:'route-best', paint:{
      'line-color':'#000', 'line-width':12, 'line-opacity':1
    }})
    // Cyan best route on top
    map.addLayer({ id:'route-best-line', type:'line', source:'route-best', paint:{
      'line-color':'#00ffff', 'line-width':8, 'line-opacity':1
    }})

    // Retro Start/End markers
    map.addLayer({ id:'start-pt', type:'circle', source:'start', paint:{
      'circle-radius':8, 'circle-color':'#00ff41', 'circle-stroke-color':'#000', 'circle-stroke-width':3
    }})
    map.addLayer({ id:'end-pt', type:'circle', source:'end', paint:{
      'circle-radius':8, 'circle-color':'#ff0000', 'circle-stroke-color':'#000', 'circle-stroke-width':3
    }})

    // Click to pick
    map.on('click', (e) => {
      const lngLat = [e.lngLat.lng, e.lngLat.lat]
      if (picking.value === 'start'){ start.value = lngLat }
      else { end.value = lngLat }
    })

    // Preload datasets for scoring & build indexes
    try {
      // Only preload parks initially; trees are heavy so defer until needed
      const p = await fetch(props.parksUrl).then(r => r.json())
      parksFC = toFC(p)
      buildParkBoxes(parksFC)
    } catch (e){
      console.warn('Failed to preload greens:', e)
    }

    // Lazy add trees when zoomed in enough
    const ensureTrees = async () => {
      if (!treesAdded.value && (treesVisible.value || map.getZoom() >= 15)) {
        try {
          // Fetch trees once
          if (!treesFC) {
            const t = await fetch(props.treesUrl).then(r => r.json())
            treesFC = toFC(t)
            buildTreeGrid(treesFC.features)
          }
          if (!map.getSource('trees')) {
            map.addSource('trees', { type:'geojson', data: treesFC })
          }
          if (!map.getLayer('trees-circles')) {
            map.addLayer({ id:'trees-circles', type:'circle', source:'trees', paint:{
              'circle-radius': 3, 'circle-color':'#00ff41', 'circle-opacity':0.8, 'circle-stroke-color':'#000', 'circle-stroke-width':1
            }})
          }
          map.setLayoutProperty('trees-circles', 'visibility', treesVisible.value ? 'visible' : 'none')
          treesAdded.value = true
        } catch (e){ console.warn('Failed to add trees layer:', e) }
      } else if (treesAdded.value && map.getLayer('trees-circles')) {
        // Update visibility based on toggle
        map.setLayoutProperty('trees-circles', 'visibility', treesVisible.value && map.getZoom() >= 15 ? 'visible' : 'none')
      }
    }

    // Initial call and on zoom changes
    ensureTrees()
    map.on('zoomend', ensureTrees)
    // Expose a simple keyboard toggle (T) without changing UI layout
    window.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T') { treesVisible.value = !treesVisible.value; ensureTrees() }
    })
  })
}

// add below existing refs/computed
function applyPreset(name){
  if (name==='fast'){ shadeWeight.value = 0.2; parkWeight.value = 0.4 }
  else if (name==='balanced'){ shadeWeight.value = 0.6; parkWeight.value = 0.6 }
  else if (name==='cool'){ shadeWeight.value = 0.9; parkWeight.value = 0.5 }
}

function selectBest(id){
  bestRouteId.value = id
  const best = routes.value.find(r => r.id===id)
  setSourceData('route-best', best ? { type:'FeatureCollection', features:[best.feature] } : turf.featureCollection([]))
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

function openInGoogleMaps(route){
  if (!start.value || !end.value) return
  
  // Get start and end coordinates
  const startCoords = `${start.value[1]},${start.value[0]}`
  const endCoords = `${end.value[1]},${end.value[0]}`
  
  // Create Google Maps URL with cycling directions
  const googleMapsUrl = `https://www.google.com/maps/dir/${startCoords}/${endCoords}/@${start.value[1]},${start.value[0]},15z/data=!3m1!4b1!4m2!4m1!3e3`
  
  // Open in new tab
  window.open(googleMapsUrl, '_blank')
}

async function geocodeAddress(address) {
  try {
    // Use OpenStreetMap Nominatim API (free and reliable)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Melbourne, Australia')}&limit=1&addressdetails=1`)
    const data = await response.json()
    
    if (data && data.length > 0) {
      const [lng, lat] = [parseFloat(data[0].lon), parseFloat(data[0].lat)]
      return [lng, lat]
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

async function searchStartAddress() {
  if (!startAddress.value.trim()) return
  
  const coords = await geocodeAddress(startAddress.value)
  if (coords) {
    start.value = coords
    setSourceData('start', turf.point(coords))
    // Center map on the new location
    if (map) {
      map.flyTo({ center: coords, zoom: 15 })
    }
  } else {
    alert('Address not found. Please try a different address.')
  }
}

async function searchEndAddress() {
  if (!endAddress.value.trim()) return
  
  const coords = await geocodeAddress(endAddress.value)
  if (coords) {
    end.value = coords
    setSourceData('end', turf.point(coords))
    // Center map on the new location
    if (map) {
      map.flyTo({ center: coords, zoom: 15 })
    }
  } else {
    alert('Address not found. Please try a different address.')
  }
}

async function searchBothAddresses() {
  if (!startAddress.value.trim() || !endAddress.value.trim()) {
    alert('Please enter both start and end addresses.')
    return
  }
  
  const startCoords = await geocodeAddress(startAddress.value)
  const endCoords = await geocodeAddress(endAddress.value)
  
  if (startCoords && endCoords) {
    start.value = startCoords
    end.value = endCoords
    setSourceData('start', turf.point(startCoords))
    setSourceData('end', turf.point(endCoords))
    
    // Center map between the two points
    if (map) {
      const bounds = turf.bbox(turf.lineString([startCoords, endCoords]))
      map.fitBounds(bounds, { padding: 50 })
    }
  } else {
    alert('One or both addresses not found. Please try different addresses.')
  }
}

function clearAddresses() {
  startAddress.value = ''
  endAddress.value = ''
  start.value = null
  end.value = null
  setSourceData('start', turf.featureCollection([]))
  setSourceData('end', turf.featureCollection([]))
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
    <!-- Toggle buttons for mobile only -->
    <div class="toggle-buttons">
      <button 
        v-if="!showSidebar" 
        @click="emit('toggle-sidebar')" 
        class="toggle-up-btn"
        title="Show Menu"
      >
        ↑
      </button>
      <button 
        v-if="showSidebar" 
        @click="emit('toggle-sidebar')" 
        class="toggle-down-btn"
        title="Hide Menu"
      >
        ↓
      </button>
    </div>
    
    <div class="sidebar" :class="{ 'sidebar-hidden': !showSidebar }">
      <h2>Cool Route <span class="beta">beta</span></h2>
      <p class="muted">
        Pick two points. We’ll fetch walking routes and choose the
        <strong>coolest</strong> using nearby parks & street trees.
      </p>

     <div class="controls">

  <!-- Step chips -->
  <div class="steps">
    <button :class="{on: picking==='start'}" @click="picking='start'">① Set Start</button>
    <button :class="{on: picking==='end'}"   @click="picking='end'">② Set End</button>
    <button class="ghost" @click="useMyLocation">Use my location</button>
    <button class="ghost" @click="swapPoints" :disabled="!start || !end">Swap</button>
    <button class="ghost" @click="clearPoints" :disabled="!start && !end">Clear</button>
  </div>

  <!-- Presets -->
  <div class="presets">
    <span class="label">Quick presets</span>
    <div class="pill-row">
      <button @click="applyPreset('fast')">Fastest</button>
      <button @click="applyPreset('balanced')">Balanced</button>
      <button @click="applyPreset('cool')">Max shade</button>
    </div>
  </div>

  <!-- Coolness vs Speed -->
  <div class="field">
    <div class="label">
      Prefer coolness
      <span class="help-dot" title="Blend of shade vs distance. Higher = more shade, lower = quicker route.">?</span>
    </div>
    <div class="slider-wrap">
      <span class="tick">Faster</span>
      <input type="range" min="0" max="1" step="0.05" v-model.number="shadeWeight" />
      <span class="tick">Cooler</span>
      <span class="value">{{ Math.round(shadeWeight*100) }}%</span>
    </div>
  </div>

  <!-- Mix: Parks vs Street trees -->
  <div class="field">
    <div class="label">
      Shade comes from…
      <span class="hint" title="How we score shade: inside parks vs near street trees.">?</span>
    </div>
    <div class="slider-wrap two">
      <span class="tick">Parks</span>
      <input type="range" min="0" max="1" step="0.05" v-model.number="parkWeight" />
      <span class="tick">Street trees</span>
      <span class="value">{{ Math.round(parkWeight*100) }}% parks</span>
    </div>
    <div class="mini-legend">
      <span class="chip park">Parks</span>
      <span class="chip tree">Street trees</span>
    </div>
  </div>
</div>




      <div v-if="loading" class="loading">{{ loadingMsg }}</div>
      <div v-if="error" class="err">⚠️ {{ error }}</div>

      <!-- Address Search Toggle Button -->
      <div class="address-toggle">
        <button @click="showAddressPanel = !showAddressPanel" class="toggle-btn">
          {{ showAddressPanel ? 'HIDE ADDRESS SEARCH' : 'ADDRESS SEARCH' }}
        </button>
      </div>

      <!-- Results Toggle Button -->
      <div v-if="routes.length" class="results-toggle">
        <button @click="showResultsPanel = !showResultsPanel" class="toggle-btn">
          {{ showResultsPanel ? 'HIDE ROUTES' : 'SHOW ROUTES' }}
        </button>
      </div>

      <div v-else class="hint">
        Click the map to set <strong>{{ picking==='start' ? 'Start' : 'End' }}</strong>.
      </div>
    </div>

  <div ref="mapEl" class="map"></div>
</div>

<!-- Slide-in Results Panel -->
<div v-if="routes.length" class="results-panel" :class="{ 'panel-open': showResultsPanel }">
  <div class="panel-header">
    <h3>ROUTE OPTIONS</h3>
    <button @click="showResultsPanel = false" class="close-btn">×</button>
  </div>
  <div class="route-list">
    <div
      v-for="r in routes"
      :key="r.id"
      class="route-item"
      :class="{best: r.id===bestRouteId}"
      @click="bestRouteId=r.id; setSourceData('route-best', {type:'FeatureCollection', features:[r.feature]})"
    >
      <div class="row1">
        <strong>{{ r.id===bestRouteId ? 'COOLEST' : 'ALTERNATIVE' }}</strong>
        <span class="score">{{ Math.round(r.shadeScore * 100) }}% COOL</span>
      </div>
      <div class="row2">
        <span>{{ km(r.distance) }} KM</span>
        <span>{{ min(r.duration) }} MIN</span>
      </div>
      <div class="row3">
        <button @click.stop="openInGoogleMaps(r)" class="google-maps-btn">
          VIEW IN GOOGLE MAPS
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Slide-in Address Panel -->
<div class="address-panel" :class="{ 'panel-open': showAddressPanel }">
  <div class="panel-header">
    <h3>ADDRESS SEARCH</h3>
    <button @click="showAddressPanel = false" class="close-btn">×</button>
  </div>
  <div class="address-form">
    <div class="input-group">
      <label>START ADDRESS</label>
      <input 
        v-model="startAddress" 
        type="text" 
        placeholder="Enter start address..."
        class="address-input"
        @keyup.enter="searchStartAddress"
      />
      <button @click="searchStartAddress" class="search-btn">SEARCH</button>
    </div>
    
    <div class="input-group">
      <label>END ADDRESS</label>
      <input 
        v-model="endAddress" 
        type="text" 
        placeholder="Enter end address..."
        class="address-input"
        @keyup.enter="searchEndAddress"
      />
      <button @click="searchEndAddress" class="search-btn">SEARCH</button>
    </div>
    
    <div class="address-actions">
      <button @click="clearAddresses" class="clear-btn">CLEAR ALL</button>
      <button @click="searchBothAddresses" class="search-both-btn">SEARCH BOTH</button>
    </div>
    
    <div v-if="routes.length" class="routes-action">
      <button @click="showResultsPanel = true; showAddressPanel = false" class="show-routes-btn">
        SHOW ROUTES
      </button>
    </div>
  </div>
</div>
</template>

<style scoped>
.cool-route-wrap{
  display:grid; grid-template-columns: 360px 1fr; gap:16px;
  height: 100%; min-height: 100%;
  position: relative;
}

/* Toggle buttons */
.toggle-buttons{
  position: absolute;
  top: 120px; /* Below navbar */
  left: 20px;
  z-index: 1000;
  display: none; /* Hidden by default, shown on mobile */
}

.toggle-up-btn, .toggle-down-btn{
  width: 50px;
  height: 50px;
  border: 3px solid #000;
  background: #00ff41;
  color: #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
  transition: all .1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-up-btn:hover, .toggle-down-btn:hover{
  background: #fff;
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #000;
}

/* Sidebar visibility */
.sidebar{
  background:#fff; border:3px solid #fff;
  border-radius:0; padding:30px; overflow:auto;
  box-shadow:0 0 0 2px #fff;
  transition: transform 0.3s ease;
  font-family: 'Press Start 2P', monospace;
  position: relative; /* Ensure proper positioning on desktop */
}

.sidebar-hidden{
  transform: translateX(-100%);
}

/* When sidebar is shown, adjust grid */
.cool-route-wrap:has(.sidebar:not(.sidebar-hidden)){
  grid-template-columns: 360px 1fr;
}

/* Desktop: Show sidebar by default */
@media (min-width: 981px){
  .sidebar{
    display: block !important;
    position: relative !important;
    transform: none !important;
  }
}
@media (max-width: 980px){ 
  .cool-route-wrap{ 
    grid-template-columns: 1fr !important; 
    height: 100%; 
    min-height: 100%; 
    gap: 8px;
  }
  
  /* Mobile sidebar behavior - force override */
  .sidebar{
    /* Override desktop positioning for mobile */
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 999 !important;
    transform: translateY(100%) !important;
    padding: 120px 16px 16px 16px !important; /* Top padding to account for navbar */
    overflow-y: auto !important;
    box-sizing: border-box !important;
    display: block !important;
  }
  
  .sidebar:not(.sidebar-hidden){
    transform: translateY(0) !important;
  }
  
  /* Ensure toggle buttons are visible on mobile */
  .toggle-buttons{
    display: block !important;
    position: fixed !important;
    top: 120px !important; /* Below navbar */
    left: 20px !important;
    z-index: 1000 !important;
  }
  
  
  
  .toggle-up-btn, .toggle-down-btn{
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  
  /* Override grid when sidebar is shown on mobile */
  .cool-route-wrap:has(.sidebar:not(.sidebar-hidden)){
    grid-template-columns: 1fr;
  }
  
  /* Mobile button adjustments */
  .steps button{ 
    padding: 6px 10px; 
    font-size:.45rem;
  }
  
  .seg button{
    padding: 4px 8px;
    font-size:.4rem;
  }
  
  .pill-row button{ 
    padding: 4px 8px;
    font-size:.4rem;
  }
  
  /* Mobile address panel */
  .address-panel{
    width: 90vw;
    left: -90vw;
  }
  
  /* Mobile results panel */
  .results-panel{
    width: 90vw;
    right: -90vw;
  }
  
  /* Mobile input adjustments */
  .address-input{
    padding: 10px 12px;
    font-size:.45rem;
  }
  
  .search-btn, .clear-btn, .search-both-btn{
    padding: 6px 10px;
    font-size:.4rem;
  }
  
  .show-routes-btn{
    padding: 10px 14px;
    font-size:.45rem;
  }
}


/* Small mobile screens */
@media (max-width: 480px){
  .cool-route-wrap{ 
    gap: 4px;
  }
  
  .sidebar{
    padding: 12px;
    max-height: 35vh;
  }
  
  /* Even smaller buttons for small screens */
  .steps button{ 
    padding: 4px 8px; 
    font-size:.4rem;
  }
  
  .seg button{
    padding: 3px 6px;
    font-size:.35rem;
  }
  
  .pill-row button{ 
    padding: 3px 6px;
    font-size:.35rem;
  }
  
  .toggle-btn{
    padding: 8px 12px;
    font-size:.45rem;
  }
  
  /* Smaller panels for small screens */
  .address-panel, .results-panel{
    width: 95vw;
  }
  
  .address-panel{
    left: -95vw;
  }
  
  .results-panel{
    right: -95vw;
  }
  
  /* Smaller text for small screens */
  .muted{
    font-size:.6rem;
  }
  
  .label{
    font-size:.5rem;
  }
  
  .hint{
    font-size:.5rem;
  }
  
  /* Panel headers */
  .panel-header h3{
    font-size:.55rem;
  }
  
  .close-btn{
    width:20px;
    height:20px;
    font-size:14px;
  }
}

/* Landscape mobile orientation */
@media (max-width: 980px) and (orientation: landscape){
  .sidebar{
    max-height: 50vh;
  }
  
  .address-panel, .results-panel{
    height: calc(100vh - 80px);
    top: 80px;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse){
  /* Larger touch targets for mobile */
  .steps button, .seg button, .pill-row button{
    min-height: 44px;
    min-width: 44px;
  }
  
  .toggle-btn, .search-btn, .clear-btn, .search-both-btn, .show-routes-btn{
    min-height: 44px;
  }
  
  .close-btn{
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Remove hover effects on touch devices */
  .steps button:hover, .seg button:hover, .pill-row button:hover,
  .toggle-btn:hover, .search-btn:hover, .clear-btn:hover, 
  .search-both-btn:hover, .show-routes-btn:hover, .close-btn:hover{
    transform: none;
    box-shadow: 2px 2px 0 #000;
  }
  
  .address-input:focus{
    transform: none;
    box-shadow: 2px 2px 0 #000;
  }
}

.sidebar{
  background:#fff; border:3px solid #fff;
  border-radius:0; padding:30px; overflow:auto;
  box-shadow:0 0 0 2px #fff;
  font-family: 'Press Start 2P', monospace;
}
.beta{
  font-size:.55rem; background:#00ff41; color:#000;
  padding:3px 6px; border-radius:0; border:2px solid #000;
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
  box-shadow:2px 2px 0 #000;
}
.muted{ color:#333; font-size:.65rem; margin: 10px 0 14px; font-family: 'Press Start 2P', monospace; line-height: 1.5; }

.controls{ display:grid; gap:16px; }
.row{
  display:grid; grid-template-columns: 90px 1fr auto;
  align-items:center; gap:8px
}
.seg{ display:flex; gap:6px; flex-wrap:wrap }
.seg.small button{ font-size:.86rem }
.seg button{
  border:2px solid #000; background:#fff;
  border-radius:0; padding:6px 10px; cursor:pointer;
  font-family: 'Press Start 2P', monospace;
  font-size:.5rem;
  text-transform: uppercase;
  box-shadow:2px 2px 0 #000;
  transition: all .1s;
}
.seg button:hover{
  transform: translate(1px, 1px);
  box-shadow:1px 1px 0 #000;
}
.seg button.active{ 
  background:#00ff41; 
  color:#000; 
  border-color:#000;
  box-shadow:2px 2px 0 #000;
}
.link{ background:transparent; border:0; color:#2962ff; cursor:pointer }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.loading{ font-size:.92rem; color:#1b5e20 }
.err{ color:#b00020; margin-top:6px }

/* Address Toggle Button */
.address-toggle{ margin-top:16px; }

/* Results Toggle Button */
.results-toggle{ margin-top:16px; }
.toggle-btn{
  width:100%; padding:12px 16px; border:3px solid #000; background:#00ff41;
  color:#000; font-family: 'Press Start 2P', monospace; font-size:.5rem;
  text-transform: uppercase; cursor:pointer; box-shadow:3px 3px 0 #000;
  transition: all .1s;
}
.toggle-btn:hover{
  transform: translate(1px, 1px); box-shadow:2px 2px 0 #000;
}

/* Slide-in Results Panel */
.results-panel{
  position:fixed; top:100px; right:-400px; width:380px; height:calc(100vh - 100px);
  background:#fff; border:3px solid #000; box-shadow:-3px 0 0 #000;
  transition: right 0.3s ease; z-index:1000; overflow-y:auto;
}
.results-panel.panel-open{ right:0; }

.panel-header{
  display:flex; justify-content:space-between; align-items:center;
  padding:16px 20px; border-bottom:2px solid #000;
  background:#00ff41;
}
.panel-header h3{
  font-family: 'Press Start 2P', monospace; font-size:.6rem;
  color:#000; margin:0; text-transform: uppercase;
}
.close-btn{
  width:24px; height:24px; border:2px solid #000; background:#fff;
  color:#000; font-size:16px; font-weight:bold; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  box-shadow:2px 2px 0 #000; transition: all .1s;
}
.close-btn:hover{
  transform: translate(1px, 1px); box-shadow:1px 1px 0 #000;
}

.route-list{ padding:16px; display:grid; gap:12px; }
.route-item{
  border:2px solid #000; border-radius:0; padding:12px 16px;
  cursor:pointer; background:#fff; box-shadow:2px 2px 0 #000;
  transition: all .1s; font-family: 'Press Start 2P', monospace;
}
.route-item:hover{
  transform: translate(1px, 1px); box-shadow:1px 1px 0 #000;
}
.route-item.best{ 
  background:#00ff41; border-color:#000; box-shadow:2px 2px 0 #000;
}
.row1{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.row1 strong{ font-size:.5rem; text-transform: uppercase; }
.score{ font-size:.5rem; font-weight:normal; text-transform: uppercase; }
.row2{ display:flex; gap:16px; font-size:.45rem; text-transform: uppercase; margin-bottom:8px; }
.row3{ margin-top:8px; }
.google-maps-btn{
  width:100%; padding:8px 12px; border:2px solid #000; background:#fff;
  color:#000; font-family: 'Press Start 2P', monospace; font-size:.4rem;
  text-transform: uppercase; cursor:pointer; box-shadow:2px 2px 0 #000;
  transition: all .1s;
}
.google-maps-btn:hover{
  background:#00ff41; transform: translate(1px, 1px); box-shadow:1px 1px 0 #000;
}

/* Slide-in Address Panel */
.address-panel{
  position:fixed; top:100px; left:-400px; width:380px; height:calc(100vh - 100px);
  background:#fff; border:3px solid #000; box-shadow:3px 0 0 #000;
  transition: left 0.3s ease; z-index:1000; overflow-y:auto;
}
.address-panel.panel-open{ left:0; }

.address-form{ padding:20px; display:grid; gap:20px; }
.input-group{ display:grid; gap:8px; }
.input-group label{
  font-family: 'Press Start 2P', monospace; font-size:.5rem;
  color:#333; text-transform: uppercase;
}
.address-input{
  padding:12px 16px; border:2px solid #000; background:#fff;
  font-family: 'Press Start 2P', monospace; font-size:.5rem;
  text-transform: uppercase; box-shadow:2px 2px 0 #000;
  transition: all .1s;
}
.address-input:focus{
  outline:none; background:#00ff41; transform: translate(1px, 1px);
  box-shadow:1px 1px 0 #000;
}
.search-btn{
  padding:8px 12px; border:2px solid #000; background:#fff;
  color:#000; font-family: 'Press Start 2P', monospace; font-size:.45rem;
  text-transform: uppercase; cursor:pointer; box-shadow:2px 2px 0 #000;
  transition: all .1s;
}
.search-btn:hover{
  background:#00ff41; transform: translate(1px, 1px); box-shadow:1px 1px 0 #000;
}
.address-actions{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px; }
.clear-btn{
  padding:8px 12px; border:2px solid #000; background:#fff;
  color:#000; font-family: 'Press Start 2P', monospace; font-size:.45rem;
  text-transform: uppercase; cursor:pointer; box-shadow:2px 2px 0 #000;
  transition: all .1s;
}
.clear-btn:hover{
  background:#ff6b6b; transform: translate(1px, 1px); box-shadow:1px 1px 0 #000;
}
.search-both-btn{
  padding:8px 12px; border:2px solid #000; background:#00ff41;
  color:#000; font-family: 'Press Start 2P', monospace; font-size:.45rem;
  text-transform: uppercase; cursor:pointer; box-shadow:2px 2px 0 #000;
  transition: all .1s;
}
.search-both-btn:hover{
  background:#fff; transform: translate(1px, 1px); box-shadow:1px 1px 0 #000;
}
.routes-action{ margin-top:16px; }
.show-routes-btn{
  width:100%; padding:12px 16px; border:3px solid #000; background:#00ff41;
  color:#000; font-family: 'Press Start 2P', monospace; font-size:.5rem;
  text-transform: uppercase; cursor:pointer; box-shadow:3px 3px 0 #000;
  transition: all .1s;
}
.show-routes-btn:hover{
  background:#fff; transform: translate(1px, 1px); box-shadow:2px 2px 0 #000;
}

.map{
  width:100%; height:100%; border-radius:0;
  overflow:hidden; 
  border:3px solid #fff;
  box-shadow:0 0 0 2px #fff;
}

.steps{ display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px }
.steps button{ 
  padding:8px 12px; 
  border-radius:0; 
  border:3px solid #000; 
  background:#fff; 
  font-family: 'Press Start 2P', monospace;
  font-size:.5rem;
  text-transform: uppercase;
  box-shadow:3px 3px 0 #000;
  transition: all .1s;
  cursor: pointer;
}
.steps button:hover{
  transform: translate(1px, 1px);
  box-shadow:2px 2px 0 #000;
}
.steps button.on{ 
  background:#00ff41; 
  border-color:#000; 
  color:#000;
  box-shadow:3px 3px 0 #000;
}
.steps .ghost{ 
  background:transparent; 
  border:2px solid #00ff41; 
  color:#00ff41;
  box-shadow:2px 2px 0 #00ff41;
}
.steps .ghost:hover{
  background:#00ff41;
  color:#000;
  transform: translate(1px, 1px);
  box-shadow:1px 1px 0 #00ff41;
}

.presets .label{ 
  font-size:.55rem; 
  color:#333; 
  margin-bottom:8px; 
  display:block;
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
}
.pill-row{ display:flex; gap:8px; }
.pill-row button{ 
  border:2px solid #000; 
  background:#fff; 
  border-radius:0; 
  padding:6px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size:.5rem;
  text-transform: uppercase;
  box-shadow:2px 2px 0 #000;
  transition: all .1s;
  cursor: pointer;
}
.pill-row button:hover{
  transform: translate(1px, 1px);
  box-shadow:1px 1px 0 #000;
}

.field{ margin-top:18px }
.label{ 
  font-weight:normal; 
  display:flex; 
  align-items:center; 
  gap:8px;
  font-family: 'Press Start 2P', monospace;
  font-size:.55rem;
  text-transform: uppercase;
  color:#333;
}
.hint{ 
  display:inline-flex; 
  align-items:center; 
  justify-content:center; 
  width:20px; 
  height:20px; 
  border-radius:0; 
  background:#00ff41; 
  color:#000; 
  cursor:help; 
  font-size:.5rem;
  border:2px solid #000;
  box-shadow:2px 2px 0 #000;
  font-family: 'Press Start 2P', monospace;
}

.slider-wrap{ display:grid; grid-template-columns:auto 1fr auto auto; align-items:center; gap:8px; margin-top:6px }
.slider-wrap.two{ grid-template-columns:auto 1fr auto auto }
.tick{ 
  color:#333; 
  font-size:.5rem;
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
}
.value{ 
  font-family:'Press Start 2P', monospace; 
  color:#000;
  font-size:.5rem;
  text-transform: uppercase;
}

.mini-legend{ display:flex; gap:8px; margin-top:8px }
.chip{ 
  font-size:.5rem; 
  padding:3px 6px; 
  border-radius:0; 
  border:2px solid #000; 
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
  box-shadow:2px 2px 0 #000;
}
.chip.park{ 
  background:#00ff41; 
  color:#000; 
  border-color:#000;
}
.chip.tree{ 
  background:#fff; 
  color:#000; 
  border-color:#000;
}

.bar{ 
  display:flex; 
  height:12px; 
  border-radius:0; 
  overflow:hidden; 
  background:#fff; 
  margin-top:8px;
  border:2px solid #000;
  box-shadow:2px 2px 0 #000;
}
.bar .park{ background:#00ff41 }
.bar .tree{ background:#000 }
.bar-legend{ 
  font-size:.5rem; 
  color:#333; 
  margin-top:6px;
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
}
/* tiny ? bubble */
.help-dot{
  display:inline-flex; align-items:center; justify-content:center;
  width:20px; height:20px; border-radius:0;
  background:#00ff41; color:#000; cursor:help; font-size:.5rem;
  border:2px solid #000;
  box-shadow:2px 2px 0 #000;
  font-family: 'Press Start 2P', monospace;
}

/* empty-state paragraph */
div.hint{
  display:flex; align-items:center; justify-content:center;
  width:auto; background:#fff; color:#333;
  font-size:.55rem; line-height:1.5; margin:10px 0 12px 0;
  font-family: 'Press Start 2P', monospace;
  text-transform: uppercase;
  padding:12px 16px;
  border:2px solid #000;
  box-shadow:2px 2px 0 #000;
  text-align:center;
}
.label > .hint{
  display:inline-flex; align-items:center; justify-content:center;
  width:20px; height:20px; border-radius:0;
  background:#00ff41; color:#000; cursor:help; font-size:.5rem;
  border:2px solid #000;
  box-shadow:2px 2px 0 #000;
  font-family: 'Press Start 2P', monospace;
}


</style>
