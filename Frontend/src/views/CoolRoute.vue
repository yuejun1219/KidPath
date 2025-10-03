<template>
  <div class="cool-route-page">
    <CoolRoute
      v-if="ready"
      :showSidebar="showSidebar"
      @toggle-sidebar="showSidebar = !showSidebar"
      parksUrl="https://api.kidpath.me/api/v1/geojson/parks"
      treesUrl="https://api.kidpath.me/api/v1/geojson/trees"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CoolRoute from '@/components/CoolRoute.vue'

const ready = ref(false)
const showSidebar = ref(false) // Start with sidebar hidden, will be controlled by mobile toggle

onMounted(() => {
  // Delay to ensure smooth page transition
  setTimeout(() => {
    ready.value = true
  }, 500)
})
</script>

<style scoped>
/* —— 页面容器（保留你原来的高度/定位） —— */
.cool-route-page {
  height: calc(100vh - 100px);
  width: 100vw;
  overflow: hidden;
  background: #fff;
  box-sizing: border-box;
  position: fixed;
  top: 100px;
  left: 0;
  z-index: 1;
}
@media (max-width: 980px) {
  .cool-route-page { height: 100vh !important; top: 0 !important; z-index: 0 !important; }
}
.cool-route-page :deep(.cool-route-container),
.cool-route-page :deep(.map-container),
.cool-route-page :deep(.control-panel) {
  height: 100% !important; min-height: 100% !important;
}

/* —— 定义与首页一致的主色 & 字体 —— */
.cool-route-page {
  --kp-green: #2e7d32;      /* 首页主绿色 */
  --kp-purple: #5e35b1;     /* 首页辅紫色 */
  --kp-text: #333;
  --kp-muted: #555;
  --kp-border: rgba(0,0,0,.08);
}
.cool-route-page :deep(*) {
  font-family: 'Segoe UI', 'Arial', sans-serif !important;
  color: var(--kp-text);
  text-shadow: none !important;
  letter-spacing: .2px;
}

