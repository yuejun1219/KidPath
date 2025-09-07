<template>
  <header class="header">
    <button class="hamburger" @click="toggleMenu">
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
    </button>
    
    <button class="music-btn" @click="toggleMusicPanel">
      <span class="music-icon">🎵</span>
    </button>
    
    <router-link to="/" class="logo" :class="{ 'logo-centered': isScrolled }">
      <span class="logo-text">KIDPATH</span>
    </router-link>

    <!-- Sliding Navigation Menu -->
    <div class="nav-overlay" :class="{ 'nav-open': menuOpen }" @click="closeMenu">
      <div class="nav-menu" @click.stop>
        <button class="nav-close" @click="closeMenu">×</button>
        
      <div class="nav-logo">
          <div class="nav-logo-icon">🌱</div>
          <span class="nav-logo-text">KIDPATH</span>
      </div>
      
        <nav class="nav-links">
          <router-link to="/" class="nav-link" @click="closeMenu">Home</router-link>
          <router-link to="/comfort-insights" class="nav-link" @click="closeMenu">Weather Insights</router-link>
          <router-link to="/seasonal-comfort" class="nav-link" @click="closeMenu">Seasonal Guide</router-link>
          <router-link to="/about" class="nav-link" @click="closeMenu">About</router-link>
        </nav>
        
        <div class="nav-contact">
          <div class="nav-contact-label">SAY HELLO</div>
          <div class="nav-contact-email">hello@kidpath.com</div>
        </div>
      </div>
    </div>

    <!-- Music Panel -->
    <div class="music-overlay" :class="{ 'music-open': musicPanelOpen }" @click="closeMusicPanel">
      <div class="music-panel" @click.stop>
        <button class="music-close" @click="closeMusicPanel">×</button>
        
        <div class="music-header">
          <div class="music-title">WEATHER VIBES</div>
          <div class="music-subtitle">Calm tracks for your journey</div>
        </div>
        
        <div class="tracks-container">
          <div class="track-item">
            <iframe 
              data-testid="embed-iframe" 
              style="border-radius:12px" 
              src="https://open.spotify.com/embed/track/4xF4ZBGPZKxECeDFrqSAG4?utm_source=generator" 
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy">
            </iframe>
          </div>
          
          <div class="track-item">
            <iframe 
              data-testid="embed-iframe" 
              style="border-radius:12px" 
              src="https://open.spotify.com/embed/track/4txrAyGAWA9JqZzoNHiPRh?utm_source=generator" 
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy">
            </iframe>
          </div>
          
          <div class="track-item">
            <iframe 
              data-testid="embed-iframe" 
              style="border-radius:12px" 
              src="https://open.spotify.com/embed/track/4VkRQSpG16JxrXaVlNyWdX?utm_source=generator" 
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy">
            </iframe>
          </div>
          
          <div class="track-item">
            <iframe 
              data-testid="embed-iframe" 
              style="border-radius:12px" 
              src="https://open.spotify.com/embed/track/1r232i80xFiNHzSUmrFc01?utm_source=generator" 
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy">
            </iframe>
          </div>
          
          <div class="track-item">
            <iframe 
              data-testid="embed-iframe" 
              style="border-radius:12px" 
              src="https://open.spotify.com/embed/track/6WUgqFZhbNRaeBuzG2ahfJ?utm_source=generator" 
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const menuOpen = ref(false)
const isScrolled = ref(false)
const musicPanelOpen = ref(false)

// Music panel functions
const toggleMusicPanel = () => {
  musicPanelOpen.value = !musicPanelOpen.value
}

const closeMusicPanel = () => {
  musicPanelOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

// Scroll detection
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px 20px 40px;
  background: transparent;
  backdrop-filter: blur(10px);
  min-height: 80px;
}

/* Music Button */
.music-btn {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  z-index: 1001;
  width: 50px;
  height: 50px;
  background: transparent;
  border: 2px solid #00ff41;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.music-btn:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);
  transform: translateY(-50%) scale(1.05);
}

