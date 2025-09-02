<template>
  <div class="seasonal-comfort-page">

    <!-- Hero 区 -->
    <section class="hero">
      <div class="hero-overlay">
        <h1 class="hero-title">Seasonal Comfort Explorer</h1>
        <p class="hero-sub">
          Find the safest and most comfortable outdoor routes for your family – shade in summer and sun in winter.
        </p>

        <!-- 季节切换按钮 -->
        <div class="season-tabs">
          <button
            class="tab"
            :class="{ active: season === 'summer' }"
            @click="season = 'summer'"
            aria-label="Summer"
            title="Summer"
          >☀️ Summer</button>
          <button
            class="tab"
            :class="{ active: season === 'winter' }"
            @click="season = 'winter'"
            aria-label="Winter"
            title="Winter"
          >❄️ Winter</button>
          <!-- <button
            class="tab"
            :class="{ active: season === 'pollen' }"
            @click="season = 'pollen'"
            aria-label="Pollen"
            title="Pollen"
          >🌸 Pollen</button> -->
        </div>
      </div>
    </section>

    <!-- 主体两栏 -->
    <section class="main">
      <!-- 左侧：地图占位（接后端） -->
      <div class="map-panel">
        <div class="panel-header">MELBOURNE CBD</div>

        <!-- 地图容器（待接后端） -->
        <div class="map-wrap">
          <div id="shade-map" class="map-placeholder">
            <div class="map-skeleton">
              <div class="sk-row"></div>
              <div class="sk-row"></div>
              <div class="sk-row"></div>
            </div>
            <div class="map-tip">
              Map loading placeholder. Hook your backend/tiles here.
            </div>
          </div>

          <!-- 右侧色条（随季节切换样式与标签） -->
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

        <!-- 底部说明与图例（随季节切换文案） -->
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
      </div>

      <!-- 右侧：推荐卡片（随季节切换） -->
      <aside class="recommendation">
        <div class="rec-title">{{ titleMap[season] }} RECOMMENDATION</div>

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
              <p class="rec-desc">{{ item.desc }}</p>
            </div>

            <div class="rec-foot">
              <button class="nav-btn" @click="goTo(item)">navigate</button>
            </div>
          </li>
        </ul>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const season = ref('summer')

/* ====== 推荐数据（示例：为便于测试导航，补充了部分 lat/lng 字段） ====== */
const listsBySeason = {
  summer: [
    {
      name: 'Royal Park',
      tags: ['Shade', 'Playground', 'Walk paths'],
      desc: 'Largest inner-city park with extensive canopy cover. Shaded playgrounds and open lawns make it ideal for summer family outings.',
      photo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Park_Melbourne.jpg?width=1200',
      lat: -37.787, lng: 144.951
    },
    {
      name: 'Fitzroy Gardens',
      tags: ['Dense trees', 'Family-friendly', 'Tram nearby'],
      desc: 'Consistently shaded lawns with tall elm trees. Shady paths and children’s play spaces help keep kids cool in hot weather.',
      photo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fitzroy_Gardens.jpg?width=1200',
      lat: -37.813, lng: 144.980
    },
    {
      name: 'Flagstaff Gardens',
      tags: ['Tree cover', 'Playground', 'Near transport'],
      desc: 'Central city park with shaded lawns and covered seating areas. Easy to reach via tram/train, good for short outdoor play.',
      photo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flagstaff_Gardens_Melbourne.jpg?width=1200',
      lat: -37.811, lng: 144.955
    }
  ],
  winter: [
    {
      name: 'Birrarung Marr',
      tags: ['Sunny lawns', 'Riverside', 'Open space'],
      desc: 'Open riverside spaces with plenty of winter sun exposure. Great for short walks and scooter time.',
      photo: 'https://commons.wikimedia.org/wiki/Special:FilePath/AUS%20Melbourne%2C%20Central%20Business%20District%2C%20Birrarung%20Marr%20004.jpg?width=1200',
      lat: -37.818, lng: 144.974
    },
    {
      name: 'Carlton Gardens',
      tags: ['Sun exposure', 'Museum nearby'],
      desc: 'Wide open lawns receive ample sunlight in winter daytime, with nearby amenities for families.',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Carlton_Gardens%2C_Melbourne.jpg',
      lat: -37.805, lng: 144.972
    },
    {
      name: 'Queen Victoria Gardens',
      tags: ['Sunny paths', 'Picnic'],
      desc: 'Long open paths and lawns that warm up quickly on clear winter days.',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Floral_Clock_at_Queen_Victoria_Gardens%2C_Melbourne.jpg',
      lat: -37.820, lng: 144.971
    }
  ],
  // pollen: [
  //   {
  //     name: 'Royal Botanic Gardens',
  //     tags: ['Lower pollen pockets', 'Shaded routes'],
  //     desc: 'Choose lakeside and dense-canopy tracks to reduce pollen exposure during peak periods.',
  //     photo: 'https://commons.wikimedia.org/wiki/Special:FilePath/Royal%20Botanic%20Gardens%20View%20Melbourne.JPG?width=1200',
  //     lat: -37.830, lng: 144.979
  //   },
  //   {
  //     name: 'Princes Park (North)',
  //     tags: ['Breeze corridor', 'Open loop'],
  //     desc: 'Use perimeter loop on low-count hours; avoid mowing days. Good visibility and exits.',
  //     photo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Princes_Park%2C_Carlton_North%2C_Victoria%2C_Australia.jpg',
  //     lat: -37.778, lng: 144.961
  //   },
  //   {
  //     name: 'Docklands Promenade',
  //     tags: ['Sea breeze', 'Lower grass'],
  //     desc: 'Hardscape waterfront with fewer grass areas helps reduce exposure for sensitive kids.',
  //     photo: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Docklands_%2C_Melbourne.jpg',
  //     lat: -37.816, lng: 144.946
  //   }
  // ]
}

