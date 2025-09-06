<template>
  <div 
    class="homepage" 
    :class="{ 'blurred': isMenuOpen || isMusicOpen }"
    role="main"
    aria-label="KidPath Homepage - Weather Safety for Children"
  >
    <!-- Video Background -->
    <div class="video-bg">
      <video autoplay muted loop playsinline @error="onVideoError" @loadeddata="onVideoLoaded" preload="auto">
        <source src="/video/bg-video.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="video-overlay"></div>
    </div>

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
          <h1 class="main-title">SMART ROUTES FOR KIDS</h1>
          <p class="main-description" ref="typewriterText">
            {{ displayedText }}
            <span class="cursor" v-if="isTyping">|</span>
          </p>
        </div>

        <!-- Call to Action Button -->
        <div class="cta-section">
          <router-link 
            to="/comfort-insights" 
            class="cta-button"
            role="button"
            aria-label="View detailed weather insights and recommendations"
            tabindex="0"
          >
            <span class="cta-icon" aria-hidden="true"></span>
            <span class="cta-text">VIEW DETAILED INSIGHTS</span>
            <span class="cta-arrow" aria-hidden="true">→</span>
          </router-link>
        </div>

        <!-- Weather Stats -->
        <div class="weather-stats" v-if="!loading && !error" role="region" aria-label="Current Weather Conditions">
          <div class="stat-card uv-card" role="article" :aria-label="`UV Index: ${uvIndex !== null ? uvIndex : 'Loading'}, Level: ${uvLevel}`">
            <div class="stat-icon" aria-hidden="true">☀️</div>
            <div class="stat-info">
              <div class="stat-label">UV INDEX</div>
              <div class="stat-value" :aria-label="`UV Index value: ${uvIndex !== null ? uvIndex : 'Loading'}`">{{ uvIndex !== null ? uvIndex : '--' }}</div>
              <div class="stat-level" :class="uvLevel.toLowerCase().replace(' ', '-')" :aria-label="`UV Level: ${uvLevel}`">{{ uvLevel }}</div>
              <div class="quick-decision" :class="uvLevel.toLowerCase().replace(' ', '-')" role="note" :aria-label="`Recommendation: ${getUVDecision()}`">
                {{ getUVDecision() }}
              </div>
              </div>
                </div>
          <div class="stat-card wind-card" role="article" :aria-label="`Wind Speed: ${windSpeed !== null ? windSpeed.toFixed(1) : 'Loading'} km/h, Level: ${windLevel}`">
            <div class="stat-icon" aria-hidden="true">💨</div>
            <div class="stat-info">
              <div class="stat-label">WIND SPEED</div>
              <div class="stat-value" :aria-label="`Wind Speed: ${windSpeed !== null ? windSpeed.toFixed(1) : 'Loading'} kilometers per hour`">{{ windSpeed !== null ? windSpeed.toFixed(1) : '--' }}</div>
              <div class="stat-level" :class="windLevel.toLowerCase().replace(' ', '-')" :aria-label="`Wind Level: ${windLevel}`">{{ windLevel }}</div>
              <div class="quick-decision" :class="windLevel.toLowerCase().replace(' ', '-')" role="note" :aria-label="`Recommendation: ${getWindDecision()}`">
                {{ getWindDecision() }}
            </div>
              </div>
                </div>
        </div>
            </div>

      <!-- Right Section - Comprehensive Game -->
      <div class="right-section">
        <div class="game-container" :class="{ 'game-mode-pacman': gameMode === 'pacman' }">
          <div class="game-header">
            <div class="game-header-top">
              <div class="game-mode-toggle">
                <button 
                  class="mode-btn" 
                  :class="{ active: gameMode === 'defender' }"
                  @click="switchGameMode('defender')"
                >
                  DEFENDER
                </button>
                <button 
                  class="mode-btn" 
                  :class="{ active: gameMode === 'pacman' }"
                  @click="switchGameMode('pacman')"
                >
                  PAC-MAN
                </button>
              </div>
              <h2 class="game-title">{{ gameMode === 'defender' ? 'WEATHER DEFENDER' : 'WEATHER PAC-MAN' }}</h2>
            </div>
            <div class="game-header-bottom">
              <div class="game-stats">
              <!-- Defender Mode Stats -->
              <template v-if="gameMode === 'defender'">
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
                <div class="game-stat" v-if="combo > 0">
                  <span class="stat-label">COMBO</span>
                  <span class="stat-value combo-text">{{ Math.floor(combo) }}x{{ multiplier }}</span>
                </div>
                <div class="game-stat" v-if="bossActive">
                  <span class="stat-label">BOSS</span>
                  <span class="stat-value boss-health">{{ bossHealth }}</span>
                </div>
              </template>
              
              <!-- Pac-Man Mode Stats -->
              <template v-if="gameMode === 'pacman'">
                <div class="game-stat">
                  <span class="stat-label">SCORE</span>
                  <span class="stat-value">{{ pacmanScore }}</span>
                </div>
                <div class="game-stat">
                  <span class="stat-label">LIVES</span>
                  <span class="stat-value">{{ pacmanLives }}</span>
                </div>
                <div class="game-stat">
                  <span class="stat-label">ITEMS</span>
                  <span class="stat-value">{{ collectedItems }}/{{ totalItems }}</span>
                </div>
                <div class="game-stat">
                  <span class="stat-label">GOAL</span>
                  <span class="stat-value goal-distance">{{ Math.floor(getDistanceToGoal()) }}m</span>
                </div>
              </template>
              </div>
            </div>
          </div>

          <div class="game-area" @click="handleGameClick" ref="gameBoard">
            <!-- Defender Mode Content -->
            <template v-if="gameMode === 'defender'">
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
            </template>
            
            <!-- Pac-Man Mode Content -->
            <template v-if="gameMode === 'pacman'">
              <!-- Pac-Man Player -->
              <div class="pacman-player" :style="{ left: pacmanX + 'px', top: pacmanY + 'px' }">
                <div class="pacman-sprite">😊</div>
              </div>
              
              <!-- Weather Hazards -->
              <div 
                v-for="hazard in weatherHazards" 
                :key="hazard.id"
                class="weather-hazard"
                :style="{ 
                  left: hazard.x + 'px', 
                  top: hazard.y + 'px',
                  backgroundColor: hazard.color
                }"
              >
                <div class="hazard-sprite">{{ getHazardIcon(hazard.type) }}</div>
              </div>
              
              <!-- Collectible Items -->
              <div 
                v-for="item in getCollectibleItems()" 
                :key="item.id"
                class="collectible-item"
                :style="{ 
                  left: item.x + 'px', 
                  top: item.y + 'px'
                }"
              >
                <div class="item-sprite">⭐</div>
              </div>
              
              <!-- Goal Point -->
              <div class="goal-point" :style="{ left: goalX + 'px', top: goalY + 'px' }">
                <div class="goal-sprite">🏁</div>
              </div>
            </template>
            
            <!-- Game Over Overlay -->
            <div class="game-over-overlay" v-if="gameOver">
              <div class="game-over-content">
                <p class="game-over-text">GAME OVER!</p>
                <p class="final-score">Final Score: {{ gameMode === 'pacman' ? pacmanScore : gameScore }}</p>
                <button class="restart-btn" @click="restartGame">PLAY AGAIN</button>
              </div>
            </div>
            
            <!-- Explosions (shared between both modes) -->
            <div class="explosion" v-for="explosion in explosions" :key="explosion.id" 
                 :style="{ left: explosion.x + 'px', top: explosion.y + 'px' }">
              {{ explosion.symbol }}
            </div>
            
            <!-- Particles (shared between both modes) -->
            <div 
              v-for="particle in particles" 
              :key="particle.id"
              class="particle"
            :style="{ 
              left: particle.x + 'px', 
              top: particle.y + 'px',
              backgroundColor: particle.color,
              opacity: particle.alpha,
              transform: `scale(${particle.alpha})`
            }"
          ></div>
          </div>
          
          <div class="game-controls">
            <!-- Defender Mode Controls -->
            <template v-if="gameMode === 'defender'">
              <div class="control-buttons">
                <button class="control-btn" @click="moveLeft">←</button>
                <button class="control-btn action" @click="shoot">FIRE</button>
                <button class="control-btn" @click="moveRight">→</button>
              </div>
              <div class="game-actions">
                <button class="control-btn start-btn" @click="initializeGame" v-if="!gameStarted && !gameOver">START</button>
              </div>
              <p class="game-instructions">Defend against weather hazards! Use arrow keys or buttons to move and shoot.</p>
            </template>
            
            <!-- Pac-Man Mode Controls -->
            <template v-if="gameMode === 'pacman'">
              <div class="control-buttons">
                <button class="control-btn" @click="movePacmanLeft">←</button>
                <button class="control-btn" @click="movePacmanUp">↑</button>
                <button class="control-btn" @click="movePacmanDown">↓</button>
                <button class="control-btn" @click="movePacmanRight">→</button>
              </div>
              <div class="game-actions">
                <button class="control-btn start-btn" @click="initializePacmanGame" v-if="!gameStarted && !gameOver">START</button>
              </div>
              <p class="game-instructions">Collect all stars and reach the goal! Use arrow keys or WASD to move.</p>
            </template>
            
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

    <!-- Footer -->
    <Footer />
    
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useComfortData } from '@/composables/useComfortData'
import { format } from 'date-fns'
import Footer from '@/components/Footer.vue'

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

