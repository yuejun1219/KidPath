<!-- src/components/WaterAccess.vue -->
<template>
  <section class="wa two-col" ref="rootEl">
    <!-- LEFT: hero copy, stats, explainer -->
    <aside class="hero">
      <div class="eyebrow">Water Access</div>
      <h1 class="headline">
        Hydration <span class="accent">changes</span> everything.
        <br />Pick refill-friendly parks—<span class="accent">at a glance</span>.
      </h1>

      <!-- Stat cards -->
      <div class="cards">
        <div class="card">
          <div class="big count">{{ fountainsCountAnimated }}</div>
          <div class="sub">Fountains mapped</div>
        </div>
        <div class="card">
          <div class="big">{{ topSuburb.name || '—' }}</div>
          <div class="sub">Most fountains<span v-if="topSuburb.count"> · {{ topSuburb.count }}</span></div>
        </div>
        <div class="card">
          <div class="big">{{ avgPerSuburb }}</div>
          <div class="sub">Avg. per suburb</div>
        </div>
      </div>

      <!-- Decorative wave + droplets -->
      <div class="wave-wrap" aria-hidden="true">
        <svg class="wave" viewBox="0 0 600 60" preserveAspectRatio="none">
          <path d="M0,30 C120,60 240,0 360,30 C480,60 540,10 600,30 L600,60 L0,60 Z"/>
        </svg>
        <div class="droplet d1"></div>
        <div class="droplet d2"></div>
        <div class="droplet d3"></div>
      </div>

      <!-- What this means -->
      <div class="meaning">
        <h3>What this means</h3>
        <ul>
          <li>💧 More fountains = easier refills for kids (and parents!).</li>
          <li>🥤 Use <b>Most</b> to find suburbs with dense drinking spots.</li>
          <li>🗺️ Click any two suburbs to compare; double-click a row to zoom.</li>
        </ul>
      </div>

      <div class="cta-row">
        <button class="btn" @click="jumpToMap">Jump to map ↓</button>
        <button class="btn ghost" @click="toggleIcons">
          {{ showIcons ? '🙈 Hide icons' : '💧 Show icons' }}
        </button>
      </div>
    </aside>

   <!-- RIGHT: Map with compact controls -->
<div class="map-wrap" ref="mapWrapEl">
  <div v-if="loading" class="loading">Loading fountains…</div>
  <div ref="mapEl" class="map"></div>

  <!-- the panel sits ON TOP of the map, not around it -->
  <div class="panel micro" :class="{ collapsed: collapsed && isNarrow }">
    <!-- collapse toggle INSIDE the panel -->
    <button class="sheet-toggle" @click="collapsed = true" aria-label="Collapse panel">▼</button>

    <div class="row micro-title">🏆 Explore suburbs <span v-if="rankedTotal">· 249</span></div>
    <div class="controls">
      <input class="search" v-model.trim="search" placeholder="🔍 Search suburb…" @keydown.stop />
      <div class="chips">
        <button class="chip" :class="{active: sortMode==='desc'}" @click="sortMode='desc'">Most</button>
        <button class="chip" :class="{active: sortMode==='asc'}"  @click="sortMode='asc'">Least</button>
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

    <div class="row tiny muted">Last updated {{ lastSyncLabel }}</div>
  </div>

  <!-- floating expand button (only on mobile when collapsed) -->
  <button
    v-if="isNarrow && collapsed"
    class="sheet-fab"
    @click="collapsed = false"
    aria-label="Expand panel"
  >
    ▲
  </button>
</div>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import * as turf from '@turf/turf'

/* ---------------- PATHS ---------------- */
const GEOJSON_PATH   = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/georef-australia-state-suburb.geojson'
const FOUNTAINS_PATH = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/osm_fountains_metro_melb.geojson'
const FOUNTAIN_ICON_URL = '/icons/fountain.png'

/* --------------- JOIN KEY -------------- */
let BOUNDARY_JOIN_KEY = 'scc_name'

/* ---------------- MAP VIEW ------------- */
const DEFAULT_VIEW = { center: [144.9631, -37.8136], zoom: 9, pitch: 50, bearing: 0 }
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const VIEW_KEY = 'waterAccess:view'

/* --------------- LIGHTING -------------- */
const ambient = new AmbientLight({ color: [255,255,255], intensity: 0.9 })
const dirLight = new DirectionalLight({ color: [255,255,255], intensity: 1.2, direction: [ -1, -3, -1 ] })
const lighting = new LightingEffect({ ambient, dirLight })