/* ====== 左侧说明/标签随季节切换 ====== */
const titleMap = { summer: 'SUMMER', winter: 'WINTER', pollen: 'POLLEN' }
const barLabelMap = {
  summer: 'Tree Shade (relative)',
  winter: 'Sun Exposure (relative)',
  // pollen: 'Pollen Index (relative)'
}
const captionMap = {
  summer: 'This map shows where you can find shade in Melbourne’s CBD.',
  winter: 'This map highlights sun-friendly spots for warmer winter walks.',
  // pollen: 'This map visualises relative pollen exposure across the CBD.'
}
const legendMoreMap = {
  summer: 'More tree cover: cooler and safer for kids to play or walk',
  winter: 'More sun exposure: warmer and brighter for winter play',
  // pollen: 'Lower pollen exposure: better for sensitive kids'
}
const legendLessMap = {
  summer: 'less tree cover: hotter and less comfortable',
  winter: 'less sun exposure: colder and dimmer paths',
  // pollen: 'higher pollen exposure: avoid during peak hours'
}

/* ===== 地图占位：把后端/地图 SDK 接口挂在这里 ===== */
onMounted(() => {
  // initMap('#shade-map')
  // fetch(`/api/layer?season=${season.value}`).then(drawLayer)
})

watch(season, (s) => {
  refreshMap(s)
})

function refreshMap(s) {
  // TODO: 根据季节加载不同数据/图层
  // fetch(`/api/layer?season=${s}`).then(updateLayer)
  // updateLegendScaleIfNeeded()
}

