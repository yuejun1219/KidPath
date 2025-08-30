<template>
  <div class="comfort-insights-page">
    <div class="content">
      <h1>Data Insights</h1>
      <p>Page For Data Visualization!</p>
    </div>
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue'
</script>

<style scoped>
.comfort-insights-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8faf8 0%, #e8f5e8 100%);
}

.content {
  padding: 100px 20px 40px;
  text-align: center;
}

.content h1 {
  font-size: 2.5rem;
  color: #2e7d32;
  margin-bottom: 20px;
  font-family: 'Segoe UI', sans-serif;
}

.content p {
  font-size: 1.2rem;
  color: #666;
  font-family: 'Segoe UI', sans-serif;
}
</style>
