<template>
  <div class="nearby-page">
    <!-- 两栏布局：左侧说明卡（仅文字+动态H2） / 右侧地图+控制面板 -->
    <div class="nearby-wrap">
      <!-- LEFT: editorial text -->
      <aside class="text-col">
        <div class="editorial-card">
          <!-- 动态 H2：随当前类型变化 -->
          <h2 class="editorial-title">Nearby {{ currentAmenityType.name }}</h2>

          <p class="editorial-body">
            Set a center and we’ll find nearby
            {{ currentAmenityType.name.toLowerCase() }} within your chosen radius.
          </p>
          <p class="editorial-body">
            Look for clusters near parks, trails, and activity hubs. If coverage looks sparse,
            plan ahead before you go.
          </p>

          <blockquote class="editorial-quote">
            “Good planning makes family walks easier.”
          </blockquote>

          <ul class="editorial-bullets">
            <li>Use <em>“Use my location”</em> or click the map to set a center.</li>
            <li>Drag the radius slider to widen your search (0.2–5&nbsp;km).</li>
            <li>Click any pin to get walking directions.</li>
          </ul>
        </div>
      </aside>

      <!-- RIGHT: map + panel（不含任何筛选按钮） -->
      <div class="map-col">
        <div class="map-wrap" ref="wrapEl">
          <div v-if="loading" class="loading">
            Loading {{ currentAmenityType.itemName }}…
          </div>
          <div ref="mapEl" class="map"></div>

          <div class="panel fancy right" :class="{ collapsed: panelCollapsed }">
            <!-- 顶部小箭头，点击折叠/展开，与 Tree Canopy 样式一致 -->
            <button class="sheet-toggle" aria-label="collapse panel" @click="togglePanel">{{ panelCollapsed ? '▲' : '▼' }}</button>
            <h3 class="section-title" @click="togglePanel" style="cursor:pointer; user-select:none;">{{ currentAmenityType.title }}</h3>

            <div class="panel-body">
            <div v-if="searchCenter" class="stat-card">
              <span class="stat-number">{{ nearbyCount }}</span>
              <span class="stat-label">
                {{ currentAmenityType.itemName }}{{ nearbyCount===1?'':'s' }}
                within {{ radiusKm.toFixed(1) }} km
              </span>
            </div>
            <div v-else class="empty-note">
              📍 Choose a center to see {{ currentAmenityType.itemName }} nearby.
            </div>

            <div class="row wrap">
              <button class="btn" @click="requestLocation" :disabled="locating">
                {{ locating ? '⏳ Getting…' : (userLoc ? 'Re-locate me' : 'Use my location') }}
              </button>
              <button class="btn ghost" @click="useMapCenter">Use map center</button>
              <button class="btn ghost" :class="{active: pickingOnMap}" @click="togglePickOnMap">
                {{ pickingOnMap ? 'Click map… (esc)' : 'Click map to set' }}
              </button>
            </div>

            <div class="row small muted" v-if="locError">{{ locError }}</div>
            <div class="row small muted" v-else-if="searchCenter">
              Center: {{ searchCenter[1].toFixed(4) }}, {{ searchCenter[0].toFixed(4) }}
              <span v-if="usingUserLoc">(from device)</span>
              <span v-else>(manual)</span>
            </div>

            <div class="row slider-row" v-if="searchCenter">
              <label>Search radius</label>
              <input type="range" min="0.2" max="5" step="0.2" v-model.number="radiusKm" />
              <span>{{ radiusKm.toFixed(1) }} km</span>
            </div>

            <div v-if="selectedFountain" class="directions-card">
              <div class="title">
                {{ selectedFountain.properties?.name || currentAmenityType.name }}
              </div>
              <div class="coords small muted">
                {{ selectedFountain.geometry.coordinates[1].toFixed(5) }},
                {{ selectedFountain.geometry.coordinates[0].toFixed(5) }}
              </div>
              <a class="btn wide" :href="directionsUrl" target="_blank" rel="noopener">
                Get directions
              </a>
              <button class="btn ghost wide" @click="selectedFountain=null">Close</button>
              <div class="tiny">Opens Google Maps walking directions in a new tab.</div>
            </div>

            <div class="hint">💡 Tip: Allow location or pick a map point to start.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Map as MapLibreMap } from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer, IconLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import * as turf from '@turf/turf'