// Blur detection for nav menu and music panel
const isMenuOpen = ref(false)
const isMusicOpen = ref(false)


// Typewriter animation
const fullText = "Navigate Melbourne's weather with confidence. Find shaded routes, cooling facilities, and safe outdoor spaces tailored for children's health and comfort."
const displayedText = ref('')
const isTyping = ref(true)
const typewriterSpeed = 20

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
const particles = ref([])
const gameBoard = ref(null)
const gameLoop = ref(null)
const lastEnemyTime = ref(0)
const lastPowerupTime = ref(0)
const lastShotTime = ref(0)
const enemyId = ref(0)
const projectileId = ref(0)
const powerupId = ref(0)
const explosionId = ref(0)
const particleId = ref(0)

// Advanced game mechanics
const combo = ref(0)
const maxCombo = ref(0)
const multiplier = ref(1)
const shield = ref(false)
const rapidFire = ref(false)
const doubleShot = ref(false)
const invulnerable = ref(false)
const screenShake = ref(false)
const gameSpeed = ref(1)
const bossHealth = ref(0)
const bossActive = ref(false)
const waveEnemies = ref(0)
const waveComplete = ref(false)

// Game mode toggle
const gameMode = ref('defender') // 'defender' or 'pacman'
const pacmanX = ref(150)
const pacmanY = ref(150)
const goalX = ref(250)
const goalY = ref(50)
const pacmanScore = ref(0)
const pacmanLives = ref(3)
const weatherHazards = ref([])
const collectedItems = ref(0)
const totalItems = ref(10)


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

