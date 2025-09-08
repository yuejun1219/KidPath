<template>
  <div class="cool-route-page">
    <CoolRoute
      v-if="ready"
      :showSidebar="showSidebar"
      @toggle-sidebar="showSidebar = !showSidebar"
      parksUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/parks.geojson"
      treesUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/trees.geojson"
      grassUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/grass.geojson"
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
.cool-route-page {
  height: calc(100vh - 100px);
  width: 100vw;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #ffffff 100%);
  box-sizing: border-box;
  position: fixed;
  top: 100px;
  left: 0;
  z-index: 1;
}

/* Mobile: Allow full screen coverage */
@media (max-width: 980px) {
  .cool-route-page {
    height: 100vh !important;
    top: 0 !important;
    z-index: 0 !important;
  }
}

.cool-route-page :deep(.cool-route-container) {
  height: 100% !important;
  min-height: 100% !important;
}

.cool-route-page :deep(.map-container) {
  height: 100% !important;
  min-height: 100% !important;
}

.cool-route-page :deep(.control-panel) {
  height: 100% !important;
  min-height: 100% !important;
}
</style>
