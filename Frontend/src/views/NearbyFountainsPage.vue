<!-- src/views/NearbyFountainsPage.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import NearbyFountains from '@/components/NearbyFountains.vue'
import AskAiWidget from '@/components/AskAiWidget.vue'

/* 让地图在首帧后再挂载，避免尺寸测量出错 */
const ready = ref(false)
function nudgeResize(times = 2){
  let i = 0
  const tick = () => {
    window.dispatchEvent(new Event('resize'))
    if (++i < times) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
const onPageShow = () => nudgeResize(2)
const onVisChange = () => { if (document.visibilityState === 'visible') nudgeResize(2) }

onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    ready.value = true
    nudgeResize(2)
  })
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVisChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('pageshow', onPageShow)
  document.removeEventListener('visibilitychange', onVisChange)
})

/* AI 悬浮按钮用的 API 基址 */
const API_BASE = import.meta.env.VITE_API_BASE
</script>

<template>
  <main class="page">
    <header class="page-header">
      <h1 class="title">Nearby Drinking Fountains</h1>
      <p class="subtitle">
        Set a center (your location, map center, or click the map) and find drinking fountains within your chosen radius.
      </p>
    </header>

    <section class="content card fountains-card">
      <NearbyFountains v-if="ready" />
    </section>

    <!-- 右下角 AI -->
    <AskAiWidget
      :api-base="API_BASE"
      placement="bottom-right"
      title="Ask-AI · Water Nearby"
      placeholder="Ask about taps, refill spots, parks…"
    />
  </main>
</template>

<style scoped>
.page{
  min-height:100vh;
  background: linear-gradient(180deg, #f2fbf4 0%, #e8f6ec 100%);
  padding: 16px clamp(16px, 4vw, 28px) 28px;
}
.page-header{
  max-width: 1140px;
  margin: 0 auto 10px;
  padding: 10px 4px;
}
.title{
  margin: 0 0 6px;
  font-size: clamp(24px, 3.2vw, 32px);
  color: #1b5e20;
  font-weight: 900;
  letter-spacing: -.01em;
}
.subtitle{
  margin: 0;
  color:#4a5f52;
}
.content.card{
  max-width:1140px;
  margin: 12px auto 0;
  background:#fff;
  border:1px solid rgba(0,0,0,.06);
  border-radius:18px;
  box-shadow: 0 18px 40px rgba(0,0,0,.10), 0 6px 14px rgba(0,0,0,.06);
  padding:10px;
}
.fountains-card :deep(.map-wrap){
  height: 70vh !important;   /* 页面独立版给更高的可视高度 */
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
}
@media (max-width: 1200px){
  .fountains-card :deep(.map-wrap){ height: 60vh !important; }
}
</style>