// Video error handling
const onVideoError = (event) => {
  console.error('Video failed to load:', event)
  console.log('Video path attempted: /video/bg-video.mp4')
}

const onVideoLoaded = () => {
  console.log('Video loaded successfully')
}

// Quick decision functions
const getUVDecision = () => {
  if (uvIndex.value === null) return 'Check UV data...'
  
  if (uvIndex.value <= 2) {
    return '✅ Perfect for outdoor play!'
  } else if (uvIndex.value <= 5) {
    return '⚠️ Use sun protection'
  } else if (uvIndex.value <= 7) {
    return '🛡️ Seek shade, use sunscreen'
  } else if (uvIndex.value <= 10) {
    return '🚫 Avoid peak sun hours'
  } else {
    return '⚠️ Stay indoors or heavily shaded'
  }
}

const getWindDecision = () => {
  if (windSpeed.value === null) return 'Check wind data...'
  
  if (windSpeed.value <= 10) {
    return '✅ Calm conditions - great for kids!'
  } else if (windSpeed.value <= 20) {
    return '⚠️ Light breeze - watch small children'
  } else if (windSpeed.value <= 30) {
    return '🛡️ Moderate wind - hold hands'
  } else if (windSpeed.value <= 40) {
    return '🚫 Strong wind - avoid outdoor play'
  } else {
    return '⚠️ Very dangerous - stay indoors'
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
  particles.value = []
  playerPosition.value = 150
  lastEnemyTime.value = 0
  lastPowerupTime.value = 0
  lastShotTime.value = 0
  
  // Reset advanced mechanics
  combo.value = 0
  maxCombo.value = 0
  multiplier.value = 1
  shield.value = false
  rapidFire.value = false
  doubleShot.value = false
  invulnerable.value = false
  screenShake.value = false
  gameSpeed.value = 1
  bossHealth.value = 0
  bossActive.value = false
  waveEnemies.value = 0
  waveComplete.value = false
  
  // Start game loop
  startGameLoop()
}

// Start game loop
const startGameLoop = () => {
  if (gameLoop.value) clearInterval(gameLoop.value)
  
  gameLoop.value = setInterval(() => {
    if (!gameStarted.value || gameOver.value) return
    
    // Spawn enemies with wave system
    spawnEnemies()
    
    // Spawn powerups
    spawnPowerups()
    
    // Update game objects
    updateEnemies()
    updateProjectiles()
    updatePowerups()
    updateExplosions()
    updateParticles()
    
    // Check collisions
    checkCollisions()
    
    // Update combo system
    updateCombo()
    
    // Check boss spawning
    checkBossSpawn()
    
    // Check level progression
    checkLevelProgression()
    
    // Update screen shake
    if (screenShake.value) {
      screenShake.value = false
    }
    
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
      // Calculate distance between projectile and enemy
      const dx = projectile.x - enemy.x
      const dy = projectile.y - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Use a larger collision radius for better hit detection
      const collisionRadius = 25
      
      if (distance < collisionRadius) {
        // Hit!
        gameScore.value += 10 * multiplier.value
        combo.value += 1
        createExplosion(enemy.x, enemy.y)
        projectiles.value.splice(pIndex, 1)
        enemies.value.splice(eIndex, 1)
      }
    })
  })
  
  // Check enemy-player collisions
  enemies.value.forEach((enemy, index) => {
    // Calculate distance between enemy and player
    const dx = enemy.x - playerPosition.value
    const dy = enemy.y - 150 // Player Y position
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Use a reasonable collision radius for player
    const playerCollisionRadius = 35
    
    if (distance < playerCollisionRadius) {
      // Player hit!
      if (!invulnerable.value) {
        lives.value--
        combo.value = 0 // Reset combo on hit
        createExplosion(enemy.x, enemy.y)
        enemies.value.splice(index, 1)
        
        // Add screen shake effect
        screenShake.value = true
        
        // Make player invulnerable briefly
        invulnerable.value = true
        setTimeout(() => {
          invulnerable.value = false
        }, 1000)
        
        if (lives.value <= 0) {
          endGame()
        }
      }
    }
  })
  
  // Check powerup-player collisions
  powerups.value.forEach((powerup, index) => {
    // Calculate distance between powerup and player
    const dx = powerup.x - playerPosition.value
    const dy = powerup.y - 150 // Player Y position
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Use a reasonable collision radius for powerups
    const powerupCollisionRadius = 30
    
    if (distance < powerupCollisionRadius) {
      // Collect powerup
      collectPowerup(powerup.type)
      createExplosion(powerup.x, powerup.y)
      powerups.value.splice(index, 1)
    }
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
  particles.value = []
  playerPosition.value = 150
  lastEnemyTime.value = 0
  lastPowerupTime.value = 0
  lastShotTime.value = 0
  
  // Reset advanced mechanics
  combo.value = 0
  maxCombo.value = 0
  multiplier.value = 1
  shield.value = false
  rapidFire.value = false
  doubleShot.value = false
  invulnerable.value = false
  screenShake.value = false
  gameSpeed.value = 1
  bossHealth.value = 0
  bossActive.value = false
  waveEnemies.value = 0
  waveComplete.value = false
  
  // Reset Pac-Man specific variables
  pacmanX.value = 150
  pacmanY.value = 150
  pacmanScore.value = 0
  pacmanLives.value = 3
  weatherHazards.value = []
  collectibleItems.value = []
  collectedItems.value = 0
}

// Restart game (reset and start automatically)
const restartGame = () => {
  resetGame()
  
  // Start the appropriate game mode
  if (gameMode.value === 'pacman') {
    initializePacmanGame()
  } else {
    initializeGame()
  }
}

// Advanced game functions
const updateParticles = () => {
  particles.value = particles.value.filter(particle => {
    particle.life--
    particle.x += particle.vx
    particle.y += particle.vy
    particle.alpha = particle.life / particle.maxLife
    return particle.life > 0
  })
}

const createParticle = (x, y, type = 'explosion') => {
  const particle = {
    id: particleId.value++,
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    life: 30,
    maxLife: 30,
    alpha: 1,
    type: type,
    color: type === 'explosion' ? '#ff6b6b' : '#4ecdc4'
  }
  particles.value.push(particle)
}

const updateCombo = () => {
  if (combo.value > maxCombo.value) {
    maxCombo.value = combo.value
  }
  
  // Combo decay
  if (combo.value > 0) {
    combo.value = Math.max(0, combo.value - 0.1)
  }
  
  // Update multiplier based on combo
  multiplier.value = Math.min(5, 1 + Math.floor(combo.value / 5))
}

const checkBossSpawn = () => {
  if (!bossActive.value && currentLevel.value > 0 && currentLevel.value % 3 === 0) {
    if (enemies.value.length === 0 && !waveComplete.value) {
      spawnBoss()
    }
  }
}

const spawnBoss = () => {
  bossActive.value = true
  bossHealth.value = 50 + (currentLevel.value * 10)
  
  const boss = {
    id: enemyId.value++,
    x: Math.random() * 200 + 50,
    y: 20,
    type: 'boss',
    health: bossHealth.value,
    maxHealth: bossHealth.value,
    speed: 1,
    size: 40,
    color: '#ff0000',
    lastShot: 0
  }
  enemies.value.push(boss)
}

const checkLevelProgression = () => {
  if (enemies.value.length === 0 && !bossActive.value) {
    if (waveComplete.value) {
      currentLevel.value++
      gameSpeed.value = Math.min(3, 1 + currentLevel.value * 0.1)
      waveComplete.value = false
      waveEnemies.value = 0
      
      // Level up effects
      createParticle(150, 100, 'levelup')
      screenShake.value = true
    }
  }
}

const createExplosion = (x, y, size = 20) => {
  const explosion = {
    id: explosionId.value++,
    x: x,
    y: y,
    size: size,
    maxSize: size,
    life: 20,
    maxLife: 20
  }
  explosions.value.push(explosion)
  
  // Create particle burst
  for (let i = 0; i < 8; i++) {
    createParticle(x, y, 'explosion')
  }
}

// Game mode switching
const switchGameMode = (mode) => {
  // Stop any existing game loop
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
    gameLoop.value = null
  }
  
  gameMode.value = mode
  resetGame()
  
  // Initialize the selected game mode
  if (mode === 'pacman') {
    initializePacmanGame()
  } else {
    initializeGame()
  }
}