/* —— 标题（Cool Route / 小标题） —— */
.cool-route-page :deep(h1),
.cool-route-page :deep(.title),
.cool-route-page :deep(.page-title) {
  margin: 0 0 .75rem 0;
  font-weight: 700;
  line-height: 1.2;
  font-size: 2.25rem;
  background: linear-gradient(45deg, #b8d9b9, #cab8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.cool-route-page :deep(h2),
.cool-route-page :deep(h3) {
  color: var(--kp-green);
  font-weight: 700;
}

/* —— 段落/说明 —— */
.cool-route-page :deep(p),
.cool-route-page :deep(.muted),
.cool-route-page :deep(.description),
.cool-route-page :deep(label) {
  color: var(--kp-muted) !important;
  line-height: 1.65;
}

/* —— 徽章（BETA 等） —— */
.cool-route-page :deep(.badge),
.cool-route-page :deep(.beta),
.cool-route-page :deep([class*="badge"]) {
  padding: 6px 10px !important;
  border-radius: 10px !important;
  font-size: .78rem !important;
  font-weight: 700 !important;
  color: var(--kp-purple) !important;
  background: rgba(94,53,177,.10) !important;
  border: 1px solid rgba(94,53,177,.25) !important;
  box-shadow: none !important;
}

/* —— “像素按钮/荧光绿+黑影” 的总清除（按钮/Chip/LinkButton） —— */
.cool-route-page :deep(button),
.cool-route-page :deep(.btn),
.cool-route-page :deep([class*="btn"]),
.cool-route-page :deep(.chip),
.cool-route-page :deep([class*="chip"]),
.cool-route-page :deep(a.button),
.cool-route-page :deep([role="button"]) {
  border-radius: 14px !important;
  padding: 12px 18px !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  text-transform: none !important;
  letter-spacing: .2px !important;

  /* 去掉像素风重边、黑色投影、荧光绿描边 */
  border: 1px solid rgba(46,125,50,.55) !important;
  background: #fff !important;
  color: var(--kp-green) !important;
  box-shadow: none !important;
  filter: none !important;
  transform: none !important;
  outline: none !important;
  transition: all .2s ease !important;
}
.cool-route-page :deep(button:hover),
.cool-route-page :deep(.btn:hover),
.cool-route-page :deep([class*="btn"]:hover),
.cool-route-page :deep(.chip:hover) {
  background: #f4f6f9 !important;
  color: var(--kp-purple) !important;
  border-color: var(--kp-purple) !important;
  box-shadow: 0 6px 20px rgba(94,53,177,.12) !important;
}

/* —— 主要行动按钮（如 Set Start 高亮） —— */
.cool-route-page :deep(.primary),
.cool-route-page :deep(button.primary),
.cool-route-page :deep([data-variant="primary"]) {
  background: linear-gradient(135deg, #66bb6a, #43a047) !important;
  color: #fff !important;
  border-color: transparent !important;
}
.cool-route-page :deep(.primary:hover),
.cool-route-page :deep(button.primary:hover),
.cool-route-page :deep([data-variant="primary"]:hover) {
  filter: brightness(1.03) !important;
  box-shadow: 0 8px 24px rgba(67,160,71,.28) !important;
}

/* —— 预设按钮区域（FASTEST / BALANCED / MAX SHADE） —— */
.cool-route-page :deep(.presets button),
.cool-route-page :deep([class*="preset"] button) {
  background: #fff !important;
  border: 1px solid var(--kp-border) !important;
  color: var(--kp-green) !important;
}
.cool-route-page :deep(.presets button:hover) {
  border-color: var(--kp-purple) !important;
  color: var(--kp-purple) !important;
}

/* 帮助提示小圆点（绿色小方框 → 圆形小图标） */
.cool-route-page :deep(.help-dot),
.cool-route-page :deep(.hint) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 6px;
  border-radius: 50% !important;         /* 圆形 */
  background: #5e35b1 !important;        /* 紫色背景 */
  color: #fff !important;                /* 白色问号 */
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  cursor: pointer;
  transition: all 0.2s ease;
}
.cool-route-page :deep(.help-dot:hover),
.cool-route-page :deep(.hint:hover) {
  background: #7e57c2 !important;        /* hover 亮一点紫 */
  box-shadow: 0 4px 10px rgba(94,53,177,.25);
}

/* 滑块容器美化 */
.cool-route-page :deep(.field) {
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,.05);
}
.cool-route-page :deep(.field label),
.cool-route-page :deep(.label) {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2e7d32;
  margin-bottom: 8px;
  display: block;
  text-transform: none !important;   /* 避免全大写 */
  white-space: normal !important;    /* 避免截断 */
  line-height: 1.4;
}

/* 滑块条美化 */
.cool-route-page :deep(input[type="range"]) {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  outline: none;
}
.cool-route-page :deep(input[type="range"]::-webkit-slider-thumb) {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #5e35b1;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
  cursor: pointer;
}
.cool-route-page :deep(input[type="range"]::-moz-range-thumb) {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #5e35b1;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
  cursor: pointer;
}

/* 选项 Chip 美化（Parks / Street Trees） */
.cool-route-page :deep(.chip),
.cool-route-page :deep(.option-btn) {
  border-radius: 10px;
  border: 1px solid #2e7d32;
  background: #fff;
  color: #2e7d32;
  font-weight: 600;
  padding: 8px 14px;
  margin: 4px;
  transition: all 0.2s ease;
}
.cool-route-page :deep(.chip:hover),
.cool-route-page :deep(.option-btn:hover) {
  background: rgba(94,53,177,.06);
  border-color: #5e35b1;
  color: #5e35b1;
}
.cool-route-page :deep(.chip.active),
.cool-route-page :deep(.option-btn.active) {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32;
}

/* Address Search 输入框/按钮 */
.cool-route-page :deep(.search),
.cool-route-page :deep(input[type="text"]),
.cool-route-page :deep(.search-btn) {
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.1);
  padding: 12px 16px;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  transition: all 0.2s ease;
}
.cool-route-page :deep(.search:focus),
.cool-route-page :deep(input[type="text"]:focus) {
  border-color: #5e35b1;
  box-shadow: 0 0 0 3px rgba(94,53,177,.2);
}

