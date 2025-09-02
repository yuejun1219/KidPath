<script setup>
import { ref } from 'vue'

import Canopy3DMap from '../components/Canopy3DMap.vue'
import WaterAccess from '../components/WaterAccess.vue'
import NearbyFountains from '../components/NearbyFountains.vue'  // ⬅️ new
const tab = ref('canopy') // 'canopy' | 'water' | 'nearby'
</script>

<template>
  <div class="comfort-insights-page">

    <div class="content">
      <h1>Data Insights</h1>
      <p>Page For Data Visualization!</p>

      <div class="tabs">
        <button class="tab" :class="{ active: tab==='canopy' }" @click="tab='canopy'">🌳 Tree Canopy</button>
        <button class="tab" :class="{ active: tab==='water' }"  @click="tab='water'">🚰 Water Access</button>
        <button class="tab" :class="{ active: tab==='nearby' }" @click="tab='nearby'">📍 Nearby</button>
      </div>

      <section class="viz">
        <keep-alive>
          <Canopy3DMap v-if="tab==='canopy'" />
          <WaterAccess v-else-if="tab==='water'" />
          <NearbyFountains v-else />
        </keep-alive>
      </section>
    </div>
  </div>
</template>




<style scoped>
.comfort-insights-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8faf8 0%, #e8f5e8 100%);
}

.content {
  padding: 100px 20px 60px;
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.content h1 {
  font-size: 2.5rem;
  color: #2e7d32;
  margin-bottom: 8px;
  font-family: 'Segoe UI', sans-serif;
}

.content p {
  font-size: 1.1rem;
  color: #666;
  font-family: 'Segoe UI', sans-serif;
  margin-bottom: 16px;
}

/* Tabs */
.tabs {
  display: inline-flex;
  gap: 8px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 999px;
  padding: 6px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  margin: 8px 0 6px;
}

.tab {
  border: none;
  background: transparent;
  padding: 8px 14px;
  font-size: .95rem;
  color: #2e7d32;
  border-radius: 999px;
  cursor: pointer;
}
.tab:hover { background: #e8f5e9; }
.tab.active { background: #2e7d32; color: #fff; }

.viz { margin-top: 14px; }
</style>
