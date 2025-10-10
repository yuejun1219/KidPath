<template>
  <div class="seasonal-comfort-page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-overlay">
        <h1 class="hero-title">Seasonal Comfort Explorer</h1>
        <p class="hero-sub">
          Find the safest and most comfortable outdoor routes for your family – shade in summer and sun in winter.
        </p>
      </div>
    </section>

    <!-- main left and right columns -->
    <section class="main">
      <!-- left column - map -->
      <div class="map-panel">
        <!-- Season Toggle Slider -->
        <div class="season-toggle-container">
          <div class="season-toggle">
            <input 
              type="checkbox" 
              id="season-toggle" 
              :checked="season === 'winter'"
              @change="toggleSeason"
            />
            <label for="season-toggle" class="toggle-slider">
              <span class="toggle-text summer-text" :class="{ active: season === 'summer' }">☀️ Summer</span>
              <span class="toggle-text winter-text" :class="{ active: season === 'winter' }">❄️ Winter</span>
            </label>
          </div>
        </div>
        
        <div class="panel-header">MELBOURNE CBD</div>

        <!-- map -->
        <div class="map-wrap">
          <div id="shade-map" class="map-container">
            <!-- loading -->
            <div v-if="loading" class="map-loading">
              <div class="loading-spinner"></div>
              <p>Loading {{ season }} data...</p>
            </div>   
            <!-- error -->
            <div v-else-if="error" class="map-error">
              <p>{{ error }}</p>
              <button @click="fetchData" class="retry-btn">Retry</button>
            </div>
            <!-- map will be rendered here when not loading -->
          </div>        
          
          <!-- color bar -->
          <div class="colorbar" :class="season">
            <div class="bar"></div>
            <div class="bar-label">{{ barLabelMap[season] }}</div>
            <div class="bar-scale">
              <span>1.0</span>
              <span>0.8</span>
              <span>0.6</span>
              <span>0.4</span>
              <span>0.2</span>
              <span>0.0</span>
            </div>
          </div>
        </div>

        <!-- Bottom Notes and Legend (Seasonal Copy) -->
        <p class="map-caption">
          {{ captionMap[season] }}
        </p>

        <div class="legend">
          <div class="legend-item">
            <span class="legend-box more" :class="season"></span>
            <span>{{ legendMoreMap[season] }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-box less"></span>
            <span>{{ legendLessMap[season] }}</span>
          </div>
        </div>
        
        <!-- Decorative playground icon -->
        <div class="playground-decoration">
          <img src="/src/images/playground.png" alt="Playground decoration" class="playground-icon" />
        </div>

      </div>

      <!-- right: recommendation cards -->
      <aside class="recommendation">
        <div class="rec-title">{{ titleMap[season] }} RECOMMENDATION</div>
        <div class="rec-subtitle">
          {{ season === 'summer' ? 'Most shaded playgrounds for hot summer days' : 'Most sunny playgrounds for warm winter walks' }}
        </div>

        <!-- loading -->
        <div v-if="loading" class="rec-loading">
          <div v-for="i in 3" :key="i" class="rec-skeleton"></div>
        </div>

        <!-- recommendation lists -->
        <ul class="rec-list">
          <li class="rec-card" v-for="(item, i) in listsBySeason[season]" :key="i">
            <div class="rec-head">
              <div class="rec-icon">🌳</div>
              <h3 class="rec-name">{{ item.name }}</h3>
              <div class="rec-tags">
                <span v-for="(t, idx) in item.tags" :key="idx" class="tag">{{ t }}</span>
              </div>
            </div>

            <div class="rec-body">
              <div class="rec-photo" :style="item.photo && { backgroundImage: `url(${item.photo})` }" :aria-label="item.name + ' photo'"></div>
              <div class="rec-content">
                <p class="rec-desc">{{ item.desc }}</p>
                <div class="rec-stats">
                  <div class="stat-item">
                    <strong>{{ season === 'summer' ? 'Shade Coverage:' : 'Sun Exposure:' }}</strong> 
                    {{ season === 'summer' ? Math.round(item.shade_coverage) + '%' : Math.round(100 - item.shade_coverage) + '%' }}
                  </div>
                </div>
                <div class="rec-features" v-if="item.features">
                  <strong>Features:</strong> {{ item.features }}
                </div>
              </div>
            </div>

            <div class="rec-foot">
              <button class="nav-btn" @click="goTo(item)">navigate</button>
            </div>
          </li>
        </ul>
        
        <!-- empty status -->
        <div v-if="!loading && recommendations.length === 0" class="empty-state">
          <p>No recommendations available</p>
          <button @click="fetchData" class="retry-btn">Refresh</button>
        </div>
      </aside>

      <!-- 右下角浮动 AI 组件（可在任意页面复用） -->
      <KidPathChat
        title="Ask-AI · Comfort Education"
        placeholder="Ask something like: Why are kids more vulnerable to heat?"
/>

    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2025 KidPath. Helping families explore safely.</p>
      </div>
    </footer>    
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import KidPathChat from '@/components/KidPathChat.vue'


const season = ref('summer')
const loading = ref(false)
const error = ref(null)
const recommendations = ref([])
const playgroundsData = ref(null)
const map = ref(null)
const playgroundLayer = ref(null)

// local dev backend URL
const API_BASE = import.meta.env.VITE_API_BASE

const titleMap = { summer: 'SUMMER', winter: 'WINTER' }
const barLabelMap = {
  summer: 'Tree Shade (relative)',
  winter: 'Sun Exposure (relative)'
}
const captionMap = {
  summer: 'This map shows where you can find shade in Melbourne\'s CBD.',
  winter: 'This map highlights sun-friendly spots for warmer winter walks.'
}
const legendMoreMap = {
  summer: 'More tree cover: cooler and safer for kids to play or walk',
  winter: 'More sun exposure: warmer and brighter for winter play'
}
const legendLessMap = {
  summer: 'less tree cover: hotter and less comfortable',
  winter: 'less sun exposure: colder and dimmer paths'
}

// 默认照片映射（基于playground名称）
const photoMap = {
  'royal park': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
  'fitzroy gardens': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=800&auto=format&fit=crop',
  'flagstaff gardens': 'https://images.unsplash.com/photo-1495954484750-af469f2f9be5?q=80&w=800&auto=format&fit=crop',
  'carlton gardens': 'https://images.unsplash.com/photo-1519638831568-d9897f573d58?q=80&w=800&auto=format&fit=crop',
  'birrarung marr': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop'
}

// computed property for seasonal recommendations
const listsBySeason = computed(() => {
  // 定义夏季和冬季的特定照片
  const summerPhotos = [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Park_Melbourne.jpg?width=1200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Fitzroy_Gardens.jpg?width=1200',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Flagstaff_Gardens_Melbourne.jpg?width=1200'
  ]
  
  const winterPhotos = [
    'https://commons.wikimedia.org/wiki/Special:FilePath/AUS%20Melbourne%2C%20Central%20Business%20District%2C%20Birrarung%20Marr%20004.jpg?width=1200',
    'https://upload.wikimedia.org/wikipedia/commons/f/fe/Carlton_Gardens%2C_Melbourne.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f9/Floral_Clock_at_Queen_Victoria_Gardens%2C_Melbourne.jpg'
  ]

  return {
    summer: recommendations.value.map((item, index) => ({
      ...item,
      tags: getTags(item, 'summer'),
      photo: summerPhotos[index] || getPhotoStyle(item.name).backgroundImage.replace('url(', '').replace(')', ''),
      desc: getDescription(item, 'summer', index)
    })),
    winter: recommendations.value.map((item, index) => ({
      ...item,
      tags: getTags(item, 'winter'),
      photo: winterPhotos[index] || getPhotoStyle(item.name).backgroundImage.replace('url(', '').replace(')', ''),
      desc: getDescription(item, 'winter', index)
    }))
  }
})

// fetch api data
async function fetchSeasonalData(seasonValue) {
  try {
    const response = await fetch(`${API_BASE}/seasonal-comfort?season=${seasonValue}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (err) {
    console.error('Failed to fetch seasonal data:', err)
    throw new Error('Failed to load data. Please check if the backend is running.')
  }
}

async function fetchData() {
  loading.value = true
  error.value = null

  try {
    const data = await fetchSeasonalData(season.value)
    
    // update recommendation lists
    recommendations.value = data.top_recommendations || []
    
    // update playgrounds data for map
    playgroundsData.value = data.playgrounds_geojson
    
    // update map layer
    if (map.value && data.playgrounds_geojson) {
      updateMapLayer(data.playgrounds_geojson)
    }
    
  } catch (err) {
    error.value = err.message
    recommendations.value = []
  } finally {
    loading.value = false
    // ensure map is visible after loading
    if (map.value) {
      map.value.invalidateSize()
    }
  }
}

// toggle season
async function toggleSeason(event) {
  const newSeason = event.target.checked ? 'winter' : 'summer'
  if (newSeason === season.value) return
  season.value = newSeason
  await fetchData()
}

// map initialization
function initMap() {
  map.value = L.map('shade-map').setView([-37.8136, 144.9631], 14)
  
  // add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)
  
  map.value.zoomControl.setPosition('topright')
}

/* ====== update map layer ====== */
function updateMapLayer(geojsonData) {
  if (!map.value) return
  
  // clear existing layer
  if (playgroundLayer.value) {
    map.value.removeLayer(playgroundLayer.value)
  }
  
  // create new layer
  playgroundLayer.value = L.geoJSON(geojsonData, {
    pointToLayer: (feature, latlng) => {
      const shade = feature.properties.shade_coverage
      const color = getPlaygroundColor(shade, season.value)
      const size = getPlaygroundSize(shade, season.value)
      
      return L.circleMarker(latlng, {
        radius: size,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      })
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties
      const shadeCoverage = parseFloat(props.shade_coverage).toFixed(2)
      const sunExposure = (100 - parseFloat(props.shade_coverage)).toFixed(2)
      const coverageLabel = season.value === 'summer' ? 'Shade Coverage' : 'Sun Exposure'
      const coverageValue = season.value === 'summer' ? shadeCoverage : sunExposure
      
      const popupContent = `
        <div class="popup-content">
          <h4>${props.name}</h4>
          <p><strong>${coverageLabel}:</strong> ${coverageValue}%</p>
          <p><strong>Features:</strong> ${props.features || 'N/A'}</p>
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${props.latitude},${props.longitude}&travelmode=WALKING', '_blank')" class="popup-nav-btn">Navigate</button>
        </div>
      `
      layer.bindPopup(popupContent)
    }
  }).addTo(map.value)
}

/* ====== map style ====== */
function getPlaygroundColor(shadePercentage, currentSeason) {
  if (currentSeason === 'summer') {
    // summer: green, shader deeper
    const intensity = Math.min(shadePercentage / 60, 1) // max at 60%
    return `hsl(120, 60%, ${Math.max(20, 70 - intensity * 40)}%)`
  } else {
    // winter: orange, less shader deeper
    const sunExposure = 100 - shadePercentage
    const intensity = Math.min(sunExposure / 80, 1)
    return `hsl(35, 70%, ${Math.max(30, 75 - intensity * 35)}%)`
  }
}

function getPlaygroundSize(shadePercentage, currentSeason) {
  const baseSize = 8
  if (currentSeason === 'summer') {
    return baseSize + (shadePercentage / 100) * 6
  } else {
    const sunExposure = 100 - shadePercentage
    return baseSize + (sunExposure / 100) * 6
  }
}

/* ====== UI helpers ====== */
function getDescription(item, currentSeason, index) {
  const shade = Math.round(item.shade_coverage || 0)
  const sun = 100 - shade
  
  const summerDescriptions = [
    `"Perfect tree canopy: Your little ones can play safely under nature's umbrella (${shade}% shade)"`,
    `"Green oasis: Cool, comfortable, and perfect for family fun in the shade (${shade}% shade)"`,
    `"Natural playground: Where trees and laughter meet for the best summer memories (${shade}% shade)"`,
    `"Shady paradise: Ideal spot for kids to explore without the summer heat (${shade}% shade)"`,
    `"Cool comfort zone: Trees provide the perfect backdrop for outdoor adventures (${shade}% shade)"`,
    `"Nature's playground: Shaded areas create the perfect environment for active play (${shade}% shade)"`,
    `"Summer sanctuary: A refreshing escape from the heat with natural shade (${shade}% shade)"`,
    `"Family-friendly shade: Perfect spot for picnics and playtime (${shade}% shade)"`
  ]
  
  const winterDescriptions = [
    `"Sunny sanctuary: Warm rays create the perfect winter playground atmosphere (${sun}% sun)"`,
    `"Bright and cozy: Sunlight brings warmth and joy to every winter visit (${sun}% sun)"`,
    `"Golden playground: Where winter sun makes every moment feel magical (${sun}% sun)"`,
    `"Warm welcome: Sun exposure creates the ideal winter outdoor experience (${sun}% sun)"`,
    `"Bright adventures: Perfect sun exposure for active winter play and exploration (${sun}% sun)"`,
    `"Sunny delight: Winter sun makes this playground a warm and inviting space (${sun}% sun)"`,
    `"Winter warmth: Soak up the sun while your kids enjoy outdoor fun (${sun}% sun)"`,
    `"Sunny haven: Bright and cheerful spot for cold weather activities (${sun}% sun)"`
  ]
  
  return currentSeason === 'summer'
    ? summerDescriptions[index % summerDescriptions.length]
    : winterDescriptions[index % winterDescriptions.length]
}

function getTags(item, season) {
  const tags = []
  const features = item.features || ''
  const shade = Math.round(item.shade_coverage || 0)
  const sun = 100 - shade
  
  if (season === 'summer') {
    if (shade > 60) tags.push('High Shade')
    else if (shade > 30) tags.push('Medium Shade')
    else tags.push('Low Shade')
  } else {
    if (sun > 70) tags.push('High Sun')
    else if (sun > 40) tags.push('Medium Sun')
    else tags.push('Low Sun')
  }
  
  if (features.toLowerCase().includes('swing')) tags.push('Swings')
  if (features.toLowerCase().includes('slide')) tags.push('Slides')
  if (features.toLowerCase().includes('climb')) tags.push('Climbing')
  if (features.toLowerCase().includes('toilet')) tags.push('Toilets')
  if (features.toLowerCase().includes('barbecue')) tags.push('BBQ')
  if (features.toLowerCase().includes('disabled')) tags.push('Accessible')
  
  return tags.slice(0, 3)
}

function getPhotoStyle(name) {
  const key = name.toLowerCase()
  for (const [keyword, url] of Object.entries(photoMap)) {
    if (key.includes(keyword)) {
      return { backgroundImage: `url(${url})` }
    }
  }
  return { backgroundImage: `url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop)` }
}

function navigateToPlayground(item) {
  const lat = item.coordinates ? item.coordinates[1] : null
  const lng = item.coordinates ? item.coordinates[0] : null
  
  let url = 'https://www.google.com/maps/dir/?api=1&origin=Current+Location&travelmode=WALKING'
  if (lat && lng) url += `&destination=${lat},${lng}`
  else url += `&destination=${encodeURIComponent(item.name)}`
  window.open(url, '_blank', 'noopener')
}
function goTo(item) { navigateToPlayground(item) }

/* ====== life cycle ====== */
onMounted(async () => {
  await nextTick()
  initMap()
  await fetchData()
})

watch(season, () => {
  if (playgroundsData.value) updateMapLayer(playgroundsData.value)
})
</script>

<style scoped>
/* background */
.seasonal-comfort-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7fbf5 0%, #eef7ea 100%);
  display: flex;
  flex-direction: column;
}

/* Hero */
.hero {
  position: relative;
  height: 230px;
  background:
    linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.2)),
    url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop') center/cover no-repeat;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.hero-overlay {
  height: 100%;
  padding: 24px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: end;
  gap: 12px;
}
.hero-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.hero-sub {
  max-width: 920px;
  line-height: 1.5;
  opacity: 0.95;
}

/* Season Toggle */
.season-toggle-container {
  display: flex;
  justify-content: left;
  margin-top: 10px;
  margin-bottom: 15px;
}
.season-toggle { position: relative; display: inline-block; width: 180px; height: 45px; }
.season-toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background: #f5f5f5; border-radius: 22px; border: 2px solid #e0e0e0;
  transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
input:checked + .toggle-slider { background: #f9d39b; border: 2px solid #fccf87; }
.toggle-slider:before {
  position: absolute; content: ""; height: 39px; width: 87px; left:1.5px; bottom: 1.5px;
  background: #80ad26f6; transition: all 0.3s ease; border-radius: 19px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
input:checked + .toggle-slider:before { transform: translateX(87px); background: #fcaa2f; }
.toggle-text {
  position: absolute; top: 50%; transform: translateY(-50%); font-weight: 600; font-size: 13px;
  transition: all 0.3s ease; pointer-events: none; width: 50%; text-align: center;
}
.toggle-text.summer-text { left: 0; color: #708601; }
.toggle-text.winter-text { right: 0; color: #da660e; }
.toggle-text.active { color: white; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); }

/* main layout */
.main {
  display: grid;
  grid-template-columns: minmax(320px, 740px) minmax(280px, 520px);
  gap: 40px;
  padding: 60px 50px 20px 50px;
  align-items: start;
}
@media (max-width: 980px) {
  .main { grid-template-columns: 1fr; padding: 30px 20px 20px 20px; }
}
@media (max-width: 768px) {
  .main { padding: 20px 15px; gap: 20px; }
  .map-container { height: 400px; }
  .map-panel { min-height: 450px; }
}
@media (max-width: 480px) {
  .main { padding: 15px 10px; gap: 15px; }
  .map-container { height: 350px; }
  .map-panel { min-height: 400px; padding: 12px; }
  .season-toggle-container { margin-bottom: 12px; }
  .rec-title { font-size: 16px; padding: 8px 12px; }
  .rec-subtitle { font-size: 12px; margin-bottom: 12px; }
}

/* map container */
.map-panel {
  background: #ffffffcc;
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.06);
  border: 1px solid rgba(46, 125, 50, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
}
.panel-header {
  color: #4a5a3b; font-weight: 800; font-size: 20px; letter-spacing: 1.2px; margin: 15px 0 5px 15px;
}
.map-wrap { display: grid; grid-template-columns: 1fr 64px; gap: 12px; align-items: start; }
.map-container {
  height: 650px; border-radius: 12px; border: 1px solid #e1eadf; position: relative; overflow: hidden; margin: 15px 0 10px 10px;
}
.map-loading, .map-error {
  height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0f6ef; color: #6d7a64; gap: 12px;
}
.loading-spinner { width: 24px; height: 24px; border: 2px solid #e1eadf; border-top: 2px solid #2e7d32; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
.retry-btn { padding: 8px 16px; background: #2e7d32; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
.retry-btn:hover { background: #1b5e20; }

/* color bar */
.colorbar { display: flex; flex-direction: column; align-items: center; }
.colorbar .bar {
  width: 18px; height: 280px; border-radius: 8px; border: 1px solid #d9e9d6;
  background: linear-gradient(180deg, #1f8f3a 0%, #a7d6a1 100%);
  margin-top: 70px;
}
.colorbar.winter .bar { background: linear-gradient(180deg, #f6c35b 0%, #fde8b2 100%); }
.bar-label { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px; color: #456049; margin-top: 8px; }
.bar-scale { display: grid; gap: 4px; margin-top: 6px; font-size: 11px; color: #6b7b67; }

/* legend */
.map-caption { margin: 65px 2px 8px 10px; font-size: 12px; color: #6b7b67; }
.legend { display: grid; gap: 6px; margin-top: 4px; margin-left: 10px; margin-bottom: -50px; }
.legend-item { display: flex; align-items: center; gap: 10px; color: #4f5f48; font-size: 14px; }
.legend-box { width: 18px; height: 18px; border-radius: 4px; border: 1px solid #cfe3cc; }
.legend-box.more { background: #2e7d32; }
.legend-box.more.winter { background: #f6c35b; }
.legend-box.more.pollen { background: #cc6ad8; }
.legend-box.less { background: #ecf4ea; }

/* right recommendation cards */
.recommendation {
  background: #f4f9f0cc; border-radius: 18px; padding: 18px; box-shadow: 0 4px 18px rgba(0,0,0,0.06);
  border: 1px solid rgba(46, 125, 50, 0.08); height: 100%; min-height: 600px; display: flex; flex-direction: column; position: relative; overflow: hidden;
}
.playground-decoration { display: flex; justify-content: right; margin-top: -100px; margin-right: -30px; margin-bottom: -90px; pointer-events: none; }
.playground-icon { width: 400px; height: 400px; object-fit: contain; opacity: 0.9; animation: float 4s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0px) rotate(-18deg) scale(1); } 50% { transform: translateY(-2px) rotate(-15deg) scale(1.02); } }
.rec-title {
  background: #e4f5d9; color: #355f34; font-weight: 900; letter-spacing: 1px; border-radius: 999px; padding: 10px 16px; display: inline-block;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.04); margin: 2px 0 8px; text-align: center;
}
.rec-subtitle { color: #6b7b67; font-size: 14px; margin-bottom: 16px; font-style: italic; text-align: center; }
.rec-loading { display: grid; gap: 14px; }
.rec-skeleton {
  height: 180px; background: linear-gradient(90deg, #e7efe6, #f4faf3, #e7efe6);
  background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 16px;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.rec-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; flex: 1; overflow-y: auto; }
.rec-card { background: #fff; border-radius: 16px; border: 1px solid #e4efe1; padding: 14px; display: grid; gap: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
.rec-head { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: center; }
.rec-icon { font-size: 22px; }
.rec-name { margin: 0; color: #355f34; font-size: 1.05rem; font-weight: 800; }
.rec-tags { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
.tag { background: #f3fbef; border: 1px solid #d8ecd4; border-radius: 999px; padding: 4px 10px; font-size: 12px; color: #547a54; }
.rec-body { display: grid; grid-template-columns: 120px 1fr; gap: 12px; align-items: start; }
.rec-content { display: flex; flex-direction: column; gap: 8px; }
.rec-stats { background: #f8f9fa; border-radius: 8px; padding: 8px 12px; border-left: 3px solid #5c9823; }
.stat-item { font-size: 13px; color: #48652e; }
.rec-features { font-size: 13px; color: #440661; line-height: 1.4; background: #efe1f134; padding: 8px 12px; border-radius: 8px; border-left: 3px solid #9b58b3; }
.rec-photo {
  width: 120px; height: 84px; border-radius: 10px;
  background: url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop') center/cover no-repeat; border: 1px solid #e5efe3;
}
.rec-desc { margin: 0; font-size: 16px; font-family: "Sour Gummy", cursive; color: #f4a3ee; line-height: 1.5; }
.rec-foot { display: flex; justify-content: flex-end; }
.nav-btn {
  border: none; background: #edfce0; color: #59912b; border-radius: 999px; padding: 8px 14px; font-weight: 700; cursor: pointer;
  box-shadow: inset 0 0 0 2px #e1f3d9; transition: transform 0.08s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.nav-btn:hover { transform: translateY(-1px); background: #f7fff4; }

.empty-state { text-align: center; padding: 32px; color: #6d7a64; }

:global(.popup-content) { max-width: 200px; }
:global(.popup-content h4) { margin: 0 0 8px 0; color: #2e7d32; }
:global(.popup-nav-btn) {
  margin-top: 8px; padding: 4px 8px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
}

/* Footer */
.footer { background: #2e7d32; color: white; text-align: center; padding: 30px 0; }
.footer p { margin: 0; font-size: 1rem; }
</style>
