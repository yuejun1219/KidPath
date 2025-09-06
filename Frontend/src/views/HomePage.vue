<template>
  <div class="homepage">
    <!-- Retro Game Background -->
    <div class="retro-bg">
      <div class="pixel-grid"></div>
      <div class="scan-lines"></div>
    </div>

    <!-- Main Game Screen -->
    <div class="game-screen">
      <!-- Header -->
      <div class="game-header">
        <div class="pixel-border">
          <h1 class="game-title">
            <span class="pixel-text">KID</span>
            <span class="pixel-accent">PATH</span>
          </h1>
          <div class="subtitle">FAMILY ADVENTURE SYSTEM</div>
        </div>
      </div>

      <!-- Game Stats -->
      <div class="game-stats" v-if="!loading && !error">
        <div class="stat-card uv-card">
          <div class="stat-icon">☀️</div>
          <div class="stat-info">
            <div class="stat-label">UV INDEX</div>
            <div class="stat-value">{{ uvIndex !== null ? uvIndex : '--' }}</div>
            <div class="stat-level" :class="uvLevel.toLowerCase().replace(' ', '-')">{{ uvLevel }}</div>
          </div>
        </div>

        <div class="stat-card wind-card">
          <div class="stat-icon">💨</div>
          <div class="stat-info">
            <div class="stat-label">WIND SPEED</div>
            <div class="stat-value">{{ windSpeed !== null ? windSpeed.toFixed(1) : '--' }}</div>
            <div class="stat-level" :class="windLevel.toLowerCase().replace(' ', '-')">{{ windLevel }}</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-screen" v-if="loading">
        <div class="pixel-loader">
          <div class="loader-text">LOADING WEATHER DATA...</div>
          <div class="loader-bar">
            <div class="loader-fill"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-screen" v-if="error">
        <div class="error-text">ERROR: {{ error }}</div>
        <button class="retry-btn" @click="init">RETRY</button>
      </div>

      <!-- Game Menu -->
      <div class="game-menu">
        <router-link to="/comfort-insights" class="menu-item">
          <div class="menu-icon">📊</div>
          <div class="menu-text">INSIGHTS</div>
        </router-link>
        
        <router-link to="/seasonal-comfort" class="menu-item">
          <div class="menu-icon">🌍</div>
          <div class="menu-text">SEASONS</div>
        </router-link>
        
        <div class="menu-item" @click="scrollToAdvice">
          <div class="menu-icon">💡</div>
          <div class="menu-text">ADVICE</div>
        </div>
      </div>

      <!-- Quick Advice -->
      <div class="quick-advice" v-if="!loading && !error">
        <div class="advice-box">
          <div class="advice-icon">💡</div>
          <div class="advice-text">{{ uvAdvice }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
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

onMounted(() => {
  init()
})

const scrollToAdvice = () => {
  const adviceElement = document.querySelector('.quick-advice')
  if (adviceElement) {
    adviceElement.scrollIntoView({ behavior: 'smooth' })
  }
}

// UV risk level
const uvLevel = computed(() => {
  if (uvIndex.value === null) return 'Unknown'
  if (uvIndex.value >= 8) return 'Very High'
  if (uvIndex.value >= 6) return 'High'
  if (uvIndex.value >= 3) return 'Moderate'
  return 'Low'
})

const uvAdvice = computed(() => {
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
/* Import retro pixel font */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.homepage {
  min-height: 100vh;
  background: #000000;
  color: #00ff41;
  font-family: 'Press Start 2P', monospace;
  overflow-x: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Retro Game Background */
.retro-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: #000000;
}

.pixel-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: grid-move 20s linear infinite;
}

@keyframes grid-move {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, 20px); }
}

.scan-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    transparent 50%,
    rgba(0, 255, 65, 0.03) 50%
  );
  background-size: 100% 4px;
  animation: scan 0.1s linear infinite;
}

@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* Main Game Screen */
.game-screen {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 30px;
  min-height: calc(100vh - 40px);
}

/* Game Header */
.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.pixel-border {
  border: 3px solid #00ff41;
  padding: 20px;
  background: rgba(0, 255, 65, 0.05);
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 65, 0.2),
    0 0 20px rgba(0, 255, 65, 0.3);
  position: relative;
}

.pixel-border::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #00ff41, #ff6b35, #00ff41);
  z-index: -1;
  animation: border-glow 2s ease-in-out infinite;
}