.music-icon {
  font-size: 20px;
  color: #00ff41;
  transition: all 0.3s ease;
}

.music-btn:hover .music-icon {
  color: #4ecdc4;
  transform: scale(1.1);
}

/* Music Panel */
.music-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.music-overlay.music-open {
  opacity: 1;
  visibility: visible;
}

.music-panel {
  width: 400px;
  height: 100vh;
  min-height: 100vh;
  background: #ffffff;
  padding: 20px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

.music-overlay.music-open .music-panel {
  transform: translateX(0);
}

.music-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ff41;
  border-radius: 8px;
  font-size: 20px;
  color: #00ff41;
  font-family: 'Press Start 2P', monospace;
  z-index: 10;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.music-close:hover {
  background: #00ff41;
  color: #000;
  transform: scale(1.1);
}

.music-header {
  margin-top: 60px;
  margin-bottom: 30px;
  text-align: center;
}

.music-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  color: #000000;
  margin-bottom: 10px;
}

.music-subtitle {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #666666;
  opacity: 0.8;
}

.tracks-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.track-item {
  background: transparent;
  border: none;
  padding: 0;
  transition: all 0.3s ease;
}

.track-item iframe {
  border-radius: 12px;
  width: 100%;
  height: 152px;
  border: none;
}

.hamburger {
  width: 50px;
  height: 50px;
  background: transparent;
  border: 2px solid #00ff41;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1001;
}

.hamburger:hover {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: #00ff41;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.hamburger:hover .hamburger-line {
  background: #4ecdc4;
}

.logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  cursor: pointer;
}

.logo-centered {
  transform: translateX(-50%) scale(0.8);
  }
  
  .logo-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 22px;
  background: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  position: relative;
  transition: all 0.3s ease;
  text-shadow: 
    2px 2px 0px #00cc33,
    4px 4px 0px #009922;
}

.logo-text::before {
  content: 'KIDPATH';
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(45deg, #ff6b6b, #ee5a24, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: -1;
  transform: translate(2px, 2px);
  text-shadow: 
    2px 2px 0px #cc3300,
    4px 4px 0px #992200;
  opacity: 0.4;
}


/* Navigation Menu */
.nav-overlay {
  position: fixed;
  top: 0;
    left: 0;
    right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 2000;
    opacity: 0;
    visibility: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
.nav-overlay.nav-open {
    opacity: 1;
    visibility: visible;
  }
  
.nav-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background: #000000;
  padding: 40px;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 30px;
  border-right: 2px solid transparent;
  border-image: linear-gradient(180deg, #00ff41, #ff6b6b, #4ecdc4, #45b7d1) 1;
}

.nav-overlay.nav-open .nav-menu {
  transform: translateX(0);
}

.nav-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border: 2px solid transparent;
  border-radius: 4px;
  font-size: 18px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-family: 'Press Start 2P', monospace;
}

.nav-close:hover {
  background: linear-gradient(135deg, #ee5a24, #ff6b6b);
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.nav-logo-icon {
    font-size: 24px;
  background: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-logo-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  background: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  }
  
  .nav-links {
  display: flex;
  flex-direction: column;
  gap: 20px;
  }
  
  .nav-link {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ffffff;
  text-decoration: none;
  padding: 12px 0;
  transition: all 0.3s ease;
  position: relative;
  letter-spacing: 1px;
}

.nav-link:hover {
  background: linear-gradient(45deg, #00ff41, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateX(10px);
}

.nav-link::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00ff41, #4ecdc4, #45b7d1);
  transition: width 0.3s ease;
}

.nav-link:hover::before {
  width: 15px;
}

.nav-contact {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #00ff41;
}

.nav-contact-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #00ff41;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.nav-contact-email {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #ffffff;
  letter-spacing: 1px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 15px 20px;
  }
  
  .nav-menu {
    width: 100%;
    max-width: 350px;
  }
}
</style>