const FOUNTAINS_PATH = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/osm_fountains_metro_melb.geojson'
const FOUNTAIN_ICON_URL = '/icons/fountain.png'
const DEFAULT_VIEW = { center: [144.9631, -37.8136], zoom: 12, pitch: 50, bearing: 0 }
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
// API base: accept both https://api.kidpath.me and https://api.kidpath.me/api/v1
const RAW_API_BASE = import.meta.env.VITE_API_BASE || ''
const API_BASE = RAW_API_BASE.replace(/\/$/, '').replace(/\/api(\/v\d+)?$/, '')

// 设施类型配置
const amenityTypes = ref([
  { key: 'fountain', name: 'Fountains', icon: '🚰', title: '🚰 Nearby Drinking Fountains', itemName: 'fountain' },
  { key: 'toilet', name: 'Toilets', icon: '🚽', title: '🚽 Nearby Toilets', itemName: 'toilet' },
  { key: 'playground', name: 'Playgrounds', icon: '🛝', title: '🛝 Nearby Playgrounds', itemName: 'playground' },
  { key: 'library', name: 'Libraries', icon: '📚', title: '📚 Nearby Libraries', itemName: 'library' },
  { key: 'community_centre', name: 'Community Centers', icon: '🏛️', title: '🏛️ Nearby Community Centers', itemName: 'community center' }
])

// right panel collapse state
const panelCollapsed = ref(false)
function togglePanel(){
  panelCollapsed.value = !panelCollapsed.value
}

const currentAmenityType = computed(() => 
  amenityTypes.value.find(type => type.key === selectedAmenityType.value) || amenityTypes.value[0]
)

const wrapEl = ref(null)
const mapEl = ref(null)
let map = null
let deckOverlay = null
let ro = null
const loading = ref(true)

const fountains = ref({ type: 'FeatureCollection', features: [] })

const userLoc = ref(null)
const manualCenter = ref(null)
const mapCenter = ref(DEFAULT_VIEW.center)
const usingUserLoc = computed(() => !!userLoc.value && !manualCenter.value)
const searchCenter = computed(() => manualCenter.value || userLoc.value || null)

const locating = ref(false)
const locError = ref('')
const pickingOnMap = ref(false)

const radiusKm = ref(1.0)
const selectedFountain = ref(null)

const ambient = new AmbientLight({ color: [255,255,255], intensity: 0.9 })
const dirLight = new DirectionalLight({ color: [255,255,255], intensity: 1.2, direction: [-1,-3,-1] })
const lighting = new LightingEffect({ ambient, dirLight })

const props = defineProps({
  amenityKey: { type: String, default: 'fountain' } // Page 传进来的当前类别
})

// 初始化 selectedAmenityType
const selectedAmenityType = ref(props.amenityKey || 'fountain')

// 用外部 amenityKey 驱动内部 selectedAmenityType
watch(() => props.amenityKey, (k) => {
  // 确保 k 是有效的字符串
  if (k && typeof k === 'string') {
    selectedAmenityType.value = k
    // 清空并重新加载
    fountains.value = { type: 'FeatureCollection', features: [] }
    setDeckLayers()
    // 根据类型决定是否立即加载数据
    if (k === 'fountain') {
      // 饮水机类型立即加载本地数据
      loadAmenities()
    } else if (searchCenter.value) {
      // 其他类型需要搜索中心
      loadAmenities()
    }
  }
}, { immediate: true })

async function loadFountains() {
  const resp = await fetch(FOUNTAINS_PATH)
  if (!resp.ok) throw new Error(`Failed to load fountains: ${resp.status}`)
  fountains.value = await resp.json()
}

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
      manualCenter.value = null
      map?.flyTo({ center: [longitude, latitude], zoom: Math.max(14, map.getZoom()), duration: 800 })
      setDeckLayers()
      // 获取位置后加载设施数据
      loadAmenities()
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
  // 设置地图中心后加载设施数据
  loadAmenities()
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


