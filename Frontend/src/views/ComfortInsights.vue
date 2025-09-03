<script setup>
import { ref } from 'vue'

import Canopy3DMap from '../components/Canopy3DMap.vue'
import WaterAccess from '../components/WaterAccess.vue'
import NearbyFountains from '../components/NearbyFountains.vue'
import RainfallInsights from '../components/RainfallInsights.vue'  // ⬅️ new
import WindInsights from '../components/WindInsights.vue'          // ⬅️ new

// tabs: 'canopy' | 'water' | 'nearby' | 'rainfall' | 'wind'
const tab = ref('canopy')

// Point these at your data files.
// If your CSVs are in /src/data/, this resolves at build time:
const rainfallCsvUrl = new URL('https://weather-data-kidpath.s3.ap-southeast-2.amazonaws.com/Rainfall_Data_2014-2025(July).csv', import.meta.url).href
const windCsvUrl      = new URL('https://weather-data-kidpath.s3.ap-southeast-2.amazonaws.com/Wind_Data.csv', import.meta.url).href
// If you host via /public/data/, replace with:
// const rainfallCsvUrl = '/data/Rainfall_Data_2014-2025(July).csv'
// const windCsvUrl     = '/data/Wind_Data.csv'
</script>

<template>
  <div class="comfort-insights-page">
    <div class="content">
      <h1>Data Insights</h1>
      <p>Page For Data Visualization!</p>

      <div class="tabs">
        <button class="tab" :class="{ active: tab==='canopy' }"    @click="tab='canopy'">🌳 Tree Canopy</button>
        <button class="tab" :class="{ active: tab==='water' }"     @click="tab='water'">🚰 Water Access</button>
        <button class="tab" :class="{ active: tab==='nearby' }"    @click="tab='nearby'">📍 Nearby</button>
        <button class="tab" :class="{ active: tab==='rainfall' }"  @click="tab='rainfall'">🌧️ Rainfall</button>
        <button class="tab" :class="{ active: tab==='wind' }"      @click="tab='wind'">🌬️ Wind</button>
      </div>

      <section class="viz">
        <keep-alive>
          <Canopy3DMap v-if="tab==='canopy'" />
          <WaterAccess   v-else-if="tab==='water'" />
          <NearbyFountains v-else-if="tab==='nearby'" />
          <RainfallInsights
            v-else-if="tab==='rainfall'"
            :csv-url="rainfallCsvUrl"
            :default-years-window="10"
          />
          <WindInsights
            v-else
            :csv-url="windCsvUrl"
            :default-years-window="10"
            default-metric="windspeed"
          />
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
