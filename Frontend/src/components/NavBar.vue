<template>
  <header class="header">
    <button class="hamburger" :class="{ 'hamburger-dark': isComfortMattersPage }" @click="toggleMenu">
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
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
          <router-link to="/" class="nav-link" @click="handleNavigation">Home</router-link>
          <router-link to="/comfort-insights" class="nav-link" @click="handleNavigation">Weather Insights</router-link>
          <router-link to="/seasonal-comfort" class="nav-link" @click="handleNavigation">Seasonal Guide</router-link>
          <router-link to="/shade-quest" class="nav-link" @click="handleNavigation">🌳 Shade Quest</router-link>
          <router-link to="/comfort-matters" class="nav-link" @click="handleNavigation">📚 Comfort Matters</router-link>
          <router-link to="/about" class="nav-link" @click="handleNavigation">About</router-link>
        </nav>
        
        <div class="nav-contact">
          <div class="nav-contact-label">SAY HELLO</div>
          <div class="nav-contact-email">hello@kidpath.com</div>
        </div>
      </div>
    </div>


  </header>
</template>
<!-- Navbar functionality -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const isScrolled = ref(false)


// Check if we're on the ComfortMatters page
const isComfortMattersPage = computed(() => {
  return route.path === '/comfort-matters'
})



const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

const handleNavigation = (event) => {
  // Get the href from the router-link
  const href = event.target.closest('a').getAttribute('href')
  
  // Navigate programmatically to ensure it works
  if (href) {
    router.push(href)
  }
  
  // Add a small delay to allow navigation to complete before closing menu
  setTimeout(() => {
    menuOpen.value = false
  }, 150)
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
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px 20px 40px;
  background: transparent;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-height: 80px;
  width: 100%;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
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

/* White hamburger for ComfortMatters page */
.hamburger-dark {
  background: #fff !important;
  border: 2px solid #00ff41 !important;
}

.hamburger-dark .hamburger-line {
  background: #00ff41 !important;
}

.hamburger-dark:hover {
  background: #f0f8ff !important;
}

.hamburger-dark:hover .hamburger-line {
  background: #00cc33 !important;
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
  font-family: 'Segoe UI', 'Arial', sans-serif;  /* ✅ 改字体 */
  font-size: 26px;
  font-weight: 700;
  color: #2e7d32;
  letter-spacing: 1px;
  background: linear-gradient(45deg, #b8d9b9, #cab8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;  /* 去掉像素风阴影 */
}

/* .logo-text::before {
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
} */


/* Navigation Menu */
.nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.nav-overlay.nav-open {
  opacity: 1;
  visibility: visible;
}

/* 侧边栏容器 */
.nav-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background: #ffffff;
  padding: 28px 24px;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.06);
  font-family: 'Segoe UI', 'Arial', sans-serif; /* 关键：换字体 */
  color: #2e7d32; /* 主色与首页一致 */
}

.nav-overlay.nav-open .nav-menu {
  transform: translateX(0);
}

/* 关闭按钮 */
.nav-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #2e7d32;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
  font-family: 'Segoe UI', 'Arial', sans-serif;
}

.nav-close:hover {
  background: #f4f6f9;
  color: #5e35b1; /* 紫色 hover 色 */
  box-shadow: 0 4px 14px rgba(94, 53, 177, 0.12);
}

/* 顶部 LOGO */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.nav-logo-icon {
  font-size: 22px;
  color: #2e7d32;
  background: none;
  -webkit-text-fill-color: initial;
}

.nav-logo-text {
  font-family: 'Segoe UI', 'Arial', sans-serif;    /* 关键：换字体 */
  font-size: 20px;
  font-weight: 700;
  color: #2e7d32;
  letter-spacing: .5px;
  text-transform: uppercase;
  text-shadow: none;
  background: none;
  -webkit-text-fill-color: initial;
}

/* 导航链接 */
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  font-family: 'Segoe UI', 'Arial', sans-serif;    /* 关键：换字体 */
  font-size: 1.05rem;
  font-weight: 500;
  color: #333;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.2s ease;
  letter-spacing: .2px;
  position: relative;
}

/* 覆盖像素风的渐变描边/位移效果 */
.nav-link:hover {
  color: #5e35b1;
  background: rgba(94, 53, 177, 0.06);
  transform: none;
}

/* 去掉左侧那条像素风下划线动画 */
.nav-link::before {
  content: none !important;
}

/* 联系方式 */
.nav-contact {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.nav-contact-label {
  font-family: 'Segoe UI', 'Arial', sans-serif;
  font-size: 0.9rem;
  color: #5e35b1;
  font-weight: 600;
  letter-spacing: 0.2px;
  margin-bottom: 6px;
}

.nav-contact-email {
  font-family: 'Segoe UI', 'Arial', sans-serif;
  font-size: 0.95rem;
  color: #2e7d32;
  font-weight: 600;
  letter-spacing: 0.2px;
}

/* 移动端宽度 */
@media (max-width: 768px) {
  .nav-menu {
    width: 100%;
    max-width: 350px;
  }
}
</style>