// 加载设施数据
async function loadAmenities() {
  try {
    loading.value = true
    
    if (selectedAmenityType.value === 'fountain') {
      // 饮水机使用本地JSON数据，不需要搜索中心
      const response = await fetch(FOUNTAINS_PATH)
      if (response.ok) {
        const data = await response.json()
        fountains.value = data
      } else {
        fountains.value = { type: 'FeatureCollection', features: [] }
      }
    } else {
      // 其他设施使用API数据，需要搜索中心
      if (!searchCenter.value) {
        fountains.value = { type: 'FeatureCollection', features: [] }
        return
      }
      
      // 使用API数据
      const radiusKmValue = radiusKm.value
      const lat = searchCenter.value[1]
      const lng = searchCenter.value[0]

      // 计算边界框
      const latOffset = radiusKmValue / 111
      const lngOffset = radiusKmValue / (111 * Math.cos(lat * Math.PI / 180))

      const bbox = [
        lng - lngOffset,
        lat - latOffset,
        lng + lngOffset,
        lat + latOffset
      ].join(',')

      const url = `${API_BASE}/api/v1/amenities/bbox?bbox=${bbox}&category=${selectedAmenityType.value}&limit=50&_t=${Date.now()}`

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()

        const rawFeatures = data.data?.features || []
        const filteredFeatures = rawFeatures.filter(feature => {
          const category = feature.category || feature.properties?.category
          return category === selectedAmenityType.value
        })

        fountains.value = {
          type: 'FeatureCollection',
          features: filteredFeatures.map(feature => ({
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              name: feature.name || feature.properties?.name || `Unnamed ${selectedAmenityType.value}`,
              category: feature.category || feature.properties?.category || selectedAmenityType.value
            }
          }))
        }
      } else {
        fountains.value = { type: 'FeatureCollection', features: [] }
      }
    }
  } catch (error) {
    fountains.value = { type: 'FeatureCollection', features: [] }
  } finally {
    loading.value = false
    setDeckLayers()
  }
}

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
    parameters: { depthTest: true, depthMask: false }
  })
}