/* ---------------- STATE ---------------- */
const rootEl = ref(null)
const mapEl = ref(null)
const mapWrapEl = ref(null)
let map = null
let deckOverlay = null
const loading = ref(true)
const lastSync = ref(null)

const fountains = ref({ type: 'FeatureCollection', features: [] })
const geojson   = ref(null)
const features  = ref([])

const search = ref('')
const sortMode = ref('desc')
const limit = ref(20)
const selectedIds = ref([])

const counting = ref(false)
const countProgress = ref(0)
const showIcons = ref(true)

const collapsed = ref(false)

const isNarrow = ref(false)
function updateNarrow(){ isNarrow.value = window.matchMedia('(max-width: 720px)').matches }
onMounted(() => { updateNarrow(); window.addEventListener('resize', updateNarrow, { passive:true }) })
onBeforeUnmount(() => { window.removeEventListener('resize', updateNarrow) })

// Keep visual center steady when padding changes (optional nicety)
let lastBottomPad = null
onMounted(() => { lastBottomPad = sheetPadding().bottom })

watch([isNarrow, collapsed], () => {
  if (!map) return
  const nextBottom = sheetPadding().bottom
  if (lastBottomPad == null) { lastBottomPad = nextBottom; return }
  const delta = nextBottom - lastBottomPad
  lastBottomPad = nextBottom
  if (delta !== 0) map.panBy([0, delta / 2], { duration: 250 })
})

// responsive padding for fitBounds
function sheetPadding(){
  if (isNarrow.value){
    const bottom = collapsed.value ? 56 : 180 // less reserve when collapsed
    return { top: 16, right: 16, bottom, left: 16 }
  }
  return { top: 60, right: 40, bottom: 60, left: 40 }
}


/* --------- robust: wait until container has size --------- */
function waitForSized(el){
  return new Promise(resolve => {
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return resolve()
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) { ro.disconnect(); resolve() }
    })
    if (el) ro.observe(el)
    // safety fallback – resolve soon anyway
    let tries = 0
    const tick = () => {
      if (!el) return resolve()
      if (el.clientWidth > 0 && el.clientHeight > 0) return resolve()
      if (++tries < 60) requestAnimationFrame(tick) // ~1s
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}
function nudgeResize(times = 2){
  let i = 0
  const fire = () => {
    if (map) map.resize()
    window.dispatchEvent(new Event('resize'))
    if (++i < times) requestAnimationFrame(fire)
  }
  requestAnimationFrame(fire)
}

let ro // ResizeObserver instance
const onPageShow = () => nudgeResize(2)

/* ------------- COLOR SCALE ------------- */
const START = [227,242,253], END = [13,71,161]
function clamp01(t){ return Math.max(0, Math.min(1, t)) }
function lerp(a,b,t){ return a + (b-a)*t }
function lerpRGB(t){
  t = clamp01(t)
  return [0,1,2].map(i => Math.round(lerp(START[i], END[i], t)))
}

