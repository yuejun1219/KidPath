<!-- src/views/NearbyFountainsPage.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import NearbyFountains from '@/components/NearbyFountains.vue'
import KidPathChat from '@/components/KidPathChat.vue'


/* 设施类型：与组件内保持一致的 key 集合 */
const amenityTypes = [
  { key: 'fountain', name: 'Fountains', icon: '🚰' },
  { key: 'toilet', name: 'Toilets', icon: '🚽' },
  { key: 'playground', name: 'Playgrounds', icon: '🛝' },
  { key: 'library', name: 'Libraries', icon: '📚' },
  { key: 'community_centre', name: 'Community Centers', icon: '🏛️' }
]

/* 当前选择（驱动子组件） */
const amenityKey = ref('fountain')

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

</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="title">Find Nearby Amenities</h1>
      <p class="intro">
        Set a center (your location, map center, or click the map) and find selected amenities within your chosen radius.
      </p>
    </header>

    <!-- 独立筛选工具条 -->
    <div class="amenity-filter-toolbar" role="toolbar" aria-label="Amenity filters">
      <div class="filter-title">Filter by:</div>
      <div class="amenity-type-buttons">
        <button
          v-for="type in amenityTypes"
          :key="type.key"
          :class="['type-btn', { active: amenityKey === type.key }]"
          @click="amenityKey = type.key"
        >
          <span class="icon">{{ type.icon }}</span>
          <span class="text">{{ type.name }}</span>
        </button>
      </div>
    </div>

    <!-- 地图组件：只做内容（不带标题/筛选 UI），由 amenityKey 驱动 -->
    <section class="fountains-card">
      <NearbyFountains :amenity-key="amenityKey" />
    </section>

    <KidPathChat class="ask-ai"
      title="Ask-AI · Comfort Insights"
      placeholder="Ask about shade, UV, water taps…"
/>

  </div>
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
  line-height: 1.2;
  color: #1B5E20;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 700;
}
.intro{
  margin: 0;
  color: #394e42;
  font-size: clamp(14px, 1.2vw, 16px);
  line-height: 1.55;
}

/* 独立筛选工具条（与组件无关） */
.amenity-filter-toolbar{
  max-width: 1140px;
  margin: 10px auto 18px;
  background:#fff;
  padding:12px 16px;
  border-radius:12px;
  box-shadow:0 4px 8px rgba(0,0,0,.08);
  display:flex; align-items:center; gap:12px;
}
.filter-title{
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px; 
  color: #666; 
  white-space: nowrap;
  font-weight: 500;
}
.amenity-type-buttons{ 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px; 
}
.type-btn{
  display: flex; 
  align-items: center; 
  gap: 6px;
  padding: 8px 16px; 
  border: 1px solid #e1e5e9; 
  background: #fff; 
  border-radius: 8px;
  cursor: pointer; 
  transition: all 0.2s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  font-size: 14px; 
  white-space: nowrap;
  font-weight: 500;
}
.type-btn:hover{ 
  border-color: #2c5530; 
  transform: translateY(-1px); 
  box-shadow: 0 4px 12px rgba(44, 85, 48, 0.15); 
}
.type-btn.active{ 
  background: #2c5530; 
  border-color: #2c5530; 
  color: #fff; 
  font-weight: 600; 
}
.type-btn .icon{ 
  font-size: 16px; 
}
.type-btn .text{ 
  font-size: 14px; 
}

.fountains-card{
  max-width: 1140px;
  margin: 0 auto;
  border-radius:18px;
  box-shadow: 0 18px 40px rgba(0,0,0,.10), 0 6px 14px rgba(0,0,0,.06);
  padding:10px;
}
.fountains-card :deep(.map-wrap){
  height: 70vh !important;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
}
@media (max-width: 1200px){
  .fountains-card :deep(.map-wrap){ height: 60vh !important; }
}

/* Ask AI 小挂件 */
.ask-ai{ display:block; max-width:1140px; margin:18px auto 0; }
</style>
