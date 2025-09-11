<template>
  <div class="homepage">
    <!-- Hero Section -->
    <section class="hero">
      <img src="../images/tree-bg.png" alt="Tree background" class="hero-background" />
      <div class="hero-overlay">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="title-line-1">Helping Families Walk with</span>
            <span class="title-line-2">Confidence & Care</span>
          </h1>
          <p class="hero-subtitle">
            Discover the safest and most comfortable outdoor experiences for your little ones
          </p>
          <p class="season-text">season by season</p>

          <!-- Feature Highlights -->
          <div class="feature-highlights">
            <div class="feature-item">
              <div class="feature-dot blue"></div>
              <span>Real-time UV & Pollen Data</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot green"></div>
              <span>Comfort Insights</span>
            </div>
            <div class="feature-item">
              <div class="feature-dot yellow"></div>
              <span>Seasonal Activity Tips</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Information Cards -->
    <section class="info-cards">
      <div class="container">
        <!-- loading -->
        <div class="loading-state" v-if="loading">
          <p>Loading comfort data...</p>
        </div>

        <!-- error -->
        <div class="error-state" v-else-if="error">
          <p>Failed to load data: {{ error }}</p>
        </div>

        <div class="card-grid" v-else>
          <!-- UV Index Card -->
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
              <div class="update-info">
                <span>{{ formattedUvTime }}</span>
              </div>
              <div class="data-source">Open-Meteo Weather</div>
            </div>
          </div>

          <!-- Wind speed Card -->
          <div class="info-card wind-card">
            <div class="card-header">
              <div class="icon-container">
                <img src="../images/5.png" alt="Flower icon" class="icon-image" />
              </div>
              <div class="card-title">
                <h3>Wind Speed</h3>
                <p>Current Level</p>
              </div>
              <div class="risk-tag" :class="windLevel.toLowerCase().replace(' ', '-')">{{ windLevel }}</div>
            </div>

            <div class="card-main-data">
              <div class="main-value">
                <span
                  class="number-wind"
                  :style="{ color: getWindTextColor(windLevel) }"
                >
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

            <div class="advice-section">
              <div class="advice-content">
                <p>
                  {{
                    windLevel === 'Very Strong'
                      ? 'Avoid outdoor activities, especially with children.'
                      : windLevel === 'Strong'
                      ? 'Windy conditions—be cautious with children and hats!'
                      : windLevel === 'Moderate'
                      ? 'Consider windproof clothing for kids.'
                      : windLevel === 'Low'
                      ? 'Ideal for outdoor play.'
                      : ''
                  }}
                </p>
              </div>
            </div>

            <div class="card-footer">
              <div class="update-info">
                <span>{{ formattedWindTime }}</span>
              </div>
              <div class="data-source">Open-Meteo Weather</div>
            </div>
          </div>
        </div>

        <!-- Did You Know Section -->
        <div class="did-you-know">
          <div class="percentage">85%</div>
          <div class="fact-box">
            <div class="fact-icon">🌿</div>
            <div class="fact-text">
              <strong>Did You Know?</strong> Australian parents worry about their children's health during extreme heat.
              Last summer, heatwaves forced nearly 10% of Victorian schools to close.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Articles -->
    <section class="articles">
      <div class="container">
        <h2 class="section-title">Latest Insights</h2>
        <div class="article-grid">
          <!-- Card 1 -->
          <a
            class="article-card link-card"
            href="https://www.ausleisure.com.au/news/500000-trees-to-shade-parks-and-enhance-wildlife-habitats-in-melbournes-west/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open article: 500,000 Trees to Shade Parks and Playgrounds (opens in a new tab)"
          >
            <div class="article-image">
              <img src="../images/500-trees.png" alt="Tree planting program" class="article-img" />
            </div>
            <div class="article-content">
              <h3>500,000 Trees to Shade Parks and Playgrounds</h3>
              <p>Discover how urban greening initiatives are creating safer outdoor spaces for children.</p>
            </div>
          </a>

          <!-- Card 2 -->
          <a
            class="article-card link-card"
            href="https://www.parks.vic.gov.au/news/2023/07/19/02/37/winter-ideas-to-get-kids-outdoors?utm_source=chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open article: Winter Ideas to Get Kids Outdoors (opens in a new tab)"
          >
            <div class="article-image">
              <img src="../images/winter.png" alt="Kids playing in snow" class="article-img" />
            </div>
            <div class="article-content">
              <h3>Winter Ideas to Get Kids Outdoors</h3>
              <p>Fun and safe outdoor activities to keep your children active during colder months.</p>
            </div>
          </a>

          <!-- Card 3 -->
          <a
            class="article-card link-card"
            href="https://www.sydney.edu.au/news-opinion/news/2025/07/10/hot-weather-causes-children-to-sweat-at-the-same-rate-as-adults-study-shows.html?utm_source=chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open article: Hot Weather Safety for Children (opens in a new tab)"
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

    <!-- Seasonal Comfort Section -->
    <section class="seasonal-comfort">
      <div class="container">
        <h2 class="section-title">Seasonal Comfort Explore</h2>
        <div class="comfort-options">
          <div class="comfort-option summer">
            <h3>Summer Shade Mapping</h3>
            <p>Find the coolest routes and shaded areas</p>
          </div>
          <div class="comfort-option winter">
            <h3>Winter Sun Exposure</h3>
            <p>Discover sunny spots for winter warmth</p>
          </div>
          <div class="comfort-option playground">
            <h3>Best Playgrounds Explore</h3>
            <p>Discover season-friendly playgrounds - shade in summer, sun in winter</p>
          </div>
        </div>
        <router-link to="/seasonal-comfort" class="explore-button">
          Explore Seasonal Comfort
        </router-link>
      </div>
    </section>

    <!-- Why KidPath Section -->
    <section class="why-kidpath">
      <div class="container">
        <h2 class="section-title">Why KidPath? 🌱</h2>
        <p class="section-description">
          Our research-backed platform combines environmental data with family-friendly insights
          to create a more comfortable urban experience.
        </p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <img src="../images/4.png" alt="Weather icon" class="feature-img" />
            </div>
            <h3>Weather-Smart Routes</h3>
            <p>Find the most comfortable paths based on seasonal conditions</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <img src="../images/10.png" alt="Sustainability icon" class="feature-img" />
            </div>
            <h3>Urban Sustainability</h3>
            <p>Promoting green spaces and sustainable urban living</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <img src="../images/family.jpg" alt="Family icon" class="feature-img" />
            </div>
            <h3>Family-Focused</h3>
            <p>Designed with families and children's needs in mind</p>
          </div>
        </div>
      </div>
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
import { onMounted, computed } from 'vue'
import { useComfortData } from '@/composables/useComfortData'
import { format } from 'date-fns'

