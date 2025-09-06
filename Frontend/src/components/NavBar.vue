<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-logo">
        <router-link to="/" class="logo-text">
          <span class="pixel-logo">KID</span>
          <span class="pixel-logo-accent">PATH</span>
        </router-link>
      </div>
      
      <!-- Mobile menu button -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <div class="pixel-hamburger"></div>
        <div class="pixel-hamburger"></div>
        <div class="pixel-hamburger"></div>
      </button>
      
      <div class="nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
        <router-link to="/" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="pixel-text">HOME</span>
        </router-link>
        <router-link to="/comfort-insights" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="pixel-text">INSIGHTS</span>
        </router-link>
        <router-link to="/seasonal-comfort" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="pixel-text">SEASONS</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<style scoped>
/* Import retro pixel font */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.navbar {
  background: #0a0a0a;
  border-bottom: 3px solid #00ff41;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
}

.nav-logo {
  display: flex;
  align-items: center;
}

.logo-text {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.logo-text:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 10px #00ff41);
}

.pixel-logo {
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;
  color: #00ff41;
  text-shadow: 2px 2px 0px #008f11;
  letter-spacing: 2px;
}

.pixel-logo-accent {
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;
  color: #ff6b35;
  text-shadow: 2px 2px 0px #cc4a1a;
  letter-spacing: 2px;
}

.nav-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  background: transparent;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #00ff41, #ff6b35);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-link:hover::before {
  opacity: 0.1;
}

.nav-link:hover {
  border-color: #00ff41;
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
}

.nav-link.active {
  border-color: #ff6b35;
  background: rgba(255, 107, 53, 0.1);
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
}

.pixel-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ffffff;
  text-shadow: 1px 1px 0px #333;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.nav-link:hover .pixel-text {
  color: #00ff41;
  text-shadow: 1px 1px 0px #008f11;
}

.nav-link.active .pixel-text {
  color: #ff6b35;
  text-shadow: 1px 1px 0px #cc4a1a;
}

/* Mobile menu button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  background: none;
  border: 2px solid #00ff41;
  cursor: pointer;
  padding: 8px;
  gap: 4px;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
}

.pixel-hamburger {
  width: 20px;
  height: 3px;
  background: #00ff41;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover .pixel-hamburger {
  background: #ff6b35;
}


@media (max-width: 768px) {
  .nav-container {
    height: 70px;
    padding: 0 15px;
  }
  
  .pixel-logo,
  .pixel-logo-accent {
    font-size: 18px;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #0a0a0a;
    border: 2px solid #00ff41;
    border-top: none;
    flex-direction: column;
    gap: 0;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 255, 65, 0.3);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .nav-links.mobile-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  
  .nav-link {
    padding: 15px 20px;
    border: 1px solid transparent;
    border-bottom: 1px solid rgba(0, 255, 65, 0.3);
    width: 100%;
    text-align: center;
    margin-bottom: 5px;
  }
  
  .nav-link:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
  
  .pixel-text {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 10px;
  }
  
  .pixel-logo,
  .pixel-logo-accent {
    font-size: 16px;
  }
  
  .nav-links {
    padding: 15px;
  }
  
  .nav-link {
    padding: 12px 15px;
  }
  
  .pixel-text {
    font-size: 9px;
  }
}
</style>
