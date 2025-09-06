<template>
  <div class="homepage">
    <!-- Retro Game Background -->
    <div class="retro-bg">
      <div class="pixel-grid"></div>
      <div class="floating-particles">
        <div class="particle" v-for="n in 20" :key="n" :style="getParticleStyle(n)"></div>
      </div>
      <div class="scan-lines"></div>
    </div>


    <!-- Main Content -->
    <main class="main-content">
      <!-- Left Section - Content -->
      <div class="left-section">
        <div class="content-block">
          <h1 class="main-title">KEEPING KIDS SAFE</h1>
          <p class="main-description" ref="typewriterText">
            {{ displayedText }}
            <span class="cursor" v-if="isTyping">|</span>
          </p>
        </div>

        <!-- Weather Stats -->
        <div class="weather-stats" v-if="!loading && !error">
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
      </div>

      <!-- Right Section - Comprehensive Game -->
      <div class="right-section">
        <div class="game-container">
          <div class="game-header">
            <h2 class="game-title">WEATHER DEFENDER</h2>
            <div class="game-stats">
              <div class="game-stat">
                <span class="stat-label">SCORE</span>
                <span class="stat-value">{{ gameScore }}</span>
              </div>
              <div class="game-stat">
                <span class="stat-label">LIVES</span>
                <span class="stat-value">{{ lives }}</span>
              </div>
              <div class="game-stat">
                <span class="stat-label">LEVEL</span>
                <span class="stat-value">{{ currentLevel }}</span>
              </div>
            </div>
          </div>
          
          <div class="game-area" @click="handleGameClick" ref="gameBoard">
            <!-- Player Ship -->
            <div class="player-ship" :style="{ left: playerPosition + 'px' }">
              <div class="ship-body">🚀</div>
            </div>
            
            <!-- Enemies -->
            <div 
              v-for="(enemy, index) in enemies" 
              :key="enemy.id"
              class="enemy"
              :style="{ 
                left: enemy.x + 'px', 
                top: enemy.y + 'px',
                '--enemy-type': enemy.type
              }"
            >
              <div class="enemy-sprite">{{ getEnemyIcon(enemy.type) }}</div>
            </div>
            
            <!-- Projectiles -->
            <div 
              v-for="(projectile, index) in projectiles" 
              :key="projectile.id"
              class="projectile"
              :style="{ 
                left: projectile.x + 'px', 
                top: projectile.y + 'px'
              }"
            >
              <div class="projectile-sprite">💥</div>
            </div>
            
            <!-- Power-ups -->
            <div 
              v-for="(powerup, index) in powerups" 
              :key="powerup.id"
              class="powerup"
              :style="{ 
                left: powerup.x + 'px', 
                top: powerup.y + 'px'
              }"
            >
              <div class="powerup-sprite">{{ getPowerupIcon(powerup.type) }}</div>
            </div>
            
            <!-- Explosions -->
            <div class="explosion" v-for="explosion in explosions" :key="explosion.id" 
                 :style="{ left: explosion.x + 'px', top: explosion.y + 'px' }">
              {{ explosion.symbol }}
            </div>
          </div>
          
          <div class="game-controls">
            <div class="control-buttons">
              <button class="control-btn" @click="moveLeft">←</button>
              <button class="control-btn action" @click="shoot">FIRE</button>
              <button class="control-btn" @click="moveRight">→</button>
            </div>
            <div class="game-actions">
              <button class="control-btn reset-btn" @click="resetGame" v-if="gameOver || lives <= 0">RESET</button>
              <button class="control-btn start-btn" @click="initializeGame" v-if="!gameStarted && !gameOver">START</button>
            </div>
            <p class="game-instructions">Defend against weather hazards! Use arrow keys or buttons to move and shoot.</p>
            <div class="game-status" v-if="gameOver">
              <p class="game-over-text">GAME OVER!</p>
              <p class="final-score">Final Score: {{ gameScore }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Loading State -->
    <div class="loading-screen" v-if="loading">
      <div class="loader">
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
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

// UI state
const isScrolled = ref(false)

// Typewriter animation
const fullText = "Every parent faces the same dilemma: How do we let our children play freely while keeping them safe from unpredictable weather? KidPath provides real-time weather intelligence and smart recommendations, so you can make confident decisions about outdoor activities for your family."
const displayedText = ref('')
const isTyping = ref(true)
const typewriterSpeed = 50

// Game state
const gameScore = ref(0)
const lives = ref(3)
const currentLevel = ref(1)
const gameStarted = ref(false)
const gameOver = ref(false)
const playerPosition = ref(150)
const enemies = ref([])
const projectiles = ref([])
const powerups = ref([])
const explosions = ref([])
const gameBoard = ref(null)
const gameLoop = ref(null)
const lastEnemyTime = ref(0)
const lastPowerupTime = ref(0)
const lastShotTime = ref(0)
const enemyId = ref(0)
const projectileId = ref(0)
const powerupId = ref(0)
const explosionId = ref(0)


// Scroll detection
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

// Typewriter animation
const startTypewriter = () => {
  let index = 0
  const typeInterval = setInterval(() => {
    if (index < fullText.length) {
      displayedText.value += fullText[index]
      index++
    } else {
      isTyping.value = false
      clearInterval(typeInterval)
    }
  }, typewriterSpeed)
}

// Particle animation
const getParticleStyle = (index) => {
  const delay = Math.random() * 5
  const duration = 3 + Math.random() * 4
  const size = 2 + Math.random() * 4
  const left = Math.random() * 100
  return {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`
  }
}

// Initialize game
const initializeGame = () => {
  gameStarted.value = true
  gameOver.value = false
  enemies.value = []
  projectiles.value = []
  powerups.value = []
  explosions.value = []
  playerPosition.value = 150
  lastEnemyTime.value = 0
  lastPowerupTime.value = 0
  lastShotTime.value = 0
  
  // Start game loop
  startGameLoop()
}

// Start game loop
const startGameLoop = () => {
  if (gameLoop.value) clearInterval(gameLoop.value)
  
  gameLoop.value = setInterval(() => {
    if (!gameStarted.value || gameOver.value) return
    
    updateEnemies()
    updateProjectiles()
    updatePowerups()
    updateExplosions()
    spawnEnemies()
    spawnPowerups()
    checkCollisions()
  }, 50) // 20 FPS
}

// Spawn enemies
const spawnEnemies = () => {
  const now = Date.now()
  const spawnRate = Math.max(2000 - (currentLevel.value * 200), 800)
  
  if (now - lastEnemyTime.value > spawnRate) {
    const types = ['storm', 'heat', 'wind', 'rain']
    const type = types[Math.floor(Math.random() * types.length)]
    
    enemies.value.push({
      id: enemyId.value++,
      x: Math.random() * 250 + 25,
      y: 0,
      type: type,
      speed: 1 + Math.random() * 0.5 + (currentLevel.value * 0.1)
    })
    
    lastEnemyTime.value = now
  }
}

// Spawn power-ups
const spawnPowerups = () => {
  const now = Date.now()
  const spawnRate = 10000 + Math.random() * 5000
  
  if (now - lastPowerupTime.value > spawnRate) {
    const types = ['shield', 'rapid-fire', 'multi-shot', 'extra-life']
    const type = types[Math.floor(Math.random() * types.length)]
    
    powerups.value.push({
      id: powerupId.value++,
      x: Math.random() * 250 + 25,
      y: 0,
      type: type,
      speed: 1
    })
    
    lastPowerupTime.value = now
  }
}

// Update enemies
const updateEnemies = () => {
  enemies.value = enemies.value.filter(enemy => {
    enemy.y += enemy.speed
    return enemy.y < 200 // Remove when off screen
  })
}

// Update projectiles
const updateProjectiles = () => {
  projectiles.value = projectiles.value.filter(projectile => {
    projectile.y -= projectile.speed
    return projectile.y > 0 // Remove when off screen
  })
}

// Update power-ups
const updatePowerups = () => {
  powerups.value = powerups.value.filter(powerup => {
    powerup.y += powerup.speed
    return powerup.y < 200 // Remove when off screen
  })
}

// Update explosions
const updateExplosions = () => {
  explosions.value = explosions.value.filter(explosion => {
    explosion.life--
    return explosion.life > 0
  })
}

// Check collisions
const checkCollisions = () => {
  // Check projectile-enemy collisions
  projectiles.value.forEach((projectile, pIndex) => {
    enemies.value.forEach((enemy, eIndex) => {
      if (Math.abs(projectile.x - enemy.x) < 20 && Math.abs(projectile.y - enemy.y) < 20) {
        // Hit!
        gameScore.value += 10
        createExplosion(enemy.x, enemy.y)
        projectiles.value.splice(pIndex, 1)
        enemies.value.splice(eIndex, 1)
      }
    })
  })
  
  // Check enemy-player collisions
  enemies.value.forEach((enemy, index) => {
    if (Math.abs(enemy.x - playerPosition.value) < 30 && Math.abs(enemy.y - 150) < 30) {
      // Player hit!
      lives.value--
      createExplosion(enemy.x, enemy.y)
      enemies.value.splice(index, 1)
      
      // Add screen shake effect
      document.querySelector('.game-area')?.classList.add('screen-shake')
      setTimeout(() => {
        document.querySelector('.game-area')?.classList.remove('screen-shake')
      }, 200)
      
      if (lives.value <= 0) {
        endGame()
      }
    }
  })
  
  // Check powerup-player collisions
  powerups.value.forEach((powerup, index) => {
    if (Math.abs(powerup.x - playerPosition.value) < 30 && Math.abs(powerup.y - 150) < 30) {
      // Collect powerup
      collectPowerup(powerup.type)
      createExplosion(powerup.x, powerup.y)
      powerups.value.splice(index, 1)
    }
  })
}

// Create explosion
const createExplosion = (x, y) => {
  explosions.value.push({
    id: explosionId.value++,
    x: x,
    y: y,
    symbol: '💥',
    life: 20
  })
}

// Collect powerup
const collectPowerup = (type) => {
  gameScore.value += 25
  
  switch (type) {
    case 'shield':
      // Temporary invincibility
      lives.value = Math.min(lives.value + 1, 5)
      break
    case 'rapid-fire':
      // Faster shooting for 5 seconds
      break
    case 'multi-shot':
      // Triple shot
      break
    case 'extra-life':
      lives.value = Math.min(lives.value + 1, 5)
      break
  }
}

// Move player left
const moveLeft = () => {
  if (playerPosition.value > 20) {
    playerPosition.value -= 30
  }
}

// Move player right
const moveRight = () => {
  if (playerPosition.value < 250) {
    playerPosition.value += 30
  }
}

// Shoot projectile
const shoot = () => {
  const now = Date.now()
  if (now - lastShotTime.value > 200) { // Rate limit shooting
    projectiles.value.push({
      id: projectileId.value++,
      x: playerPosition.value + 15,
      y: 140,
      speed: 3
    })
    lastShotTime.value = now
  }
}

// Get enemy icon
const getEnemyIcon = (type) => {
  const icons = {
    storm: '⛈️',
    heat: '☀️',
    wind: '💨',
    rain: '🌧️'
  }
  return icons[type] || '⚠️'
}

// Get powerup icon
const getPowerupIcon = (type) => {
  const icons = {
    shield: '🛡️',
    'rapid-fire': '⚡',
    'multi-shot': '🔫',
    'extra-life': '❤️'
  }
  return icons[type] || '⭐'
}

// End game
const endGame = () => {
  gameOver.value = true
  gameStarted.value = false
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
    gameLoop.value = null
  }
}

// Reset game
const resetGame = () => {
  gameScore.value = 0
  lives.value = 3
  currentLevel.value = 1
  gameOver.value = false
  gameStarted.value = false
  enemies.value = []
  projectiles.value = []
  powerups.value = []
  explosions.value = []
  playerPosition.value = 150
  lastEnemyTime.value = 0
  lastPowerupTime.value = 0
  lastShotTime.value = 0
}

// Handle game click
const handleGameClick = (event) => {
  if (!gameStarted.value || gameOver.value) return
  // Could add touch controls here
}

// Keyboard controls
const handleKeyPress = (event) => {
  if (!gameStarted.value || gameOver.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      moveLeft()
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      moveRight()
      break
    case ' ':
    case 'Enter':
      event.preventDefault()
      shoot()
      break
    default:
      return
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

// UV advice
const uvAdvice = computed(() => {
  if (uvIndex.value === null) return 'Loading weather data...'
  if (uvIndex.value >= 8) return 'Extreme UV! Keep children indoors or use maximum protection.'
  if (uvIndex.value >= 6) return 'High UV risk. Apply sunscreen and limit sun exposure.'
  if (uvIndex.value >= 3) return 'Moderate UV. Some protection recommended for children.'
  return 'Low UV risk. Safe for outdoor play with minimal protection.'
})

onMounted(() => {
  init()
  
  // Start typewriter animation
  setTimeout(() => {
    startTypewriter()
  }, 1000)
  
  // Initialize game after weather data is loaded
  setTimeout(() => {
    initializeGame()
  }, 2000)
  
  // Add keyboard controls
  document.addEventListener('keydown', handleKeyPress)
  
  // Add scroll listener
  window.addEventListener('scroll', handleScroll)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('keydown', handleKeyPress)
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
  }
})

const scrollToAdvice = () => {
  const adviceElement = document.querySelector('.advice-section')
  if (adviceElement) {
    adviceElement.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

.homepage {
  min-height: 100vh;
  background: #000000;
  color: #00ff41;
  font-family: 'Press Start 2P', monospace;
  position: relative;
  overflow: hidden;
}

/* Retro Game Background */
.retro-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #001122 0%, #000000 50%, #001122 100%);
  z-index: -1;
}

.pixel-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.floating-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.particle {
  position: absolute;
  background: #00ff41;
  border-radius: 50%;
  animation: float-particles 6s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes float-particles {
  0%, 100% { 
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { 
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

.scan-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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


/* Main Content */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: calc(100vh - 90px);
  margin-top: 90px;
  background: transparent;
  overflow: hidden;
}

/* Left Section */
.left-section {
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: transparent;
  position: relative;
}

.content-block {
  max-width: 600px;
  z-index: 2;
}

.main-title {
  font-size: 36px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0 0 30px 0;
  background: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  animation: title-glow 2s ease-in-out infinite alternate;
}

@keyframes title-glow {
  0% { text-shadow: 0 0 20px rgba(0, 255, 65, 0.5); }
  100% { text-shadow: 0 0 30px rgba(0, 255, 65, 0.8); }
}

.main-description {
  font-size: 12px;
  line-height: 1.8;
  color: #ffffff;
  margin: 0;
  max-width: 500px;
  font-family: 'Orbitron', monospace;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Weather Stats */
.weather-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
  z-index: 2;
}

.stat-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%);
  border: 2px solid transparent;
  border-image: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1) 1;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: stat-pulse 3s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(0, 255, 65, 0.2);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.1), transparent);
  animation: card-shimmer 3s ease-in-out infinite;
}

@keyframes card-shimmer {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

@keyframes stat-pulse {
  0%, 100% { border-color: #00ff41; box-shadow: 0 0 10px rgba(0, 255, 65, 0.3); }
  50% { border-color: #00cc33; box-shadow: 0 0 20px rgba(0, 255, 65, 0.6); }
}

.stat-icon {
  font-size: 24px;
  animation: icon-bounce 2s ease-in-out infinite;
}

@keyframes icon-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 8px;
  background: linear-gradient(45deg, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 16px;
  background: linear-gradient(45deg, #ffffff, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  animation: value-glow 2s ease-in-out infinite;
}

@keyframes value-glow {
  0%, 100% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
  50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.8); }
}

.stat-level {
  font-size: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-level.very-high {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid #ff6b6b;
}

.stat-level.high {
  color: #ffa726;
  background: rgba(255, 167, 38, 0.2);
  border: 1px solid #ffa726;
}

.stat-level.moderate {
  color: #ffeb3b;
  background: rgba(255, 235, 59, 0.2);
  border: 1px solid #ffeb3b;
}

.stat-level.low {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid #4caf50;
}

/* Right Section - Game */
.right-section {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  position: relative;
}

.game-container {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%);
  border: 3px solid transparent;
  border-image: linear-gradient(45deg, #00ff41, #ff6b6b, #4ecdc4, #45b7d1) 1;
  border-radius: 12px;
  padding: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
  animation: game-glow 3s ease-in-out infinite;
}

@keyframes game-glow {
  0%, 100% { box-shadow: 0 0 30px rgba(0, 255, 65, 0.3); }
  50% { box-shadow: 0 0 50px rgba(0, 255, 65, 0.6); }
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(0, 255, 65, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 65, 0.3);
}

.game-title {
  font-size: 12px;
  background: linear-gradient(45deg, #00ff41, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
}

.game-stats {
  display: flex;
  gap: 15px;
}

.game-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.game-stat .stat-label {
  font-size: 6px;
  color: #ffffff;
  letter-spacing: 1px;
}

.game-stat .stat-value {
  font-size: 10px;
  background: linear-gradient(45deg, #ffff00, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
}

.game-area {
  width: 100%;
  height: 250px;
  background: linear-gradient(180deg, #001122 0%, #000000 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  margin-bottom: 15px;
  transition: transform 0.1s ease;
}

.screen-shake {
  animation: shake 0.2s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.player-ship {
  position: absolute;
  bottom: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.1s ease;
}

.ship-body {
  font-size: 24px;
  animation: ship-pulse 1s ease-in-out infinite;
}

@keyframes ship-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.enemy {
  position: absolute;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enemy-sprite {
  font-size: 20px;
  animation: enemy-float 2s ease-in-out infinite;
}

@keyframes enemy-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(5deg); }
}

.projectile {
  position: absolute;
  width: 8px;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.projectile-sprite {
  font-size: 12px;
  animation: projectile-spin 0.5s linear infinite;
}

@keyframes projectile-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.powerup {
  position: absolute;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: powerup-float 2s ease-in-out infinite;
}

@keyframes powerup-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.powerup-sprite {
  font-size: 18px;
  animation: powerup-glow 1s ease-in-out infinite;
}

@keyframes powerup-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
}

.explosion {
  position: absolute;
  font-size: 20px;
  animation: explosion-burst 0.5s ease-out;
  pointer-events: none;
}

@keyframes explosion-burst {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

.game-controls {
  text-align: center;
}

.control-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
}

.control-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(26, 26, 46, 0.8) 100%);
  border: 2px solid transparent;
  border-image: linear-gradient(45deg, #4ecdc4, #45b7d1) 1;
  border-radius: 6px;
  color: #4ecdc4;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.2) 0%, rgba(69, 183, 209, 0.2) 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 205, 196, 0.3);
}

.control-btn.action {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: #ffffff;
  border-image: linear-gradient(45deg, #ff6b6b, #ee5a24) 1;
}

.control-btn.action:hover {
  background: linear-gradient(135deg, #ee5a24, #ff6b6b);
}

.game-instructions {
  font-size: 8px;
  color: #cccccc;
  margin: 0;
  line-height: 1.4;
  font-family: 'Orbitron', monospace;
}

.game-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 10px 0;
}

.reset-btn {
  background: #ff6b6b !important;
  border-color: #ff6b6b !important;
  color: #ffffff !important;
  animation: reset-pulse 2s ease-in-out infinite;
}

@keyframes reset-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.start-btn {
  background: #4caf50 !important;
  border-color: #4caf50 !important;
  color: #ffffff !important;
  animation: start-glow 2s ease-in-out infinite;
}

@keyframes start-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.6); }
}

.game-status {
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 8px;
}

.game-over-text {
  font-size: 10px;
  color: #ff6b6b;
  margin: 0 0 5px 0;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
  animation: game-over-flash 1s ease-in-out infinite;
}

@keyframes game-over-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.final-score {
  font-size: 8px;
  color: #ffffff;
  margin: 0;
  font-family: 'Orbitron', monospace;
}

/* Weather Card */
.weather-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.card-title {
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.card-number {
  font-size: 18px;
  font-weight: 600;
  color: #666666;
  background: #f5f5f5;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.card-description {
  font-size: 16px;
  line-height: 1.6;
  color: #333333;
  margin: 0 0 30px 0;
}

.weather-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #000000;
}

.stat-level {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-level.very-high {
  color: #dc2626;
  background: #fef2f2;
}

.stat-level.high {
  color: #ea580c;
  background: #fff7ed;
}

.stat-level.moderate {
  color: #d97706;
  background: #fffbeb;
}

.stat-level.low {
  color: #16a34a;
  background: #f0fdf4;
}

.card-services {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  letter-spacing: 1px;
  text-align: right;
}

/* Game Card */
.game-card {
  background: #2a2a2a;
  border-radius: 16px;
  padding: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 255, 65, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 65, 0.3);
}

.game-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #00ff41;
  margin: 0;
  letter-spacing: 1px;
}

.game-stats {
  display: flex;
  gap: 20px;
}

.game-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.game-stat .stat-label {
  font-size: 8px;
  color: #ffffff;
  letter-spacing: 1px;
}

.game-stat .stat-value {
  font-size: 12px;
  color: #ffff00;
  font-weight: bold;
}

.game-area {
  width: 100%;
  height: 200px;
  background: linear-gradient(180deg, #001122 0%, #000000 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
}

.player {
  position: absolute;
  bottom: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.1s ease;
}

.player-sprite {
  font-size: 24px;
  animation: player-pulse 1s ease-in-out infinite;
}

@keyframes player-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.child {
  position: absolute;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: child-float 2s ease-in-out infinite;
}

.child-sprite {
  font-size: 16px;
  animation: child-bounce 1s ease-in-out infinite;
}

@keyframes child-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes child-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.hazard {
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hazard-sprite {
  font-size: 16px;
  animation: hazard-spin 0.5s linear infinite;
}

@keyframes hazard-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.powerup {
  position: absolute;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: powerup-float 2s ease-in-out infinite;
}

.powerup-sprite {
  font-size: 18px;
  animation: powerup-glow 1s ease-in-out infinite;
}

@keyframes powerup-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
}

.effect {
  position: absolute;
  font-size: 20px;
  animation: effect-burst 0.5s ease-out;
  pointer-events: none;
}

@keyframes effect-burst {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

.game-controls {
  text-align: center;
}

.control-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 15px;
}

.control-btn {
  padding: 10px 20px;
  background: #333333;
  border: 2px solid #555555;
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #444444;
  transform: translateY(-2px);
}

.control-btn.action {
  background: #00ff41;
  border-color: #00ff41;
  color: #000000;
}

.control-btn.action:hover {
  background: #00cc33;
  border-color: #00cc33;
}

.game-instructions {
  font-size: 12px;
  color: #cccccc;
  margin: 0;
  line-height: 1.4;
}

/* Loading and Error States */
.loading-screen,
.error-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.loader {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  background: rgba(0, 255, 65, 0.1);
  border: 2px solid #00ff41;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
}

.loader-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #00ff41;
  letter-spacing: 2px;
}

.loader-bar {
  width: 200px;
  height: 4px;
  background: rgba(0, 255, 65, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.loader-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff41, #00d4ff);
  border-radius: 2px;
  animation: progress-loading 2s ease-in-out infinite;
}

@keyframes progress-loading {
  0% { width: 0%; }
  50% { width: 100%; }
  100% { width: 0%; }
}

.error-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ff6b6b;
  letter-spacing: 2px;
}

.retry-btn {
  padding: 12px 24px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
}

.retry-btn:hover {
  background: #ff5252;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .left-section {
    padding: 60px 40px;
  }
  
  .right-section {
    padding: 40px;
  }
  
  .main-title {
    font-size: 48px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 15px 20px;
  }
  
  .main-content {
    grid-template-columns: 1fr;
    height: auto;
    min-height: calc(100vh - 90px);
    overflow-y: auto;
  }
  
  .left-section {
    padding: 30px 20px;
    min-height: 50vh;
  }
  
  .right-section {
    padding: 20px;
    min-height: 50vh;
  }
  
  .main-title {
    font-size: 28px;
  }
  
  .main-description {
    font-size: 14px;
  }
  
  .weather-stats {
    margin-top: 20px;
    gap: 15px;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .game-container {
    padding: 15px;
  }
  
  .game-area {
    height: 200px;
  }
  
  .control-btn {
    padding: 6px 10px;
    font-size: 7px;
  }
  
  .nav-menu {
    width: 100%;
    max-width: 350px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 24px;
  }
  
  .main-description {
    font-size: 12px;
  }
  
  .left-section {
    padding: 20px 15px;
  }
  
  .right-section {
    padding: 15px;
  }
  
  .stat-card {
    padding: 10px;
  }
  
  .game-container {
    padding: 10px;
  }
  
  .game-area {
    height: 180px;
  }
  
  .control-btn {
    padding: 5px 8px;
    font-size: 6px;
  }
}
</style>