// Pac-Man game functions
const initializePacmanGame = () => {
  // Reset all game states
  gameStarted.value = true
  gameOver.value = false
  pacmanX.value = 150
  pacmanY.value = 150
  pacmanScore.value = 0
  pacmanLives.value = 3
  collectedItems.value = 0
  weatherHazards.value = []
  
  // Clear any existing game loop
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
    gameLoop.value = null
  }
  
  // Spawn initial weather hazards
  spawnWeatherHazards()
  
  // Initialize collectible items
  initializeCollectibleItems()
  
  // Start Pac-Man game loop
  startPacmanGameLoop()
}

const spawnWeatherHazards = () => {
  const hazardTypes = ['sunlight', 'rain', 'wind']
  const colors = ['#ffeb3b', '#2196f3', '#9c27b0']
  
  for (let i = 0; i < 5; i++) {
    const hazard = {
      id: `hazard-${i}`,
      x: Math.random() * 280 + 10,
      y: Math.random() * 200 + 10,
      type: hazardTypes[Math.floor(Math.random() * hazardTypes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: (Math.random() - 0.5) * 2, // Can be positive or negative
      direction: Math.random() * Math.PI * 2 // Random initial direction
    }
    weatherHazards.value.push(hazard)
  }
}

const getHazardIcon = (type) => {
  const icons = {
    sunlight: '☀️',
    rain: '🌧️',
    wind: '💨'
  }
  return icons[type] || '❓'
}

// Store collectible items as a reactive array
const collectibleItems = ref([])

const initializeCollectibleItems = () => {
  collectibleItems.value = []
  for (let i = 0; i < totalItems.value; i++) {
    collectibleItems.value.push({
      id: `item-${i}`,
      x: Math.random() * 280 + 10,
      y: Math.random() * 200 + 10,
      collected: false
    })
  }
}

const getCollectibleItems = () => {
  return collectibleItems.value.filter(item => !item.collected)
}

const getDistanceToGoal = () => {
  const dx = goalX.value - pacmanX.value
  const dy = goalY.value - pacmanY.value
  return Math.sqrt(dx * dx + dy * dy)
}

const startPacmanGameLoop = () => {
  if (gameLoop.value) clearInterval(gameLoop.value)
  
  gameLoop.value = setInterval(() => {
    if (!gameStarted.value || gameOver.value) return
    
    updateWeatherHazards()
    checkPacmanCollisions()
    checkPacmanVictory()
  }, 50)
}

const updateWeatherHazards = () => {
  weatherHazards.value.forEach(hazard => {
    // Use direction-based movement for more realistic motion
    const moveX = Math.cos(hazard.direction) * Math.abs(hazard.speed)
    const moveY = Math.sin(hazard.direction) * Math.abs(hazard.speed)
    
    hazard.x += moveX
    hazard.y += moveY
    
    // Keep hazards within bounds with bounce effect
    if (hazard.x < 10) {
      hazard.x = 10
      hazard.direction = Math.PI - hazard.direction // Bounce off left wall
    } else if (hazard.x > 290) {
      hazard.x = 290
      hazard.direction = Math.PI - hazard.direction // Bounce off right wall
    }
    
    if (hazard.y < 10) {
      hazard.y = 10
      hazard.direction = -hazard.direction // Bounce off top wall
    } else if (hazard.y > 210) {
      hazard.y = 210
      hazard.direction = -hazard.direction // Bounce off bottom wall
    }
    
    // Occasionally change direction completely for more random movement
    if (Math.random() < 0.02) {
      hazard.direction = Math.random() * Math.PI * 2
      hazard.speed = (Math.random() - 0.5) * 2
    }
    
    // Add slight random drift
    hazard.direction += (Math.random() - 0.5) * 0.1
  })
}

const checkPacmanCollisions = () => {
  // Check weather hazard collisions
  weatherHazards.value.forEach((hazard, index) => {
    const dx = hazard.x - pacmanX.value
    const dy = hazard.y - pacmanY.value
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 25) {
      // Hit by weather hazard
      pacmanLives.value--
      createExplosion(pacmanX.value, pacmanY.value)
      screenShake.value = true
      
      if (pacmanLives.value <= 0) {
        gameOver.value = true
        gameStarted.value = false
        if (gameLoop.value) {
          clearInterval(gameLoop.value)
          gameLoop.value = null
        }
      }
    }
  })
  
  // Check collectible item collisions
  collectibleItems.value.forEach((item, index) => {
    if (item.collected) return
    
    const dx = item.x - pacmanX.value
    const dy = item.y - pacmanY.value
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 20) {
      // Collect item
      item.collected = true
      collectedItems.value++
      pacmanScore.value += 10
      createExplosion(item.x, item.y)
    }
  })
}