const {
  uvIndex,
  windSpeed,
  windLevel,
  uvTimestamp,
  windTimestamp,
  loading,
  error,
  init
} = useComfortData()

onMounted(() => init())

// UV risk level
const uvLevel = computed(() => {
  if (uvIndex.value === null) return 'Unknown'
  if (uvIndex.value >= 8) return 'Very High'
  if (uvIndex.value >= 6) return 'High'
  if (uvIndex.value >= 3) return 'Moderate'
  return 'Low'
})

const uvAdvice = computed(() => {
  if (uvIndex.value === null) return 'Loading UV data...'
  if (uvIndex.value >= 8) {
    return 'Seek full shade. SPF 50+, long sleeves, and hat essential.'
  } else if (uvIndex.value >= 6) {
    return 'Stay in shade during midday hours. Use SPF 30+ sunscreen.'
  } else if (uvIndex.value >= 3) {
    return 'Wear sunglasses and use sunscreen if staying outside.'
  } else {
    return 'Low risk. Minimal protection needed.'
  }
})

// as a function getter for color by wind level
const getWindTextColor = computed(() => (level) => {
  switch (level) {
    case 'Very Strong': return '#000080'
    case 'Strong': return '#0d47a1'
    case 'Moderate': return '#1976d2'
    case 'Low': return '#4fc3f7'
    default: return '#666'
  }
})

