<template>
  <header class="header">
    <button class="hamburger" :class="{ 'hamburger-dark': isComfortMattersPage }" @click="toggleMenu" ref="hamburgerEl">
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
      <div class="hamburger-line"></div>
    </button>
    

    
    <router-link to="/" class="logo" :class="{ 'logo-centered': isScrolled }">
      <span class="logo-text">KIDPATH</span>
    </router-link>

    <!-- Sliding Navigation Menu -->
    <div class="nav-overlay" :class="{ 'nav-open': menuOpen }" @click.self="closeMenu" @mousedown.self="closeMenu" @touchstart.self="closeMenu">
      <div class="nav-menu" @click.stop ref="menuEl">
        <button class="nav-close" @click="closeMenu">×</button>
        
      <div class="nav-logo">
          <div class="nav-logo-icon">🌱</div>
          <span class="nav-logo-text">KIDPATH</span>
      </div>
      
        <nav class="nav-links">
          <router-link to="/" class="nav-link" @click="handleNavigation">Home</router-link>
          <router-link to="/comfort-insights" class="nav-link" @click="handleNavigation">Weather Insights</router-link>
          <router-link to="/seasonal-comfort" class="nav-link" @click="handleNavigation">Seasonal Guide</router-link>
          <router-link to="/shade-quest" class="nav-link" @click="handleNavigation">Shade Quest</router-link>
          <router-link to="/nearby-fountains" class="nav-link" @click="handleNavigation">Nearby Amenities</router-link>
          <router-link to="/comfort-matters" class="nav-link" @click="handleNavigation">Comfort Matters</router-link>
          <router-link class="nav-link" to="/assistant">Assistant</router-link>
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
const menuEl = ref(null)
const hamburgerEl = ref(null)
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
  // 点击页面任意空白（非侧栏、非汉堡按钮）时关闭侧栏
  const onGlobalDown = (e) => {
    if (!menuOpen.value) return
    const target = e.target
    if (menuEl.value && menuEl.value.contains(target)) return
    if (hamburgerEl.value && hamburgerEl.value.contains(target)) return
    menuOpen.value = false
  }
  document.addEventListener('mousedown', onGlobalDown)
  document.addEventListener('touchstart', onGlobalDown, { passive: true })
  // 保存以便卸载
  window.__nav_onGlobalDown = onGlobalDown
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (window.__nav_onGlobalDown) {
    document.removeEventListener('mousedown', window.__nav_onGlobalDown)
    document.removeEventListener('touchstart', window.__nav_onGlobalDown)
    window.__nav_onGlobalDown = null
  }
})
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

:root{
  --header-h: 80px;           /* 统一头部高度 */
  --pad-x: clamp(16px, 4vw, 40px);
}

/* ============== HEADER（Sticky，不遮挡） ============== */
.header{
  position: sticky !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;

  height: var(--header-h);
  min-height: var(--header-h);
  padding: 0 var(--pad-x);

  /* 用网格居中：左(汉堡) | 中(logo) | 右(占位) */
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;

  background: rgba(255,255,255,0.68);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* ============== 汉堡按钮 ============== */
.hamburger{
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
  /* 关键：不再绝对定位 */
  position: relative;
  transform: none;
  left: auto; top: auto;
  z-index: 1;
}
.hamburger:hover{
  background: rgba(0,255,65,0.1);
  box-shadow: 0 0 15px rgba(0,255,65,0.3);
}
.hamburger-line{
  width: 20px; height: 2px;
  background: #00ff41; border-radius: 1px; transition: all .3s ease;
}
.hamburger:hover .hamburger-line{ background:#4ecdc4; }

/* ComfortMatters 页面白色汉堡 */
.hamburger-dark{
  background:#fff !important; border:2px solid #00ff41 !important;
}
.hamburger-dark .hamburger-line{ background:#00ff41 !important; }
.hamburger-dark:hover{ background:#f0f8ff !important; }
.hamburger-dark:hover .hamburger-line{ background:#00cc33 !important; }

/* ============== LOGO 居中（非绝对定位） ============== */
.logo{
  /* 关键：去绝对定位，用网格的中列自然居中 */
  position: relative;
  justify-self: center;
  align-self: center;
  transform: none;
  text-decoration: none;
  cursor: pointer;
  transition: transform .35s ease;
}
.logo-centered{ transform: scale(0.9); }

.logo-text{
  font-family: 'Segoe UI','Arial',sans-serif;
  font-size: 26px; font-weight: 700; letter-spacing: 1px;
  color: #2e7d32;
  background: linear-gradient(45deg, #b8d9b9, #cab8f0);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

/* ============== 侧滑导航 ============== */
.nav-overlay{
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(6px);
  z-index: 2000;
  opacity: 0; visibility: hidden; transition: all .3s ease;
}
.nav-overlay.nav-open{ opacity:1; visibility:visible; }

.nav-menu{
  position: absolute; top:0; left:0;
  width:300px; height:100vh; background:#fff;
  padding:28px 24px;
  transform: translateX(-100%); transition: transform .3s ease;
  display:flex; flex-direction:column; gap:24px;
  border-right:1px solid rgba(0,0,0,0.08);
  box-shadow:2px 0 12px rgba(0,0,0,0.06);
  font-family:'Segoe UI','Arial',sans-serif; color:#2e7d32;
}
.nav-overlay.nav-open .nav-menu{ transform: translateX(0); }

.nav-close{
  position: absolute; top:14px; right:14px;
  width:36px; height:36px; border-radius:10px;
  background:#fff; border:1px solid #e5e7eb; color:#2e7d32;
  font-size:20px; line-height:1; cursor:pointer;
  display:grid; place-items:center; transition:all .2s ease;
  font-family:'Segoe UI','Arial',sans-serif;
}
.nav-close:hover{ background:#f4f6f9; color:#5e35b1; box-shadow:0 4px 14px rgba(94,53,177,.12); }

.nav-logo{ display:flex; align-items:center; gap:12px; margin-top:8px; }
.nav-logo-icon{ font-size:22px; color:#2e7d32; }
.nav-logo-text{
  font-family:'Segoe UI','Arial',sans-serif; font-size:20px; font-weight:700;
  color:#2e7d32; letter-spacing:.5px; text-transform:uppercase;
}

.nav-links{ display:flex; flex-direction:column; gap:8px; }
.nav-link{
  font-family:'Segoe UI','Arial',sans-serif;
  font-size:1.05rem; font-weight:500; color:#333; text-decoration:none;
  padding:10px 12px; border-radius:10px; transition:all .2s ease; letter-spacing:.2px;
}
.nav-link:hover{ color:#5e35b1; background:rgba(94,53,177,0.06); transform:none; }
.nav-link::before{ content:none !important; }

.nav-contact{ margin-top:auto; padding-top:16px; border-top:1px solid rgba(0,0,0,0.06); }
.nav-contact-label{
  font-family:'Segoe UI','Arial',sans-serif; font-size:.9rem; color:#5e35b1; font-weight:600; letter-spacing:.2px;
}
.nav-contact-email{
  font-family:'Segoe UI','Arial',sans-serif; font-size:.95rem; color:#2e7d32; font-weight:600; letter-spacing:.2px;
}

/* 移动端：侧边栏最大宽度 */
@media (max-width: 768px){
  .nav-menu{ width:100%; max-width:350px; }
  .header{ grid-template-columns: 56px 1fr 0; } /* 右侧占位可收窄 */
}
</style>