const checkPacmanVictory = () => {
  if (collectedItems.value >= totalItems.value) {
    const dx = goalX.value - pacmanX.value
    const dy = goalY.value - pacmanY.value
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 30) {
      // Victory!
      pacmanScore.value += 100
      gameOver.value = true
      gameStarted.value = false
      if (gameLoop.value) {
        clearInterval(gameLoop.value)
        gameLoop.value = null
      }
    }
  }
}

// Handle game click
const handleGameClick = (event) => {
  if (!gameStarted.value || gameOver.value) return
  // Could add touch controls here
}

// Keyboard controls
const handleKeyPress = (event) => {
  if (!gameStarted.value || gameOver.value) return
  
  if (gameMode.value === 'defender') {
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
  } else if (gameMode.value === 'pacman') {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        movePacmanLeft()
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        movePacmanRight()
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
        movePacmanUp()
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        movePacmanDown()
        break
      default:
        return
    }
  }
}

// Pac-Man movement functions
const movePacmanLeft = () => {
  if (pacmanX.value > 10) {
    pacmanX.value -= 5
  }
}

const movePacmanRight = () => {
  if (pacmanX.value < 290) {
    pacmanX.value += 5
  }
}

const movePacmanUp = () => {
  if (pacmanY.value > 10) {
    pacmanY.value -= 5
  }
}