function buildFountainsLayer() {
  const data = nearbyFountains.value
  const SRC_W = 64, SRC_H = 64
  const z = map?.getZoom?.() ?? 12
  const sizePx = Math.max(24, Math.min(48, 24 + (z - 10) * 3))

  return new IconLayer({
    id: 'fountains',
    data,
    pickable: true,
    sizeUnits: 'pixels',
    sizeScale: 1,
    getSize: () => sizePx,
    sizeMinPixels: 24,
    sizeMaxPixels: 48,
    getPosition: f => f.geometry.coordinates,
    getIcon: () => ({
      url: FOUNTAIN_ICON_URL,
      width: SRC_W,
      height: SRC_H,
      anchorY: SRC_H
    }),
    // 确保图标始终显示在最前面
    parameters: { 
      depthTest: false,
      depthMask: false 
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

function buildIconLayer() {
  const data = nearbyFountains.value
  
  if (data.length === 0) {
    return null
  }
  
  
  const z = map?.getZoom?.() ?? 12
  const sizePx = Math.max(24, Math.min(48, 24 + (z - 10) * 3))
  const SRC_W = 64, SRC_H = 64
  
  return new IconLayer({
    id: 'icon-layer',
    data,
    pickable: true,
    sizeUnits: 'pixels',
    sizeScale: 1,
    getSize: () => sizePx,
    sizeMinPixels: 24,
    sizeMaxPixels: 48,
    getPosition: f => f.geometry.coordinates,
    getIcon: (d) => {
      const category = d.properties?.category || selectedAmenityType.value
      let iconUrl
      switch (category) {
        case 'toilet': 
          iconUrl = '/icons/toilet.png'
          break
        case 'playground': 
          iconUrl = '/icons/playground1.png'
          break
        case 'library': 
          iconUrl = '/icons/library.png'
          break
        case 'community_centre': 
          iconUrl = '/icons/community.png'
          break
        default: 
          iconUrl = '/icons/fountain.png'
      }
      return {
        url: iconUrl,
        width: SRC_W,
        height: SRC_H,
        anchorY: SRC_H
      }
    },
    // 确保图标始终显示在最前面
    parameters: { 
      depthTest: false,
      depthMask: false 
    },
    onClick: ({object}) => {
      if (!object) return
      selectedFountain.value = object
      const [lon, lat] = object.geometry.coordinates
      map.flyTo({ center: [lon, lat], zoom: Math.max(15, map.getZoom()), duration: 700 })
    },
    updateTriggers: { 
      getSize: [map?.getZoom?.(), radiusKm.value, !!searchCenter.value],
      getIcon: [selectedAmenityType.value, fountains.value.features.length]
    }
  })
}

function setDeckLayers() {
  if (!deckOverlay) return
  const layers = []
  
  
  // 先添加半径圆圈（最底层）
  const ringLayer = buildRadiusRing()
  if (ringLayer) layers.push(ringLayer)
  
  // 如果是饮水机，使用原本的IconLayer
  if (selectedAmenityType.value === 'fountain') {
    const fountainsLayer = buildFountainsLayer()
    if (fountainsLayer) layers.push(fountainsLayer)
  } else {
    // 其他设施类型使用PNG图标层
    const iconLayer = buildIconLayer()
    if (iconLayer) {
      layers.push(iconLayer)
    }
  }
  
  // 最后添加用户位置点（最顶层）
  const userLayer = buildUserLayer()
  if (userLayer) layers.push(userLayer)
  

  deckOverlay.setProps({
    layers,
    effects: [lighting],
    getCursor: ({isHovering}) => isHovering ? 'pointer' : (pickingOnMap.value ? 'crosshair' : 'default'),
    getTooltip: ({ object, layer }) => {
      if (layer?.id === 'fountains' && object) {
        return { text: `${object.properties?.name || 'Drinking fountain'}\nClick for directions` }
      }
      if (layer?.id === 'icon-layer' && object) {
        const category = object.properties?.category || selectedAmenityType.value
        const amenityName = amenityTypes.value.find(t => t.key === category)?.name || 'Amenity'
        return { text: `${object.properties?.name || amenityName}\nClick for directions` }
      }
      return null
    }
  })
}

const directionsUrl = computed(() => {
  if (!selectedFountain.value) return '#'
  const [lon, lat] = selectedFountain.value.geometry.coordinates
  const origin = userLoc.value ? `&origin=${encodeURIComponent(userLoc.value[1] + ',' + userLoc.value[0])}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lon)}&travelmode=walking${origin}`
})

/* ---- Safe initialisation sequence ---- */
async function ensureSized() {
  // Wait until the map container has a real layout size.
  await nextTick()
  const el = mapEl.value
  if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) {
    await new Promise(r => requestAnimationFrame(r))
    return ensureSized()
  }
}

async function init() {
  await ensureSized()

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

  // Attach overlay only after the base map is fully ready
  map.once('load', async () => {
    deckOverlay = new MapboxOverlay({ interleaved: true })
    map.addControl(deckOverlay)
    map.resize()

    await loadFountains()
    setDeckLayers()
    requestLocation()
    loading.value = false
  })

  map.on('move', () => { const c = map.getCenter(); mapCenter.value = [c.lng, c.lat] })
  map.on('zoom', () => setDeckLayers())
  map.on('click', (e) => {
    if (!pickingOnMap.value) return
    manualCenter.value = [e.lngLat.lng, e.lngLat.lat]
    pickingOnMap.value = false
    setDeckLayers()
    // 点击地图设置中心后加载设施数据
    loadAmenities()
  })

  // keep canvas sized while parent layout animates/resizes
  ro = new ResizeObserver(() => map && map.resize())
  ro.observe(wrapEl.value)

  // bfcache restore / tab visibility
  const onPageShow = () => map && map.resize()
  const onVis = () => document.visibilityState === 'visible' && map && map.resize()
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVis)
  cleanup.push(() => {
    window.removeEventListener('pageshow', onPageShow)
    document.removeEventListener('visibilitychange', onVis)
  })
}

const cleanup = []
onMounted(() => {
  init().catch(err => {
    console.error(err)
    alert('Could not load nearby fountains.')
  })
  // 初始加载数据
  if (selectedAmenityType.value === 'fountain') {
    // 饮水机类型立即加载数据
    loadAmenities()
  }
  // 注意：其他类型的数据会在 requestLocation() 成功后自动加载
})
onBeforeUnmount(() => {
  ro && ro.disconnect()
  if (deckOverlay) deckOverlay.finalize()
  if (map) map.remove()
  cleanup.forEach(fn => fn())
})

// Rebuild layers when inputs change
watch([searchCenter, radiusKm, () => fountains.value, selectedAmenityType], () => {
  setDeckLayers()
})


// 当半径改变时重新加载数据
watch(radiusKm, () => {
  if (searchCenter.value) {
    loadAmenities()
  }
})
</script>

<style scoped>
.nearby-page{
  padding:20px 0; /* 外层 Page 会控制左右留白 */
}

/* 两栏布局 */
.nearby-wrap{
  display:grid;
  grid-template-columns:360px 1fr;
  gap:24px;
  align-items:start;
}

/* 左列：说明卡（仅文字+H2） */
.text-col{ display:flex; }
.editorial-card{
  background:#fff;
  border-radius:18px;
  padding:18px 18px 16px;
  box-shadow:0 10px 24px rgba(0,0,0,.10);
  font-family:'Segoe UI', Roboto, system-ui, -apple-system, sans-serif;
  line-height:1.55;
}
.editorial-title{
  margin:0 0 6px;
  font-size:1.35rem;
  font-weight:800;
  color:#1b5e20;
}
.editorial-body{ margin:8px 0; color:#384b3f; }
.editorial-quote{
  margin:12px 0; padding:10px 12px; border-left:6px solid #66bb6a;
  background:#f1f8e9; color:#2e7d32; border-radius:8px; font-style:italic;
}
.editorial-bullets{ list-style:none; padding:0; margin:10px 0 0; display:grid; gap:6px; }
.editorial-bullets li{ display:flex; gap:8px; align-items:flex-start; color:#394e42; }

/* 右列：地图与面板 */
.map-col{ position:relative; }
.map-wrap{
  position:relative; height:75vh;
  border-radius:18px; overflow:hidden;
  box-shadow:0 16px 36px rgba(0,0,0,0.12);
  background:#eef2f3;
}
.map{ height:100%; width:100%; }
.loading{
  position:absolute; z-index:3; top:12px; left:50%; transform:translateX(-50%);
  background:rgba(255,255,255,0.95); padding:8px 12px; border-radius:10px;
  font-size:.9rem; color:#0d47a1; box-shadow:0 6px 18px rgba(0,0,0,0.08);
}

/* 面板（不含筛选按钮） */
.panel.fancy{
  position:absolute; top:12px;
  background:rgba(255,255,255,0.95); backdrop-filter:blur(6px);
  border-radius:16px; padding:16px;
  box-shadow:0 12px 28px rgba(0,0,0,0.12);
  width:360px; max-height:calc(100% - 24px); overflow:auto;
  font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  border:1px solid rgba(0,0,0,0.08);
  transition: transform .25s ease, opacity .25s ease;
}
.panel.right{ right:12px; left:auto; }
/* 折叠：仅保留小箭头（隐藏标题与主体），整体高度更窄 */
.panel.collapsed{ max-height: 34px; padding: 6px 12px; }
.panel.collapsed .section-title{ display:none; }
.panel.collapsed .panel-body{ display:none; }

/* 顶部小箭头（内部） */
.sheet-toggle{ position:sticky; top:0; width:100%; display:grid; place-items:center; background:transparent; border:0; padding:4px 0 6px; cursor:pointer; color:#1565c0; font-weight:700; font-size:12px; }
.section-title{
  font-size:1.15rem; font-weight:700; margin:0 0 12px;
  padding:6px 12px; border-radius:12px;
  background:linear-gradient(90deg,#e3f2fd,#bbdefb);
  color:#0d47a1;
}

/* 统计卡片/按钮/滑块 */
.stat-card{ background:#e3f2fd; border:1px solid #bbdefb; border-radius:12px; padding:10px; text-align:center; margin-bottom:12px; }
.stat-number{ font-size:1.6rem; font-weight:700; color:#0d47a1; }
.stat-label{ font-size:.85rem; color:#555; }
.row{ display:flex; align-items:center; gap:10px; margin:8px 0; flex-wrap:wrap; }
.btn{ background:#0d47a1; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-size:.85rem; cursor:pointer; transition:transform .1s ease; }
.btn:hover{ transform:scale(1.04); }
.btn:disabled{ opacity:.6; cursor:default; }
.btn.ghost{ background:transparent; color:#0d47a1; border:1px solid #0d47a1; }
.btn.ghost.active{ background:#e3f2fd; }
.btn.wide{ width:100%; margin-top:6px; }
.slider-row{ display:flex; align-items:center; gap:8px; font-size:.85rem; }
input[type="range"]{ width:160px; accent-color:#0d47a1; }
.small{ font-size:.8rem; }
.muted{ color:#555; }
.hint{ margin-top:10px; font-size:.78rem; color:#555; }
.directions-card{ margin-top:12px; background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:12px; padding:12px; text-align:center; }
.directions-card .title{ font-weight:700; margin-bottom:4px; color:#0d47a1; }
.directions-card .coords{ margin-bottom:8px; font-size:.8rem; }
.directions-card .tiny{ font-size:11px; color:#666; margin-top:6px; }
.empty-note{ background:#fff3e0; border:1px solid #ffe0b2; color:#e65100; padding:8px; border-radius:8px; font-size:.85rem; margin-bottom:10px; }

/* 响应式 */
@media (max-width:1200px){
  .nearby-wrap{ grid-template-columns:1fr; }
  .panel.fancy.right{ right:12px; left:12px; width:auto; }
}
</style>