/* --------------- HELPERS --------------- */
function baseNorm(s){ if(Array.isArray(s)) s=s[0]; return (s??'').toString().normalize('NFKD').toUpperCase()
  .replace(/[’'`]/g,'').replace(/\(.*?\)/g,'').replace(/&/g,' AND ')
  .replace(/[^A-Z0-9]+/g,' ').replace(/\bSHIRE\b|\bCITY\b|\bRURAL\b|\bCOUNCIL\b|\bOF\b/g,'')
  .replace(/\s+/g,' ').trim() }
const getName = (p)=> Array.isArray(p?.[BOUNDARY_JOIN_KEY]) ? p[BOUNDARY_JOIN_KEY][0] : p?.[BOUNDARY_JOIN_KEY]
const getId   = (p)=> baseNorm(getName(p))
const idToName = computed(()=> {
  const m = new Map(); for(const f of features.value) m.set(getId(f.properties), getName(f.properties)); return m
})
function hasValidCoord(g){
  const walk = (c)=> Array.isArray(c) && (typeof c[0]==='number' ? Number.isFinite(c[0]) && Number.isFinite(c[1]) : c.some(walk))
  return walk(g.coordinates||[])
}
function computeBounds(feats){
  let minLon=Infinity,minLat=Infinity,maxLon=-Infinity,maxLat=-Infinity
  const push=([x,y])=>{ if(!Number.isFinite(x)||!Number.isFinite(y))return; minLon=Math.min(minLon,x);minLat=Math.min(minLat,y);maxLon=Math.max(maxLon,x);maxLat=Math.max(maxLat,y)}
  const walk=(c)=>{ if(!Array.isArray(c))return; if(typeof c[0]==='number')push(c); else c.forEach(walk) }
  feats.forEach(f=>f?.geometry&&walk(f.geometry.coordinates))
  return [[minLon,minLat],[maxLon,maxLat]]
}
function fitToDataByIds(ids, animate=true){
  const s = new Set(ids.map(String))
  const fts = features.value.filter(f => s.has(getId(f.properties)))
  if(!fts.length) return
  const b = computeBounds(fts)
 map.fitBounds(b, { padding: sheetPadding(), duration: 1000 })
}
function fitAll(){
  const fts = features.value?.length ? features.value : (geojson.value?.features || [])
  if(!fts.length) return
  const b = computeBounds(fts)
  map.fitBounds(b, { padding:{top:60,right:40,bottom:60,left:40}, duration:1000 })
}
function saveView(){
  const c = map.getCenter()
  localStorage.setItem(VIEW_KEY, JSON.stringify({ center:[c.lng,c.lat], zoom:map.getZoom(), pitch:map.getPitch(), bearing:map.getBearing() }))
}
function loadSavedView(){
  try { const v = JSON.parse(localStorage.getItem(VIEW_KEY)||'null'); if(v&&Array.isArray(v.center)&&Number.isFinite(v.zoom)) return v } catch {}
  return null
}
const lastSyncLabel = computed(()=> lastSync.value ? new Date(lastSync.value).toLocaleString() : 'never')

async function loadLocalFountains(){
  const r = await fetch(FOUNTAINS_PATH); if(!r.ok) throw new Error(`Failed fountains ${r.status}`); fountains.value = await r.json(); lastSync.value = Date.now()
}
function suburbIdAt(lon,lat){
  const pt=[lon,lat]
  for(const f of features.value){
    const [minX,minY,maxX,maxY] = turf.bbox(f)
    if(lon<minX||lon>maxX||lat<minY||lat>maxY) continue
    if(turf.booleanPointInPolygon(pt,f)) return getId(f.properties)
  }
  return null
}

/* --------- COUNT PER SUBURB (batched) -------- */
async function countFountainsPerSuburb(){
  if(!features.value?.length) return
  const pts = fountains.value?.features || []
  if(!pts.length){ for(const f of features.value) f.properties.__fountainCount=0; return }
  counting.value=true; countProgress.value=0
  const P = pts.map(p=>p.geometry.coordinates)
  const total = features.value.length, BATCH=12
  for(let s=0;s<total;s+=BATCH){
    const e = Math.min(total, s+BATCH)
    for(let i=s;i<e;i++){
      const f = features.value[i], poly = { type:'Feature', geometry:f.geometry, properties:{} }
      const [minX,minY,maxX,maxY] = turf.bbox(poly); let c=0
      for(let k=0;k<P.length;k++){
        const [x,y]=P[k]; if(x>=minX&&x<=maxX&&y>=minY&&y<=maxY) if(turf.booleanPointInPolygon(P[k],poly)) c++
      }
      f.properties.__fountainCount = c
    }
    countProgress.value = e/total; await new Promise(r=>setTimeout(r,0))
  }
  counting.value=false; countProgress.value=1
}

/* ---------------- RANKING ---------------- */
const ranked = computed(()=>{
  const counts = features.value.map(f=>f.properties?.__fountainCount??0).sort((a,b)=>a-b)
  const min = counts[0]??0, max = counts[counts.length-1]??0, denom=Math.max(1,max-min)
  return features.value
    .map(f=>{
      const name = getName(f.properties), count=f.properties?.__fountainCount??0
      const t=(count-min)/denom, [r,g,b]=lerpRGB(Math.pow(t,0.7))
      return { id:getId(f.properties), name, count, color:`rgb(${r},${g},${b})` }
    })
    .filter(it=> it.name && it.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a,b)=> sortMode.value==='desc'? b.count-a.count : a.count-b.count)
})
const rankedTotal   = computed(()=> ranked.value.length)
const rankedLimited = computed(()=> ranked.value.slice(0, limit.value))
function isSelected(id){ return selectedIds.value.includes(id) }
function toggleSelect(id){ const a=selectedIds.value.slice(); const i=a.indexOf(id); if(i>=0)a.splice(i,1); else a.push(id); selectedIds.value=a }
function clearSelection(){ selectedIds.value=[] }
function zoomToItems(ids){ fitToDataByIds(ids,true) }

/* ------------- Small compact layers ------------- */
function buildPolygonLayer(){
  const counts = features.value.map(f=>f.properties?.__fountainCount??0)
  const min=Math.min(...counts,0), max=Math.max(...counts,1), denom=Math.max(1,max-min)
  return new GeoJsonLayer({
    id:'suburbs-fountain-choropleth',
    data:{ type:'FeatureCollection', features: features.value },
    pickable:true, stroked:true, filled:true,
    getFillColor: f => { const c=f.properties?.__fountainCount??0; const t=(c-min)/denom; const [r,g,b]=lerpRGB(Math.pow(t,0.7)); return [r,g,b,220] },
    getLineColor: f => isSelected(getId(f.properties)) ? [13,71,161] : [120,120,120],
    getLineWidth: f => isSelected(getId(f.properties)) ? 2 : 0.6,
    lineWidthMinPixels:0.6,
    updateTriggers:{
      getFillColor:[features.value.length,...counts],
      getLineColor:[selectedIds.value.join('|')],
      getLineWidth:[selectedIds.value.join('|')]
    },
    onClick:({object})=>{ if(!object) return; toggleSelect(getId(object.properties)) }
  })
}
function buildFountainLayer(){
  return new IconLayer({
    id:'fountains', data:fountains.value.features, pickable:true,
    sizeUnits:'pixels', sizeScale:1, getSize:24,
    getPosition:f=>f.geometry.coordinates,
    getIcon:()=>({ url:FOUNTAIN_ICON_URL, width:32, height:32, anchorY:32 }),
    onClick:({object})=>{
      if(!object) return
      const [lon,lat]=object.geometry.coordinates
      const sid=suburbIdAt(lon,lat); if(sid) toggleSelect(sid)
      map.flyTo({ center:[lon,lat], zoom:Math.max(14, map.getZoom()), duration:800 })
    }
  })
}
function setDeckLayers(){
  if(!deckOverlay) return
  const layers=[buildPolygonLayer()]; if(showIcons.value) layers.push(buildFountainLayer())
  deckOverlay.setProps({
    layers, effects:[lighting],
    getCursor:({isHovering})=> isHovering?'pointer':'default',
    getTooltip:({object,layer})=>{
      if(!object) return null
      if(layer.id==='fountains') return { text: `${object.properties?.name || 'Drinking fountain'}\nClick to zoom & select suburb` }
      const name=getName(object.properties); const c=object.properties?.__fountainCount??0
      return { text: `${name ?? 'Suburb'}\n${c>0?`Fountains: ${c}`:'No fountains recorded'}\nClick to select` }
    }
  })
}

/* ---------------- INIT ---------------- */
async function init(){
  await nextTick()
  await waitForSized(mapWrapEl.value || mapEl.value) // ✅ wait until visible/sized

  const start = loadSavedView() || DEFAULT_VIEW
  map = new MapLibreMap({
    container: mapEl.value, style: BASEMAP_STYLE,
    center: start.center, zoom: start.zoom, pitch: start.pitch, bearing: start.bearing,
    attributionControl:true, antialias:true
  })
  deckOverlay = new MapboxOverlay({ interleaved:true })
  map.addControl(deckOverlay); map.on('moveend', saveView)

  // container size watcher -> keep map sized even if parent changes (tabs, layout)
  ro = new ResizeObserver(() => { if (map) map.resize() })
  ro.observe(mapWrapEl.value || mapEl.value)

  const gjResp = await fetch(GEOJSON_PATH); if(!gjResp.ok) throw new Error(`GeoJSON ${gjResp.status}`)
  const gj = await gjResp.json()
  gj.features = (gj.features||[]).filter(f => f?.geometry && (f.geometry.type==='Polygon' || f.geometry.type==='MultiPolygon') && hasValidCoord(f.geometry))
  geojson.value = gj
  features.value = gj.features.map(f => ({ ...f, properties:{ ...f.properties, __fountainCount:0 }}))

  await loadLocalFountains()
  await countFountainsPerSuburb()
  setDeckLayers()
  fitAll()
  loading.value=false

  // small nudge after first paint
  nudgeResize(2)
}

onMounted(()=>{
  init().catch(err=>{ console.error(err); alert('Could not load water access. Please try again.') })
  window.addEventListener('pageshow', onPageShow)
})
onBeforeUnmount(()=>{
  if (deckOverlay) deckOverlay.finalize();
  if (map) map.remove()
  ro?.disconnect()
  window.removeEventListener('pageshow', onPageShow)
})
watch([selectedIds, ()=>fountains.value, ()=>features.value?.length, showIcons], ()=> { setDeckLayers(); if (map) map.resize() })

/* --------- LEFT stats + micro-helpers -------- */
const fountainsCount = computed(()=> fountains.value?.features?.length || 0)
const suburbCount    = computed(()=> features.value?.length || 1)
const avgPerSuburb   = computed(()=> Math.round((fountainsCount.value / suburbCount.value) || 0))

const topSuburb = computed(()=>{
  const first = [...ranked.value][0]
  return first ? { name: first.name, count: first.count } : { name: '', count: 0 }
})

// simple counter animation for the big number
const fountainsCountAnimated = ref(0)
watch(fountainsCount, (n)=>{
  const start = fountainsCountAnimated.value
  const duration = 600, t0 = performance.now()
  const step = (t)=>{
    const k = Math.min(1, (t - t0)/duration)
    fountainsCountAnimated.value = Math.round(start + (n - start) * (1 - Math.pow(1-k,3)))
    if(k<1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}, { immediate:true })

function toggleIcons(){ showIcons.value = !showIcons.value }
function jumpToMap(){ mapWrapEl.value?.scrollIntoView({ behavior:'smooth' }) }
</script>

<style scoped>
/* ----- Layout ----- */
.two-col{ display:grid; grid-template-columns: minmax(280px, 520px) 1fr; gap:24px; align-items: stretch }
@media (max-width: 1100px){ .two-col{ grid-template-columns: 1fr; } }

/* ----- Left hero ----- */
.hero{ padding: 20px 18px; border-radius: 20px; background: radial-gradient(1200px 400px at -200px 0, rgba(13,71,161,0.06), transparent 60%), #ffffff; box-shadow: 0 16px 36px rgba(0,0,0,0.08) }
.eyebrow{ font-weight:700; color:#0d47a1; letter-spacing:.08em; text-transform:uppercase; font-size:.9rem; margin-bottom:8px }
.headline{ font-size: clamp(24px, 2.8vw, 34px); line-height:1.15; margin:0 0 12px; color:#173b2d }
.accent{ color:#2e7d32 }
.cards{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; margin:10px 0 6px }
.card{ background:#f5f9ff; border:1px solid #dbe8ff; border-radius:14px; padding:10px 12px; position:relative; overflow:hidden }
.card::after{ content:""; position:absolute; inset:auto -30% -20% -30%; height:2px; background:linear-gradient(90deg,transparent,#bbdefb,transparent); animation: shimmer 2.2s linear infinite }
.big{ font-weight:800; font-size: clamp(18px, 2vw, 24px); color:#0d47a1 }
.big.count{ tab-size: 2 }
.sub{ color:#245399; font-size:.85rem }

@keyframes shimmer { 0%{ transform: translateX(-30%) } 100%{ transform: translateX(120%) } }

/* wave + droplets */
.wave-wrap{ position:relative; height:46px; margin:12px 0 4px }
.wave{ width:100%; height:100%; fill:#e3f2fd; filter: drop-shadow(0 6px 10px rgba(13,71,161,0.10)) }
.droplet{ position:absolute; width:10px; height:14px; background: radial-gradient(circle at 30% 30%, #fff, #90caf9 60%, #42a5f5 100%); border-radius:8px 8px 10px 10px; opacity:.85; animation: floatUp 4.5s ease-in-out infinite }
.d1{ left:8%;  bottom:0; animation-delay: .1s }
.d2{ left:18%; bottom:2px; animation-delay: .9s }
.d3{ left:28%; bottom:1px; animation-delay: 1.6s }

@keyframes floatUp{
  0%{ transform: translateY(0) scale(1); opacity:.0 }
  15%{ opacity:.9 }
  70%{ transform: translateY(-26px) scale(1.08) }
  100%{ transform: translateY(-34px) scale(0.96); opacity:0 }
}

/* meaning + ctas */
.meaning{ background:#f7fbff; border:1px dashed #cfe3ff; border-radius:14px; padding:10px 12px; margin:12px 0 4px }
.meaning h3{ margin:0 0 6px; font-size:1rem; color:#0d47a1 }
.meaning ul{ margin:0; padding-left:18px }
.meaning li{ margin:6px 0 }
.cta-row{ display:flex; gap:8px; margin-top:8px }
.btn{ background:#0d47a1; color:#fff; border:none; padding:8px 12px; border-radius:10px; font-size:.9rem; cursor:pointer; transition: transform .12s ease }
.btn:hover{ transform: translateY(-1px) scale(1.02) }
.btn.ghost{ background:transparent; color:#0d47a1; border:1px solid #0d47a1 }

/* ----- Map side ----- */
.map-wrap{ position:relative; min-height: 72vh; border-radius: 18px; overflow:hidden; box-shadow: 0 16px 36px rgba(0,0,0,0.12); background:#eef2f3 }
.map{ height:100%; width:100% }
.loading{ position:absolute; z-index:3; top:12px; left:50%; transform:translateX(-50%); background:rgba(255,255,255,.96); padding:8px 12px; border-radius:10px; font-size:.9rem; color:#1565c0; box-shadow:0 6px 18px rgba(0,0,0,.08) }

/* compact panel */
.panel.micro{ position:absolute; top:12px; left:12px; width:340px; background:rgba(255,255,255,.95); border:1px solid rgba(0,0,0,.08); border-radius:14px; padding:12px; backdrop-filter: blur(6px) }
.micro-title{ font-weight:700; color:#0d47a1; margin-bottom:6px }
.controls{ display:grid; gap:8px }
.search{ width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,0,0,.15); font-size:.9rem }
.chips{ display:flex; gap:6px }
.chip{ padding:4px 8px; border-radius:999px; border:1px solid rgba(0,0,0,.15); background:#fff; cursor:pointer; font-size:.85rem }
.chip.active{ background:#e3f2fd; border-color:#0d47a1; color:#0d47a1 }
.slider-row{ display:flex; align-items:center; gap:8px; font-size:.85rem }

.rank-list{ margin-top:6px; border-top:1px dashed rgba(0,0,0,.12); padding-top:6px; max-height:220px; overflow:auto }
.rank-item{ display:grid; grid-template-columns:1fr auto; align-items:center; gap:8px; padding:6px 4px; border-radius:8px; cursor:pointer; transition: background .15s }
.rank-item:hover{ background:rgba(0,0,0,0.05) }
.rank-item.selected{ background:#e3f2fd; outline:1px solid #bbdefb }
.rank-name{ display:flex; align-items:center; gap:8px }
.bullet{ width:14px; height:10px; border-radius:4px; border:1px solid rgba(0,0,0,0.1) }
.rank-value{ font-weight:700; color:#0d47a1 }

.tiny{ font-size:.78rem }
.muted{ color:#555 }

/* Keep MapLibre controls clear of the sheet */
:deep(.maplibregl-ctrl-bottom-right){ bottom: 10px; right: 10px; }

/* Inside-panel toggle (collapse) */
.sheet-toggle{
  position: sticky; top: 0;
  width: 100%; display: grid; place-items: center;
  background: transparent; border: 0; padding: 4px 0 6px; cursor: pointer;
  color: #0d47a1; font-weight: 700; font-size: 12px;
}

@media (max-width: 720px){
  .map-wrap{ min-height: 68vh; } /* a bit more map space */

  /* turn micro panel into a bottom sheet */
  .panel.micro{
    position: absolute; left: 8px; right: 8px; bottom: 8px; top: auto;
    width: auto; max-height: 46vh; overflow: hidden;
    padding: 8px 12px 10px;
    backdrop-filter: blur(6px);
    transition: transform .24s ease, max-height .24s ease;
    box-shadow: 0 12px 28px rgba(0,0,0,.18);
  }
  .panel.micro.collapsed{
    transform: translateY(calc(100% - 44px));
    max-height: 44px; /* just the handle row visible */
  }

  /* shorter list on phones */
  .rank-list{ max-height: 160px; }

  /* floating expand button shown when collapsed */
  .sheet-fab{
    position: absolute; z-index: 6;
    left: 50%; bottom: 14px; transform: translateX(-50%);
    padding: 6px 10px; border-radius: 999px;
    background: #fff; border: 1px solid rgba(0,0,0,.15);
    box-shadow: 0 8px 18px rgba(0,0,0,.12);
    color: #0d47a1; font-weight: 700; font-size: 12px; cursor: pointer;
  }
}

</style>