const movePacmanDown = () => {
  if (pacmanY.value < 210) {
    pacmanY.value += 5
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
    if (gameMode.value === 'pacman') {
      initializePacmanGame()
    } else {
      initializeGame()
    }
  }, 2000)
  
  // Listen for nav menu and music panel state changes
  const checkMenuState = () => {
    const navOverlay = document.querySelector('.nav-overlay')
    const musicOverlay = document.querySelector('.music-overlay')
    
    if (navOverlay) {
      isMenuOpen.value = navOverlay.classList.contains('nav-open')
    }
    
    if (musicOverlay) {
      isMusicOpen.value = musicOverlay.classList.contains('music-open')
    }
  }
  
  // Check state periodically
  const interval = setInterval(checkMenuState, 100)
  
  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(interval)
  })
  
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
  height: 100vh;
  background: #000000;
  color: #00ff41;
  font-family: 'Press Start 2P', monospace;
  position: relative;
  transition: filter 0.3s ease;
  overflow: hidden;
}

.homepage.blurred {
  filter: blur(5px);
  pointer-events: none;
}

/* Focus indicators for keyboard navigation */
button:focus,
a:focus,
input:focus {
  outline: 3px solid #ffff00;
  outline-offset: 2px;
}

/* Prevent horizontal overflow on all elements */
* {
  box-sizing: border-box;
}

.homepage * {
  max-width: 100%;
}

/* Video Background */
.video-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.video-bg video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2;
}

/* Fallback background when video doesn't load */
.video-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  z-index: -1;
}

/* Retro Game Background */
.retro-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #001122 0%, #000000 50%, #001122 100%);
  z-index: 0;
  opacity: 0.3;
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
  gap: 5px;
  height: calc(100vh - 160px);
  margin-top: 100px;
  background: transparent;
  overflow: hidden;
  position: relative;
  z-index: 10;
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
  font-size: 16px;
  line-height: 1.6;
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

/* Call to Action Section */
.cta-section {
  margin-top: 30px;
  z-index: 2;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 15px 25px;
  background: linear-gradient(135deg, #00ff41, #4ecdc4, #45b7d1);
  border: 2px solid transparent;
  border-radius: 12px;
  text-decoration: none;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);
  animation: cta-pulse 3s ease-in-out infinite;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 65, 0.5);
  background: linear-gradient(135deg, #4ecdc4, #45b7d1, #00ff41);
}

