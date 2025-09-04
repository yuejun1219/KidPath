<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-logo">
        <img src="../images/logo.png" alt="KidPath Logo" class="logo-image" />
        <router-link to="/" class="logo-text">KidPath</router-link>
      </div>
      
      <!-- Mobile menu button -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <span class="hamburger"></span>
        <span class="hamburger"></span>
        <span class="hamburger"></span>
      </button>
      
      <div class="nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
        <router-link to="/" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span>HOME</span>
        </router-link>
        <router-link to="/comfort-insights" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span>Comfort Insights</span>
        </router-link>
        <router-link to="/seasonal-comfort" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span>Seasonal Comfort</span>
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
.navbar {
  background: rgb(250, 237, 220);
  box-shadow: 0 2px 10px rgba(92, 91, 91, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 3px;
}

.logo-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.logo-text {
  font-family: 'Otomanopee One', cursive;
  font-size: 35px;
  font-weight: 400;
  line-height: 35px;
  letter-spacing: 0%;
  background: linear-gradient(135deg, #89984c 0%, #697b18 58%, #BCC889 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  transition: all 0.3s ease;
}

.logo-text:hover {
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  gap: 40px;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #acbd65 ;
  font-family: 'Sour Gummy';
  font-weight: 1000;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 12px 20px;
  border-radius: 25px;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-link span {
  position: relative;
  z-index: 2;
}

/* 图片高亮效果 */
.nav-link::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-20%, -20%) scale(0);
  width: 80px;
  height: 70px;
  background-image: url('../images/dot1.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1;
}

/* 悬停效果 */
.nav-link:hover::before {
  transform: translate(-50%, -50%) scale(1) rotate(15deg);
}

/* 选中状态 - 图片高亮 */
.nav-link.active::before {
  transform: translate(-50%, -50%) scale(1) rotate(0deg);
  filter: brightness(1.1) saturate(1.2);
}

.nav-link:hover {
  color:  #b0bd74 ;
}

.nav-link.active {
  color: #6d830b;
  font-weight: 600;
}

/* Mobile menu button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  gap: 4px;
}

.hamburger {
  width: 25px;
  height: 3px;
  background: #acbd65;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover .hamburger {
  background: #6d830b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    height: 60px;
    padding: 0 15px;
  }
  
  .logo-text {
    font-size: 28px;
    line-height: 22px;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgb(250, 237, 220);
    flex-direction: column;
    gap: 0;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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
    font-size: 1rem;
    border-bottom: 1px solid rgba(172, 189, 101, 0.2);
    width: 100%;
    text-align: center;
  }
  
  .nav-link:last-child {
    border-bottom: none;
  }
  
  .nav-link::before {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 10px;
  }
  
  .logo-text {
    font-size: 24px;
    line-height: 20px;
  }
  
  .nav-links {
    padding: 15px;
  }
  
  .nav-link {
    padding: 12px 15px;
    font-size: 0.9rem;
  }
}
</style>
