<!-- src/views/HomePage.vue -->
<template>
  <div class="homepage">
    <!-- Hero: left copy (centered, pushed down) + right stacked cards -->
    <section class="hero">
      <div class="container hero-grid">
        <!-- LEFT: centered copy + vertical buttons -->
        <div class="hero-left">
          <div class="copy-wrap">
            <h1 class="hero-title">
              <span class="title-line-1">Helping Families Walk with</span>
              <span class="title-line-2">Confidence & Care</span>
            </h1>
            <p class="hero-subtitle">
              Discover the safest and most comfortable outdoor experiences for your little ones — season by season.
            </p>

            <!-- Vertical, pretty buttons -->
            <div class="cta-col">
              <router-link to="/seasonal-comfort" class="btn btn-primary">
                <span class="btn-ink"></span>
                <span class="btn-label">Explore Seasonal Comfort</span>
              </router-link>

              <router-link to="/comfort-insights" class="btn btn-ghost">
                <span class="btn-ink"></span>
                <span class="btn-label">View Weather Insight</span>
              </router-link>
            </div>
          </div>
        </div>

        <!-- RIGHT: stacked info cards -->
        <div class="hero-right">
          <!-- UV -->
          <div class="info-card uv-card">
            <div class="card-header">
              <div class="icon-container">
                <img src="../images/4.png" alt="Sun icon" class="icon-image" />
              </div>
              <div class="card-title">
                <h3>UV Index</h3>
                <p>Current Level</p>
              </div>
              <div class="risk-tag" :class="uvLevel.toLowerCase().replace(' ', '-')">
                {{ uvLevel }}
              </div>
            </div>

            <div class="card-main-data">
              <div class="main-value">
                <span class="number">{{ uvIndex !== null ? uvIndex : '--' }}</span>
                <span class="scale">/11+</span>
              </div>

              <div class="risk-bar-section">
                <div class="risk-label">Risk Level</div>
                <div class="risk-bar">
                  <div
                    class="risk-fill"
                    :style="{
                      width: uvIndex !== null ? Math.min((uvIndex / 11) * 100, 100) + '%' : '0%',
                      background: uvIndex >= 8
                        ? 'linear-gradient(90deg, #ff6b6b, #d32f2f)'
                        : uvIndex >= 6
                        ? 'linear-gradient(90deg, #ffb74d, #f57c00)'
                        : uvIndex >= 3
                        ? 'linear-gradient(90deg, #fff176, #fdd835)'
                        : 'linear-gradient(90deg, #aed581, #81c784)'
                    }"
                  ></div>
                </div>
                <div class="risk-percentage">
                  {{ uvIndex !== null ? Math.min((uvIndex / 11) * 100, 100).toFixed(0) + '%' : '--' }}
                </div>
              </div>
            </div>

            <div class="advice-content">
              <p>{{ uvAdvice }}</p>
            </div>

            <div class="card-footer">
              <div class="update-info"><span>{{ formattedUvTime }}</span></div>
              <div class="data-source">Open-Meteo Weather</div>
            </div>
          </div>

          <!-- Wind -->
          <div class="info-card wind-card">
            <div class="card-header">
              <div class="icon-container">
                <img src="../images/5.png" alt="Flower icon" class="icon-image" />
              </div>
              <div class="card-title">
                <h3>Wind Speed</h3>
                <p>Current Level</p>
              </div>
              <div class="risk-tag" :class="windLevel.toLowerCase().replace(' ', '-')">
                {{ windLevel }}
              </div>
            </div>

            <div class="card-main-data">
              <div class="main-value">
                <span class="number-wind" :style="{ color: getWindTextColor(windLevel) }">
                  {{ windSpeed !== null ? windSpeed.toFixed(1) : '--' }}
                </span>
                <span class="scale">km/h</span>
              </div>

              <div class="risk-bar-section">
                <div class="risk-label">Wind Intensity</div>
                <div class="risk-bar">
                  <div
                    class="risk-fill"
                    :style="{
                      width: windSpeed !== null ? Math.min((windSpeed / 50) * 100, 100) + '%' : '0%',
                      background: windColor
                    }"
                  ></div>
                </div>
                <div class="risk-percentage">
                  {{ windSpeed !== null ? Math.min((windSpeed / 50) * 100, 100).toFixed(0) + '%' : '--' }}
                </div>
              </div>
            </div>

            <div class="advice-content">
              <p>
                {{
                  windLevel === 'Very Strong' ? 'Avoid outdoor activities, especially with children.' :
                  windLevel === 'Strong'      ? 'Windy conditions—be cautious with children and hats!' :
                  windLevel === 'Moderate'    ? 'Consider windproof clothing for kids.' :
                  windLevel === 'Low'         ? 'Ideal for outdoor play.' : ''
                }}
              </p>
            </div>

            <div class="card-footer">
              <div class="update-info"><span>{{ formattedWindTime }}</span></div>
              <div class="data-source">Open-Meteo Weather</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Articles at bottom -->
    <section class="articles">
      <div class="container">
        <h2 class="section-title">Latest Insights</h2>
        <div class="article-grid">
          <a
            class="article-card link-card"
            href="https://www.ausleisure.com.au/news/500000-trees-to-shade-parks-and-enhance-wildlife-habitats-in-melbournes-west/"
            target="_blank" rel="noopener noreferrer"
          >
            <div class="article-image">
              <img src="../images/500-trees.png" alt="Tree planting program" class="article-img" />
            </div>
            <div class="article-content">
              <h3>500,000 Trees to Shade Parks and Playgrounds</h3>
              <p>Discover how urban greening initiatives are creating safer outdoor spaces for children.</p>
            </div>
          </a>

          <a
            class="article-card link-card"
            href="https://www.parks.vic.gov.au/news/2023/07/19/02/37/winter-ideas-to-get-kids-outdoors?utm_source=chatgpt.com"
            target="_blank" rel="noopener noreferrer"
          >
            <div class="article-image">
              <img src="../images/winter.png" alt="Kids playing in snow" class="article-img" />
            </div>
            <div class="article-content">
              <h3>Winter Ideas to Get Kids Outdoors</h3>
              <p>Fun and safe outdoor activities to keep your children active during colder months.</p>
            </div>
          </a>

          <a
            class="article-card link-card"
            href="https://www.sydney.edu.au/news-opinion/news/2025/07/10/hot-weather-causes-children-to-sweat-at-the-same-rate-as-adults-study-shows.html?utm_source=chatgpt.com"
            target="_blank" rel="noopener noreferrer"
          >
            <div class="article-image">
              <img src="../images/hot.png" alt="Child drinking water on a hot day" class="article-img" />
            </div>
            <div class="article-content">
              <h3>Hot Weather Safety for Children</h3>
              <p>Essential tips to keep your kids safe and comfortable during hot weather.</p>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- 右下角 Ask-AI 浮窗 -->
    <AskAiWidget :api-base="API_BASE" />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useComfortData } from '@/composables/useComfortData'