.cta-icon {
  font-size: 14px;
  animation: icon-bounce 2s ease-in-out infinite;
}

.cta-text {
  font-weight: bold;
}

.cta-arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.cta-button:hover .cta-arrow {
  transform: translateX(5px);
}

@keyframes cta-pulse {
  0%, 100% { 
    box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);
  }
  50% { 
    box-shadow: 0 6px 20px rgba(0, 255, 65, 0.5);
  }
}

/* Weather Stats */
.weather-stats {
  display: flex;
  flex-direction: row;
  gap: 15px;
  margin-top: 40px;
  z-index: 2;
  width: 100%;
  max-width: 600px;
  flex-wrap: wrap;
  justify-content: center;
  box-sizing: border-box;
}

.stat-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 46, 0.9) 50%, rgba(22, 33, 62, 0.9) 100%);
  border: 2px solid transparent;
  border-image: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1) 1;
  border-radius: 12px;
  padding: 20px 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: stat-pulse 3s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(0, 255, 65, 0.2);
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
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
  font-size: 18px;
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
  flex: 1;
  min-width: 0;
  padding: 5px;
}

.stat-label {
  font-size: 7px;
  background: linear-gradient(45deg, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 14px;
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
  font-size: 5px;
  padding: 2px 4px;
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

.quick-decision {
  font-size: 10px;
  font-weight: bold;
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  text-align: center;
  font-family: 'Orbitron', monospace;
  letter-spacing: 0.5px;
  animation: decision-pulse 2s ease-in-out infinite;
}

.quick-decision.low {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid #4caf50;
}

.quick-decision.moderate {
  color: #ffa726;
  background: rgba(255, 167, 38, 0.15);
  border: 1px solid #ffa726;
}

.quick-decision.high {
  color: #ffeb3b;
  background: rgba(255, 235, 59, 0.15);
  border: 1px solid #ffeb3b;
}

.quick-decision.very-high {
  color: #f44336;
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid #f44336;
}

@keyframes decision-pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.8;
    transform: scale(1.02);
  }
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
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 255, 65, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 65, 0.3);
}

.game-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.game-header-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-title {
  font-size: 10px;
  background: linear-gradient(45deg, #00ff41, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
  text-align: center;
  line-height: 1.2;
}

.game-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.game-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 50px;
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 65, 0.2);
}

.game-stat .stat-label {
  font-size: 7px;
  color: #4ecdc4;
  letter-spacing: 0.5px;
  font-weight: bold;
  text-transform: uppercase;
}

