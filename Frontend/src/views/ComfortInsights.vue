<template>
  <div class="comfort-insights-page">
    <NavBar />
    <div class="content">
      <h1>Data Insights</h1>
      <p>Page For Data Visualization!</p>

      <section class="viz">
        <Canopy3DMap />
      </section>
    </div>
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue'
import Canopy3DMap from '../components/Canopy3DMap.vue'
</script>

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
  margin-bottom: 20px;
}

.viz {
  margin-top: 14px;
}
</style>