import { format } from 'date-fns'
import AskAiWidget from '@/components/AskAiWidget.vue'

const API_BASE = import.meta.env.VITE_API_BASE

const {
  uvIndex,
  windSpeed,
  windLevel,
  uvTimestamp,
  windTimestamp,
  init
} = useComfortData()

onMounted(() => init())

const uvLevel = computed(() => {
  if (uvIndex.value === null) return 'Unknown'
  if (uvIndex.value >= 8) return 'Very High'
  if (uvIndex.value >= 6) return 'High'
  if (uvIndex.value >= 3) return 'Moderate'
  return 'Low'
})

const uvAdvice = computed(() => {
  if (uvIndex.value === null) return 'Loading UV data...'
  if (uvIndex.value >= 8) return 'Seek full shade. SPF 50+, long sleeves, and hat essential.'
  if (uvIndex.value >= 6) return 'Stay in shade during midday hours. Use SPF 30+ sunscreen.'
  if (uvIndex.value >= 3) return 'Wear sunglasses and use sunscreen if staying outside.'
  return 'Low risk. Minimal protection needed.'
})

const getWindTextColor = computed(() => (level) => {
  switch (level) {
    case 'Very Strong': return '#000080'
    case 'Strong':      return '#0d47a1'
    case 'Moderate':    return '#1976d2'
    case 'Low':         return '#4fc3f7'
    default:            return '#666'
  }
})