.game-stat .stat-value {
  font-size: 9px;
  background: linear-gradient(45deg, #ffff00, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
}

.combo-text {
  color: #ffff00 !important;
  animation: combo-glow 0.5s ease-in-out infinite alternate;
}

.boss-health {
  color: #ff0000 !important;
  animation: boss-pulse 1s ease-in-out infinite;
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

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  z-index: 6;
  pointer-events: none;
}

.game-area.screen-shake {
  animation: screen-shake 0.1s ease-in-out;
}

@keyframes explosion-burst {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes combo-glow {
  0% { text-shadow: 0 0 5px #ffff00; }
  100% { text-shadow: 0 0 15px #ffff00, 0 0 25px #ffff00; }
}

@keyframes boss-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes screen-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* Game Mode Toggle */
.game-mode-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: center;
}

.mode-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #4ecdc4, #45b7d1);
  border: 2px solid #ffffff;
  color: #000000;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  transition: all 0.3s ease;
  min-width: 70px;
}

.mode-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
}

.mode-btn.active {
  background: linear-gradient(135deg, #00ff41, #4ecdc4);
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
}

/* Pac-Man Game Elements */
.pacman-player {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 10;
  animation: pacman-pulse 1s ease-in-out infinite;
  transition: all 0.1s ease;
}

.pacman-sprite {
  font-size: 20px;
  animation: pacman-chomp 0.3s ease-in-out infinite;
  display: block;
  text-align: center;
  line-height: 20px;
}

.weather-hazard {
  position: absolute;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  z-index: 5;
  animation: hazard-float 2s ease-in-out infinite;
  transition: all 0.1s ease;
}

.hazard-sprite {
  font-size: 20px;
  text-align: center;
  line-height: 25px;
  display: block;
}

.collectible-item {
  position: absolute;
  width: 15px;
  height: 15px;
  z-index: 8;
  animation: item-twinkle 1s ease-in-out infinite;
  transition: all 0.1s ease;
}

.item-sprite {
  font-size: 15px;
  text-align: center;
  line-height: 15px;
  display: block;
}

.goal-point {
  position: absolute;
  width: 30px;
  height: 30px;
  z-index: 9;
  animation: goal-pulse 2s ease-in-out infinite;
  transition: all 0.1s ease;
}

.goal-sprite {
  font-size: 25px;
  text-align: center;
  line-height: 30px;
  display: block;
}

.goal-distance {
  color: #00ff41 !important;
  animation: distance-glow 1s ease-in-out infinite alternate;
}

/* Pac-Man Animations */
@keyframes pacman-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes pacman-chomp {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
}

@keyframes hazard-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes item-twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}

@keyframes goal-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes distance-glow {
  0% { text-shadow: 0 0 5px #00ff41; }
  100% { text-shadow: 0 0 15px #00ff41, 0 0 25px #00ff41; }
}

/* Game Over Overlay */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.game-over-content {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(26, 26, 46, 0.9));
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
  animation: game-over-pulse 2s ease-in-out infinite;
  max-width: 250px;
}

.game-over-text {
  font-size: 18px;
  color: #ff6b6b;
  margin: 0 0 10px 0;
  font-family: 'Press Start 2P', monospace;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
  animation: game-over-flash 1s ease-in-out infinite alternate;
}

.final-score {
  font-size: 10px;
  color: #ffffff;
  margin: 0 0 15px 0;
  font-family: 'Press Start 2P', monospace;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.restart-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #00ff41, #4ecdc4);
  border: 2px solid #ffffff;
  color: #000000;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 255, 65, 0.4);
  background: linear-gradient(135deg, #4ecdc4, #00ff41);
}

@keyframes game-over-pulse {
  0%, 100% { 
    box-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 50px rgba(255, 107, 107, 0.8);
    transform: scale(1.02);
  }
}

@keyframes game-over-flash {
  0% { 
    color: #ff6b6b;
    text-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
  }
  100% { 
    color: #ff0000;
    text-shadow: 0 0 20px rgba(255, 0, 0, 1);
  }
}

.game-controls {
  text-align: center;
}

.control-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

/* Pac-Man specific controls layout */
.game-mode-pacman .control-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  max-width: 120px;
  margin: 0 auto 10px auto;
}

/* Responsive game header */
@media (max-width: 768px) {
  .game-header {
    padding: 10px;
    gap: 10px;
  }
  
  .game-header-top {
    flex-direction: column;
    gap: 10px;
  }
  
  .game-stats {
    gap: 15px;
  }
  
  .game-stat {
    min-width: 45px;
    padding: 4px 6px;
  }
  
  .game-stat .stat-label {
    font-size: 6px;
  }
  
  .game-stat .stat-value {
    font-size: 8px;
  }
  
  .mode-btn {
    padding: 5px 10px;
    font-size: 6px;
    min-width: 60px;
  }
  
  .game-title {
    font-size: 9px;
  }
}

/* Extra small mobile screens */
@media (max-width: 480px) {
  .weather-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .stat-card {
    width: 100%;
    flex: 1;
    min-width: 0;
  }
  
  .stat-card .stat-icon {
    font-size: 20px;
  }
  
  .stat-card .stat-value {
    font-size: 14px;
  }
  
  .stat-card .stat-label {
    font-size: 10px;
  }
  
  .quick-decision {
    font-size: 10px;
  }
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
  flex: 1;
  min-width: 0;
  padding: 5px;
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
  .homepage {
    overflow-y: auto;
    overflow-x: hidden;
    height: auto;
    min-height: 100vh;
    width: 100%;
    max-width: 100vw;
  }
  
  .header {
    padding: 15px 20px;
  }
  
  .main-content {
    grid-template-columns: 1fr;
    height: auto;
    min-height: calc(100vh - 90px);
    overflow-y: visible;
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
  }
  
  .left-section {
    padding: 30px 20px;
    min-height: 50vh;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  
  .right-section {
    padding: 20px;
    min-height: 50vh;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  
  .main-title {
    font-size: 28px;
  }
  
  .main-description {
    font-size: 16px;
  }
  
  .weather-stats {
    margin-top: 20px;
    gap: 10px;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat-card {
    padding: 12px;
    width: calc(50% - 5px);
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    flex: 0 0 calc(50% - 5px);
  }
  
  .game-container {
    padding: 15px;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  
  .game-area {
    height: 200px;
  }
  
  .control-btn {
    padding: 6px 10px;
    font-size: 7px;
  }
  
  .cta-button {
    width: 100%;
    max-width: none;
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
    font-size: 14px;
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