/** ✅ Google Maps 导航（优先 place_id -> lat/lng -> name） */
function goTo(item, mode = 'walking') {
  const travelmode = String(mode).toUpperCase() // WALKING | DRIVING | TRANSIT | BICYCLING
  let url = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&travelmode=${travelmode}`

  if (item.place_id) {
    url += `&destination_place_id=${encodeURIComponent(item.place_id)}`
  } else if (item.lat != null && item.lng != null) {
    url += `&destination=${item.lat},${item.lng}`
  } else {
    url += `&destination=${encodeURIComponent(item.name)}`
  }

  window.open(url, '_blank', 'noopener')
}
</script>

<style scoped>
/* 页面背景 */
.seasonal-comfort-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7fbf5 0%, #eef7ea 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部 Hero */
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
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.hero-sub {
  max-width: 920px;
  line-height: 1.5;
  opacity: 0.95;
}

/* Tabs */
.season-tabs {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}
.tab {
  border: none;
  padding: 10px 16px;
  background: #fffef3;
  border-radius: 999px;
  font-weight: 700;
  color: #7a8a00;
  box-shadow: 0 1px 0 rgba(0,0,0,0.05), inset 0 0 0 2px #f1f5d1;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.tab:hover { transform: translateY(-1px); }
.tab.active {
  background: #fff;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08), inset 0 0 0 2px #c6e6a7;
  color: #2e7d32;
}

/* 主体两栏布局 */
.main {
  display: grid;
  grid-template-columns: minmax(320px, 740px) minmax(280px, 520px);
  gap: 24px;
  padding: 24px;
}
@media (max-width: 980px) {
  .main { grid-template-columns: 1fr; }
}

/* 左侧地图容器 */
.map-panel {
  background: #ffffffcc;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.06);
  border: 1px solid rgba(46, 125, 50, 0.08);
}
.panel-header {
  color: #4a5a3b;
  font-weight: 800;
  letter-spacing: 1.2px;
  margin: 6px 0 12px;
}
.map-wrap {
  display: grid;
  grid-template-columns: 1fr 64px;
  gap: 12px;
  align-items: start;
}
.map-placeholder {
  height: 380px;
  background: #f0f6ef;
  border-radius: 12px;
  border: 1px solid #e1eadf;
  position: relative;
  overflow: hidden;
}
.map-skeleton {
  position: absolute;
  inset: 0;
  padding: 14px;
  display: grid;
  gap: 10px;
}
.sk-row {
  height: 96px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e7efe6, #f4faf3, #e7efe6);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.map-tip {
  position: absolute;
  bottom: 10px;
  left: 12px;
  font-size: 12px;
  color: #6d7a64;
  background: #ffffffc2;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #e2eadf;
}

/* 右侧色条：不同季节不同渐变 */
.colorbar { display: flex; flex-direction: column; align-items: center; }
.colorbar .bar {
  width: 18px;
  height: 260px;
  border-radius: 8px;
  border: 1px solid #d9e9d6;
  background: linear-gradient(180deg, #1f8f3a 0%, #a7d6a1 100%); /* summer 默认 */
}
.colorbar.winter .bar {
  background: linear-gradient(180deg, #f6c35b 0%, #fde8b2 100%);
}
.colorbar.pollen .bar {
  background: linear-gradient(180deg, #cc6ad8 0%, #f1ccff 100%);
}
.bar-label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 12px;
  color: #456049;
  margin-top: 8px;
}
.bar-scale {
  display: grid;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  color: #6b7b67;
}

/* 图例与说明 */
.map-caption {
  margin: 10px 2px 14px;
  font-size: 12px;
  color: #6b7b67;
}
.legend {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4f5f48;
  font-size: 14px;
}
.legend-box {
  width: 18px; height: 18px; border-radius: 4px; border: 1px solid #cfe3cc;
}
.legend-box.more { background: #2e7d32; }
.legend-box.more.winter { background: #f6c35b; }
.legend-box.more.pollen { background: #cc6ad8; }
.legend-box.less { background: #ecf4ea; }

/* 右侧推荐卡片 */
.recommendation {
  background: #f4f9f0cc;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.06);
  border: 1px solid rgba(46, 125, 50, 0.08);
}
.rec-title {
  background: #e4f5d9;
  color: #355f34;
  font-weight: 900;
  letter-spacing: 1px;
  border-radius: 999px;
  padding: 10px 16px;
  display: inline-block;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.04);
  margin: 2px 0 12px;
}
.rec-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
}
.rec-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e4efe1;
  padding: 14px;
  display: grid;
  gap: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}
.rec-head {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: center;
}
.rec-icon { font-size: 22px; }
.rec-name {
  margin: 0;
  color: #355f34;
  font-size: 1.05rem;
  font-weight: 800;
}
.rec-tags {
  grid-column: 1 / -1;
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px;
}
.tag {
  background: #f3fbef;
  border: 1px solid #d8ecd4;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #547a54;
}
.rec-body {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: start;
}
.rec-photo {
  width: 120px; height: 84px; border-radius: 10px;
  background: url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop') center/cover no-repeat;
  border: 1px solid #e5efe3;
}
.rec-desc {
  margin: 0;
  font-size: 14px;
  color: #5a6a57;
  line-height: 1.5;
}
.rec-foot { display: flex; justify-content: flex-end; }
.nav-btn {
  border: none;
  background: #e9f7e3;
  color: #2e7d32;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 0 0 2px #cde9c1;
  transition: transform 0.08s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.nav-btn:hover { transform: translateY(-1px); background: #f7fff4; }
</style>