const windColor = computed(() => {
  switch (windLevel.value) {
    case 'Very Strong':
      return 'linear-gradient(90deg, rgba(0,0,255,1), rgba(138,43,226,1))'
    case 'Strong':
      return 'linear-gradient(90deg, #4fc3f7, rgba(0,0,255,1))'
    case 'Moderate':
      return 'linear-gradient(90deg, rgba(0,255,255,1), #4fc3f7)'
    case 'Low':
      return 'linear-gradient(90deg, rgba(173,216,230,1), rgba(100,149,237,1))'
    default:
      return 'linear-gradient(90deg, #ccc, #eee)'
  }
})

const formattedUvTime = computed(() => {
  return uvTimestamp.value ? format(new Date(uvTimestamp.value), 'yyyy-MM-dd HH:mm') : 'No time available'
})

const formattedWindTime = computed(() => {
  return windTimestamp.value ? format(new Date(windTimestamp.value), 'yyyy-MM-dd HH:mm') : 'No time available'
})
</script>

<style scoped>
.homepage {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8faf8 0%, #e8f5e8 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero Section */
.hero {
  position: relative;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 25px;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.hero-overlay {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  margin-top: 30px;
}

.hero-content {
  text-align: center;
  max-width: 1000px;
  padding: 0 20px;
}

.hero-title {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-line-1 {
  margin-top: 10px;
  font-size: 3rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 10px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  font-family: 'Segoe UI', 'Arial', sans-serif;
  letter-spacing: -0.5px;
}

.title-line-2 {
  font-size: 4.2rem;
  font-weight: 700;
  color: #8efaf7;
  line-height: 1.2;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  font-family: 'Segoe UI', 'Arial', sans-serif;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 1.3rem;
  color: #ffffff;
  margin-bottom: 15px;
  line-height: 1.7;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
  font-weight: 400;
  font-family: 'Segoe UI', 'Arial', sans-serif;
  letter-spacing: 0.2px;
}

.season-text {
  font-size: 2rem;
  color: #8efaf7;
  margin-bottom: 40px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
  font-family: 'Segoe UI', 'Arial', sans-serif;
  letter-spacing: 0.3px;
}

/* Feature Highlights */
.feature-highlights {
  display: flex;
  gap: 40px;
  justify-content: center;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-dot.blue {
  background: #4fc3f7;
}

.feature-dot.green {
  background: #66bb6a;
}

.feature-dot.yellow {
  background: #ffd54f;
}

.feature-item span {
  color: #ffffff;
  font-weight: 400;
  font-size: 0.95rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  letter-spacing: 0.5px;
}

/* Section Titles */
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2e7d32;
  text-align: center;
  margin-bottom: 50px;
}

/* Info Cards */
.info-cards {
  padding: 80px 0 70px 0; /* 修正 padding 语法 */
  background: white;
  position: relative;
  overflow: hidden;
}

/* background-dots decoration */
.info-cards::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 30px;
  width: 120px;
  height: 120px;
  background-image: url('../images/dot2.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.25;
  z-index: 1;
  filter: hue-rotate(200deg) saturate(1.5);
}

.info-cards::after {
  content: '';
  position: absolute;
  top: 150px;
  right: 50px;
  width: 140px;
  height: 140px;
  background-image: url('../images/dot3.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 1;
  filter: hue-rotate(280deg) saturate(1.8);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  font-size: 1.1rem;
  color: #87a615;
}

.error-state {
  color: #f490f2;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
}

.info-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  margin-top: 100px;
}

/* card decoration - dots */
.info-card::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 140px;
  height: 140px;
  background-image: url('../images/dot4.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.2;
  z-index: 1;
  filter: hue-rotate(320deg) saturate(1.6);
}

.info-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

/* card */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 15px;
  position: relative;
  z-index: 2;
}

.icon-container {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.icon-image {
  width: 80px;
  height: 80px;
}

.card-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
}

.card-title h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #6a0592;
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
}

.card-title p {
  font-size: 0.9rem;
  color: #9e62ac;
  margin: 0;
  font-weight: 400;
  font-family: 'Segoe UI', sans-serif;
}

.risk-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Segoe UI', sans-serif;
}