@keyframes border-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.game-title {
  font-size: clamp(2rem, 6vw, 3rem);
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pixel-text {
  color: #00ff41;
  text-shadow: 2px 2px 0px #008f11;
  animation: text-flicker 3s ease-in-out infinite;
}

.pixel-accent {
  color: #ff6b35;
  text-shadow: 2px 2px 0px #cc4a1a;
  animation: text-flicker 3s ease-in-out infinite 1.5s;
}

@keyframes text-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.subtitle {
  font-size: 12px;
  color: #ffffff;
  margin-top: 10px;
  letter-spacing: 2px;
  text-shadow: 1px 1px 0px #333;
}

/* Game Stats */
.game-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border: 2px solid #00ff41;
  background: rgba(0, 255, 65, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  transform: translateY(-2px);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.2), transparent);
  transition: left 0.5s ease;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-icon {
  font-size: 2rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 10px;
  color: #ffffff;
  margin-bottom: 5px;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 24px;
  color: #00ff41;
  text-shadow: 2px 2px 0px #008f11;
  margin-bottom: 5px;
}

.stat-level {
  font-size: 8px;
  padding: 2px 8px;
  border: 1px solid;
  display: inline-block;
}

.stat-level.very-high {
  color: #ff6b6b;
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.stat-level.high {
  color: #ffb74d;
  border-color: #ffb74d;
  background: rgba(255, 183, 77, 0.1);
}

.stat-level.moderate {
  color: #fff176;
  border-color: #fff176;
  background: rgba(255, 241, 118, 0.1);
}

.stat-level.low {
  color: #81c784;
  border-color: #81c784;
  background: rgba(129, 199, 132, 0.1);
}

.stat-level.very-strong {
  color: #64b5f6;
  border-color: #64b5f6;
  background: rgba(100, 181, 246, 0.1);
}

.stat-level.strong {
  color: #7986cb;
  border-color: #7986cb;
  background: rgba(121, 134, 203, 0.1);
}

/* Loading Screen */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.pixel-loader {
  text-align: center;
}

.loader-text {
  font-size: 12px;
  color: #00ff41;
  margin-bottom: 20px;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.loader-bar {
  width: 200px;
  height: 4px;
  border: 2px solid #00ff41;
  background: #000000;
  position: relative;
  overflow: hidden;
}

.loader-fill {
  height: 100%;
  background: #00ff41;
  animation: loading 2s ease-in-out infinite;
}

@keyframes loading {
  0% { width: 0%; }
  50% { width: 100%; }
  100% { width: 0%; }
}

/* Error Screen */
.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.error-text {
  font-size: 12px;
  color: #ff6b6b;
  margin-bottom: 20px;
}

.retry-btn {
  background: transparent;
  border: 2px solid #ff6b6b;
  color: #ff6b6b;
  padding: 10px 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #ff6b6b;
  color: #000000;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

/* Game Menu */
.game-menu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.menu-item {
  border: 2px solid #00ff41;
  background: rgba(0, 255, 65, 0.05);
  padding: 20px;
  text-align: center;
  text-decoration: none;
  color: #ffffff;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.menu-item:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  transform: translateY(-2px);
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.2), transparent);
  transition: left 0.5s ease;
}

.menu-item:hover::before {
  left: 100%;
}

.menu-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.menu-text {
  font-size: 10px;
  color: #00ff41;
  letter-spacing: 1px;
}

/* Quick Advice */
.quick-advice {
  margin-top: 20px;
}

.advice-box {
  border: 2px solid #ff6b35;
  background: rgba(255, 107, 53, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  overflow: hidden;
}

.advice-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.2), transparent);
  transition: left 0.5s ease;
}

.advice-box:hover::before {
  left: 100%;
}

.advice-icon {
  font-size: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

.advice-text {
  font-size: 10px;
  color: #ffffff;
  line-height: 1.4;
  flex: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .game-screen {
    padding: 15px;
    gap: 20px;
  }
  
  .game-title {
    font-size: clamp(1.5rem, 8vw, 2.5rem);
    flex-direction: column;
    gap: 5px;
  }
  
  .pixel-text,
  .pixel-accent {
    font-size: clamp(1.2rem, 6vw, 2rem);
  }
  
  .subtitle {
    font-size: 10px;
  }
  
  .game-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .game-menu {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .menu-item {
    padding: 15px;
  }
  
  .advice-box {
    padding: 15px;
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .advice-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .game-screen {
    padding: 10px;
    gap: 15px;
  }
  
  .pixel-border {
    padding: 15px;
  }
  
  .stat-card {
    padding: 12px;
    flex-direction: column;
    text-align: center;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .menu-item {
    padding: 12px;
  }
  
  .advice-box {
    padding: 12px;
  }
}





</style>