/* 底部提示卡片（把像素风条形框换成首页风格卡片） */
.cool-route-page :deep(.hint) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #f9fafb !important;                 /* 浅灰背景 */
  border: 1px solid rgba(0,0,0,.08) !important;   /* 淡灰边框 */
  border-radius: 12px !important;                 /* 圆角 */
  padding: 10px 14px !important;
  margin: 14px auto 0 !important;
  font-family: 'Segoe UI', 'Arial', sans-serif !important;
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  color: #444 !important;
  box-shadow: 0 2px 6px rgba(0,0,0,.06) !important;
  width: fit-content !important;
  line-height: 1.4 !important;
  /* 避免被旧样式定位或覆盖 */
  position: relative !important;
  inset: auto !important;
  transform: none !important;
  text-shadow: none !important;
}

/* 旧像素风可能用伪元素做的背景/描边——直接禁用 */
.cool-route-page :deep(.hint::before),
.cool-route-page :deep(.hint::after) {
  content: none !important;
}

/* “START” 绿色强调，和首页一致 */
.cool-route-page :deep(.hint strong) {
  all: unset;                        /* 清理旧样式 */
  font-weight: 700 !important;
  color: #2e7d32 !important;
  margin-left: 4px !important;
}

/* 悬停轻微浮起（可要可不要） */
.cool-route-page :deep(.hint:hover) {
  box-shadow: 0 6px 18px rgba(94,53,177,.12) !important;
}

/* 有些实现会加一个颜色圆点叠在文字左侧，这里统一移除 */
.cool-route-page :deep(.hint .dot),
.cool-route-page :deep(.hint .badge),
.cool-route-page :deep(.hint .pill) {
  display: none !important;
}

/* 结果面板整体 */
.cool-route-page :deep(.results-panel) {
  background: #fff !important;
  border-left: 1px solid rgba(0,0,0,.08);
  box-shadow: -2px 0 10px rgba(0,0,0,.05);
  padding: 20px;
  overflow-y: auto;
}

/* 路线卡片中的文字整体调大 */
.cool-route-page :deep(.route-item) {
  font-size: 1rem; /* 默认文字调大 */
}

/* 标题（COOLEST / ALTERNATIVE） */
.cool-route-page :deep(.route-item .title),
.cool-route-page :deep(.route-item h4) {
  font-size: 1.35rem !important; /* 再大一些 */
  font-weight: 700;
}

/* 路线详情（公里数 + 时间） */
.cool-route-page :deep(.route-item .details),
.cool-route-page :deep(.route-item span),
.cool-route-page :deep(.route-item p) {
  font-size: 1.05rem !important;
  font-weight: 500;
  color: #333;
}

/* COOL 百分比（右上角） */
.cool-route-page :deep(.route-item .coolness) {
  font-size: 1.1rem !important;
  font-weight: 600;
  color: #2e7d32;
}

/* Google Maps 按钮 */
.cool-route-page :deep(.route-item button),
.cool-route-page :deep(.route-item .btn) {
  display: block;
  width: 100%;
  text-align: center;
  border-radius: 10px;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  background: #fff;
  color: #2e7d32;
  border: 2px solid #2e7d32;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cool-route-page :deep(.route-item button:hover),
.cool-route-page :deep(.route-item .btn:hover) {
  background: linear-gradient(135deg, #5e35b1, #7e57c2);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(94,53,177,.2);
}


</style>