.risk-tag.very-high {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.risk-tag.high {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.risk-tag.moderate {
  background: rgba(255, 225, 0, 0.1);
  color: rgba(255, 225, 0);
  border: 1px solid rgba(255, 255, 0, 0.3);
}

.risk-tag.low {
  background: rgba(76, 175, 172, 0.1);
  color: rgba(76, 175, 172);
  border: 1px solid rgba(76, 175, 172, 0.3);
}

.risk-tag.very-strong {
  background: #4466ff1c;
  color: #4466ff;
  border: 1px solid #4466ff47;
}

.risk-tag.strong {
  background: #0d03911e;
  color: #0d0391;
  border: 1px solid #0d039168;
}

.card-main-data {
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}

.main-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 5px;
  justify-content: center;
}

.number {
  font-size: 3.5rem;
  font-weight: 800;
  color: #ff6b35;
  font-family: 'Segoe UI', sans-serif;
}

.scale {
  font-size: 1.5rem;
  color: #666;
  font-weight: 500;
  font-family: 'Segoe UI', sans-serif;
}

.number-wind {
  font-size: 3.5rem;
  font-weight: 800;
  font-family: 'Segoe UI', sans-serif;
}

.risk-bar-section {
  margin-bottom: 25px;
  position: relative;
  z-index: 2;
}

.risk-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
  font-family: 'Segoe UI', sans-serif;
}

.risk-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.risk-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.risk-percentage {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
  font-family: 'Segoe UI', sans-serif;
  text-align: right;
}

.advice-content p {
  font-family: "Sour Gummy", cursive;
  font-size: 1.2rem;
  color: #f4a3ee;
  line-height: 1.5;
  margin-bottom: 20px;
  font-weight: 200;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.update-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #888;
  font-family: 'Segoe UI', sans-serif;
}

.data-source {
  font-size: 0.85rem;
  color: #888;
  font-weight: 500;
  font-family: 'Segoe UI', sans-serif;
}

/* Decorative Image Section */
.decorative-image-section {
  padding: 40px 0;
  background: white;
  position: relative;
  overflow: hidden;
}

.decorative-image-section::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 10%;
  width: 120px;
  height: 120px;
  background-image: url('../images/dot7.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 1;
  filter: hue-rotate(60deg) saturate(1.5);
}

.decorative-image-section::after {
  content: '';
  position: absolute;
  bottom: -20px;
  right: 15%;
  width: 100px;
  height: 100px;
  background-image: url('../images/dot6.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.25;
  z-index: 1;
  filter: hue-rotate(150deg) saturate(1.6);
}

.image-container {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  position: relative;
  z-index: 2;
  padding-right: 40px;
  padding-bottom: 20px;
}

.decorative-img {
  max-width: 200px;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.08));
}

.decorative-img:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
}

/* Did You Know Section */
.did-you-know {
  display: flex;
  align-items: center;
  gap: 50px;
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s ease-out;
  transition: all 0.4s ease;
}

