<template>
  <header class="header">
    <button class="hamburger" @click="toggleMenu">
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
    </button>
    
    <div class="logo" :class="{ 'logo-centered': isScrolled }">
      <span class="logo-text">KIDPATH</span>
    </div>
    
    <button class="contact-btn">
      <span class="contact-icon">👋</span>
    </button>

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
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const menuOpen = ref(false)
const isScrolled = ref(false)

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
  padding: 20px 40px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.hamburger {
  width: 50px;
  height: 50px;
  background: transparent;
  border: 2px solid #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hamburger:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: #ffffff;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-centered {
  transform: translateX(-50%) scale(0.8);
}

.logo-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: #00ff41;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  letter-spacing: 2px;
}

.contact-btn {
  width: 50px;
  height: 50px;
  background: transparent;
  border: 2px solid #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.contact-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.contact-icon {
  font-size: 20px;
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
  border-right: 2px solid #00ff41;
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
  background: transparent;
  border: 2px solid #00ff41;
  border-radius: 4px;
  font-size: 18px;
  color: #00ff41;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-family: 'Press Start 2P', monospace;
}

.nav-close:hover {
  background: rgba(0, 255, 65, 0.1);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.nav-logo-icon {
  font-size: 24px;
  color: #00ff41;
}

.nav-logo-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #00ff41;
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
  color: #00ff41;
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
  background: #00ff41;
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