const windColor = computed(() => {
  switch (windLevel.value) {
    case 'Very Strong': return 'linear-gradient(90deg, rgba(0,0,255,1), rgba(138,43,226,1))'
    case 'Strong':      return 'linear-gradient(90deg, #4fc3f7, rgba(0,0,255,1))'
    case 'Moderate':    return 'linear-gradient(90deg, rgba(0,255,255,1), #4fc3f7)'
    case 'Low':         return 'linear-gradient(90deg, rgba(173,216,230,1), rgba(100,149,237,1))'
    default:            return 'linear-gradient(90deg, #ccc, #eee)'
  }
})

const formattedUvTime = computed(() =>
  uvTimestamp.value ? format(new Date(uvTimestamp.value), 'yyyy-MM-dd HH:mm') : 'No time available'
)
const formattedWindTime = computed(() =>
  windTimestamp.value ? format(new Date(windTimestamp.value), 'yyyy-MM-dd HH:mm') : 'No time available'
)
</script>

<style scoped>
/* 你的原样式保持不变 */
.homepage {
  min-height: 100vh;
  background:
    radial-gradient(1400px 300px at 50% -220px, rgba(94,53,177,.08), transparent 60%),
    linear-gradient(180deg, #f8faf8 0%, #e8f5e8 100%);
  color: #2b2b2b;
  font-family: 'Segoe UI','Arial',sans-serif;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* ===== HERO ===== */
.hero { padding: 40px 0 24px; }
.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 32px;
  align-items: center;
}

/* LEFT */
.hero-left { display: flex; align-items: center; justify-content: flex-start; }
.copy-wrap { text-align: left; max-width: 640px; margin-left: 20px; }
.hero-title { margin: 0 0 12px; line-height: 1.15; display: flex; flex-direction: column; align-items: flex-start; }
.title-line-1 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; color: #2b2b2b; letter-spacing: -0.02em; }
.title-line-2 { font-size: clamp(40px, 6vw, 64px); font-weight: 900; color: #39e6db; letter-spacing: -0.02em; }
.hero-subtitle { font-size: clamp(16px, 2vw, 20px); color: #627a6b; margin: 10px 0 22px; max-width: 56ch; line-height: 1.65; }

/* Buttons */
.cta-col { display: grid; gap: 14px; max-width: 340px; margin: 0 auto; justify-items: center; }
.btn { position: relative; display: grid; place-items: center; text-decoration: none; border-radius: 999px; padding: 14px 18px; font-weight: 900; letter-spacing: .2px; overflow: hidden; isolation: isolate; box-shadow: 0 14px 30px rgba(0,0,0,.08); transition: transform .15s ease, box-shadow .15s ease, filter .15s ease; }
.btn-ink { position: absolute; inset: 0; border-radius: inherit; opacity: .7; z-index: -1; }
.btn-label { position: relative; z-index: 1; }
.btn.btn-primary { color: #fff; background: linear-gradient(135deg, #6f3bd0 0%, #5e35b1 40%, #4a2c9a 100%); border: 1px solid rgba(90, 55, 170, .35); }
.btn.btn-primary .btn-ink { background: radial-gradient(120% 220% at 10% 0%, rgba(255,255,255,.22), transparent 60%); }
.btn.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 20px 44px rgba(94,53,177,.28); filter: saturate(1.05); }
.btn.btn-ghost { color: #2e7d32; background: linear-gradient(180deg, #ffffff, #f4fbf6); border: 1px solid rgba(46,125,50,.25); }
.btn.btn-ghost .btn-ink { background: radial-gradient(120% 220% at 10% 0%, rgba(46,125,50,.10), transparent 60%); }
.btn.btn-ghost:hover { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(46,125,50,.20); }

/* RIGHT — stacked cards */
.hero-right { display: grid; grid-template-rows: 1fr 1fr; gap: 18px; }
.info-card { background: #fff; border: 1px solid rgba(0,0,0,.06); border-radius: 20px; padding: 22px; box-shadow: 0 10px 26px rgba(0,0,0,.08); transition: transform .15s ease, box-shadow .15s ease; }
.info-card:hover { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(0,0,0,.12); }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.icon-container { width: 56px; height: 56px; display: grid; place-items: center; }
.icon-image { width: 72px; height: 72px; }
.card-title { flex: 1; margin-left: 12px; }
.card-title h3 { margin: 0; color: #6a0592; font-size: 1.2rem; font-weight: 800; }
.card-title p { margin: 2px 0 0; color: #9e62ac; font-size: .9rem; }
.risk-tag { padding: 6px 12px; border-radius: 999px; font-size: .78rem; font-weight: 800; text-transform: uppercase; }
.risk-tag.low        { background: rgba(76,175,172,.10); color: #4cafac; border: 1px solid rgba(76,175,172,.28); }
.risk-tag.moderate   { background: rgba(255,225,0,.10); color: #ffe100; border: 1px solid rgba(255,225,0,.35); }
.risk-tag.high       { background: rgba(255,152,0,.10); color: #ff9800; border: 1px solid rgba(255,152,0,.35); }
.risk-tag.very-high  { background: rgba(255,68,68,.10); color: #ff4444; border: 1px solid rgba(255,68,68,.35); }
.risk-tag.strong     { background: #0d03911e; color: #0d0391; border: 1px solid #0d039168; }
.risk-tag.very-strong{ background: #4466ff1c; color: #4466ff; border: 1px solid #4466ff47; }

.card-main-data { margin-bottom: 8px; }
.main-value { display: flex; align-items: baseline; gap: 8px; justify-content: center; }
.number { font-size: 3rem; font-weight: 900; color: #ff6b35; }
.number-wind { font-size: 3rem; font-weight: 900; }
.scale { font-size: 1.2rem; color: #667085; }
.risk-bar-section { margin-top: 10px; }
.risk-label { font-size: .9rem; color: #667085; margin-bottom: 6px; }
.risk-bar { height: 8px; border-radius: 4px; background: #eef2f1; overflow: hidden; }
.risk-fill { height: 100%; border-radius: 4px; transition: width .3s ease; }
.risk-percentage { text-align: right; font-size: .86rem; color: #667085; font-weight: 700; margin-top: 4px; }
.advice-content p { font-size: 1rem; color: #7a4f7f; margin: 8px 0 0; line-height: 1.5; }
.card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(0,0,0,.06); }
.update-info, .data-source { font-size: .85rem; color: #888; }

/* ===== Articles ===== */
.articles { padding: 70px 0 90px; background: #fff; }
.section-title { text-align: center; font-size: 2rem; color: #2e7d32; font-weight: 900; margin-bottom: 28px; }
.article-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
.article-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 8px 24px rgba(0,0,0,.06); transition: transform .15s ease, box-shadow .15s ease; }
.article-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,0,0,.10); }
.article-image { height: 200px; overflow: hidden; }
.article-img { width: 100%; height: 100%; object-fit: cover; }
.article-content { padding: 18px 20px 22px; }
.article-content h3 { margin: 0 0 8px; color: #2e7d32; font-size: 1.15rem; }
.article-content p { margin: 0; color: #667085; line-height: 1.6; }

/* ===== Responsive ===== */
@media (max-width: 980px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-right { grid-template-rows: none; }
  .copy-wrap { margin-left: 0; text-align: center; margin-top: 32px; }
  .cta-col { justify-items: center; }
}
</style>