.did-you-know:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.did-you-know::before {
  content: '';
  position: absolute;
  bottom: -40px;
  left: -40px;
  width: 160px;
  height: 160px;
  background-image: url('../images/dot5.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.25;
  z-index: 1;
  filter: hue-rotate(40deg) saturate(1.7);
  animation: float 6s ease-in-out infinite;
}

.did-you-know::after {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  background-image: url('../images/dot6.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 1;
  filter: hue-rotate(180deg) saturate(1.9);
  animation: float 8s ease-in-out infinite reverse;
}

.percentage {
  font-size: 5rem;
  font-weight: 800;
  color: #ff8f00;
  font-family: 'Segoe UI', sans-serif;
  position: relative;
  z-index: 2;
  animation: countUp 2s ease-out 0.5s both;
  transform: scale(0);
}

.fact-box {
  display: flex;
  align-items: center;
  gap: 18px;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  padding: 25px;
  border-radius: 18px;
  border: 2px solid #ce93d8;
  position: relative;
  z-index: 2;
  animation: slideInRight 1s ease-out 0.8s both;
  transform: translateX(50px);
  opacity: 0;
}

.fact-icon {
  font-size: 2rem;
  animation: bounceIn 1.2s ease-out 1s both;
  transform: scale(0);
}

.fact-text {
  font-size: 1.05rem;
  color: #4a148c;
  line-height: 1.6;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 500;
  animation: fadeInUp 1s ease-out 1.2s both;
  transform: translateY(30px);
  opacity: 0;
}

/* animations */
@keyframes slideInUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes countUp {
  from { transform: scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(5deg); }
  to { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeInUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(2deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
}

/* Articles Section */
.articles {
  padding: 80px 0;
  background: white;
  position: relative;
  overflow: hidden;
}

.articles::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  width: 200px;
  height: 200px;
  background-image: url('../images/dot3.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.4;
  z-index: 2;
  filter: hue-rotate(200deg) saturate(1.8);
}

.articles::after {
  content: '';
  position: absolute;
  top: 120px;
  right: 80px;
  width: 120px;
  height: 120px;
  background-image: url('../images/dot4.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.35;
  z-index: 1;
  filter: hue-rotate(320deg) saturate(1.6);
}

.articles .container::before {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 200px;
  width: 100px;
  height: 100px;
  background-image: url('../images/dot6.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.4;
  z-index: 1;
  filter: hue-rotate(40deg) saturate(1.9);
}

.articles .container::after {
  content: '';
  position: absolute;
  top: 200px;
  right: 150px;
  width: 130px;
  height: 130px;
  background-image: url('../images/dot6.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 1;
  filter: hue-rotate(180deg) saturate(1.7);
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  position: relative;
  z-index: 2;
}

.article-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.article-image { height: 200px; overflow: hidden; }
.article-img { width: 100%; height: 100%; object-fit: cover; }
.article-card:nth-child(1) .article-img { object-position: center 30%; }
.article-card:nth-child(2) .article-img { object-position: center 3%; }
.article-card:nth-child(3) .article-img { object-position: center 22%; }

.article-content { padding: 25px; }
.article-content h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 15px;
}
.article-content p { color: #666; line-height: 1.6; }

/* Seasonal Comfort Section */
.seasonal-comfort {
  padding: 80px 0;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
}

.comfort-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.comfort-option {
  background: white;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.comfort-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.comfort-option h3 { font-size: 1.4rem; font-weight: 600; margin-bottom: 15px; }
.comfort-option p { color: #666; line-height: 1.5; }

.summer h3 { color: #ff6f00; }
.winter h3 { color: #5e35b1; }
.playground h3 { color: #f57c00; }

.explore-button {
  background: linear-gradient(135deg, #5e35b1, #7b1fa2);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: block;
  margin: 0 auto;
  text-decoration: none;
  text-align: center;
}

.explore-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(94, 53, 177, 0.3);
}

/* Why KidPath Section */
.why-kidpath {
  padding: 80px 0;
  background: linear-gradient(135deg, #edf6ed, #c8e6c9);
}

.section-description {
  font-size: 1.2rem;
  color: #2e7d32;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 50px;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-card {
  background: white;
  padding: 40px 30px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.feature-icon { margin-bottom: 15px; display: flex; justify-content: center; align-items: center; }
.feature-img { width: 70px; height: 70px; object-fit: cover; border-radius: 12px; transition: all 0.3s ease; }
.feature-card:hover .feature-img { transform: scale(1.1); }
.feature-card h3 { font-size: 1.4rem; font-weight: 600; color: #2e7d32; margin-bottom: 15px; }
.feature-card p { color: #787e7d; line-height: 1.6; }

/* Footer */
.footer { background: #2e7d32; color: white; text-align: center; padding: 30px 0; }
.footer p { margin: 0; font-size: 1rem; }

/* Responsive Design */
@media (max-width: 768px) {
  .hero { min-height: 500px; }
  .title-line-1 { font-size: 2.5rem; }
  .title-line-2 { font-size: 3rem; }
  .feature-highlights { flex-direction: column; gap: 20px; }
  .card-grid { grid-template-columns: 1fr; }
  .info-card { padding: 25px; flex-direction: column; text-align: center; }
  .did-you-know { flex-direction: column; text-align: center; }
  .comfort-options { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr; }
}
</style>
