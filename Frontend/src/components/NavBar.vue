<template>
  <header class="pacman-navbar">
    <div class="navbar-container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <div class="logo-icon">👻</div>
        <span class="logo-text">KIDPATH</span>
      </router-link>

      <!-- Navigation -->
      <nav class="nav-links">
        <router-link to="/" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="nav-dot"></span>
          <span class="nav-text">HOME</span>
        </router-link>
        <router-link to="/comfort-insights" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="nav-dot"></span>
          <span class="nav-text">INSIGHTS</span>
        </router-link>
        <router-link to="/seasonal-comfort" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="nav-dot"></span>
          <span class="nav-text">SEASONS</span>
        </router-link>
      </nav>

      <!-- Mobile Menu Button -->
      <button class="mobile-btn" @click="toggleMobileMenu">
        <div class="btn-line"></div>
        <div class="btn-line"></div>
        <div class="btn-line"></div>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ 'mobile-open': mobileMenuOpen }">
      <router-link to="/" class="mobile-link" @click="closeMobileMenu">
        <span class="mobile-dot"></span>
        <span class="mobile-text">HOME</span>
      </router-link>
      <router-link to="/comfort-insights" class="mobile-link" @click="closeMobileMenu">
        <span class="mobile-dot"></span>
        <span class="mobile-text">INSIGHTS</span>
      </router-link>
      <router-link to="/seasonal-comfort" class="mobile-link" @click="closeMobileMenu">
        <span class="mobile-dot"></span>
        <span class="mobile-text">SEASONS</span>
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useComfortData } from '@/composables/useComfortData'

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Get weather data for the ticker
const { uvIndex, windSpeed } = useComfortData()
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.pacman-navbar {
  background: #000000;
  border-bottom: 2px solid #ffff00;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(255, 255, 0, 0.3);
  height: 60px;
}

/* Navbar Container */
.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Logo */
.logo {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 10px #ffff00);
}

.logo-icon {
  font-size: 1.5rem;
  animation: pacman-chomp 1s ease-in-out infinite;
}

@keyframes pacman-chomp {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
}

.logo-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  color: #ffff00;
  text-shadow: 2px 2px 0px #ff6b00;
  letter-spacing: 2px;
}

/* Navigation Links */
.nav-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 2px solid transparent;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 0, 0.2), transparent);
  transition: left 0.5s ease;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  border-color: #ffff00;
  background: rgba(255, 255, 0, 0.1);
  box-shadow: 0 0 15px rgba(255, 255, 0, 0.3);
}

.nav-link.active {
  border-color: #ff6b00;
  background: rgba(255, 107, 0, 0.1);
  box-shadow: 0 0 15px rgba(255, 107, 0, 0.3);
}

.nav-dot {
  width: 8px;
  height: 8px;
  background: #ffff00;
  border-radius: 50%;
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.nav-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #ffffff;
  text-shadow: 1px 1px 0px #333;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.nav-link:hover .nav-text {
  color: #ffff00;
  text-shadow: 1px 1px 0px #ff6b00;
}

.nav-link.active .nav-text {
  color: #ff6b00;
  text-shadow: 1px 1px 0px #cc4a00;
}

/* Mobile Menu Button */
.mobile-btn {
  display: none;
  flex-direction: column;
  background: none;
  border: 2px solid #ffff00;
  cursor: pointer;
  padding: 8px;
  gap: 3px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.mobile-btn:hover {
  box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
  background: rgba(255, 255, 0, 0.1);
}

.btn-line {
  width: 20px;
  height: 2px;
  background: #ffff00;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-btn:hover .btn-line {
  background: #ff6b00;
}


/* Mobile Menu */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #000000;
  border: 2px solid #ffff00;
  border-top: none;
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 999;
  box-shadow: 0 4px 15px rgba(255, 255, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.mobile-menu.mobile-open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.mobile-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 20px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 0, 0.05);
}

.mobile-link:hover {
  border-color: #ffff00;
  background: rgba(255, 255, 0, 0.1);
  box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
}

.mobile-dot {
  width: 6px;
  height: 6px;
  background: #ffff00;
  border-radius: 50%;
  animation: dot-pulse 2s ease-in-out infinite;
}

.mobile-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #ffffff;
  text-shadow: 1px 1px 0px #333;
  letter-spacing: 1px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 15px;
  }
  
  .logo-text {
    font-size: 14px;
  }
  
  .mobile-btn {
    display: flex;
  }
  
  .nav-links {
    display: none;
  }
  
  .nav-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 0 10px;
  }
  
  .logo-text {
    font-size: 12px;
  }
  
  .logo-icon {
    font-size: 1.2rem;
  }
  
  .mobile-menu {
    padding: 15px;
  }
  
  .mobile-text {
    font-size: 9px;
  }
}
</style>
