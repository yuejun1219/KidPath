<template>
  <div class="comfort-matters-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Why Comfort Matters for Young Kids
        </h1>
        <p class="hero-subtitle">
          Science-based tips, quizzes, and interactive tools to keep your family safe and comfortable outdoors
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">3x</span>
            <span class="stat-label">More vulnerable to heat</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">5x</span>
            <span class="stat-label">Faster dehydration</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">2x</span>
            <span class="stat-label">Higher sunburn risk</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Navigation Cards -->
    <section class="navigation-section">
      <div class="container">
        <h2 class="section-title">Learn & Protect Your Family</h2>
        <div class="nav-cards">
          <div class="nav-card" @click="activeComponent = 'ParentTips'">
            <div class="card-icon">📚</div>
            <h3>Parent Tips</h3>
            <p>Science-based guidance on children's vulnerability to heat, cold, and pollen</p>
          </div>
          
          <div class="nav-card" @click="activeComponent = 'HeatSafetyQuiz'">
            <div class="card-icon">🧠</div>
            <h3>Heat Safety Quiz</h3>
            <p>Test your knowledge and identify safety blind spots for summer outings</p>
          </div>
          
          <div class="nav-card" @click="activeComponent = 'EarlySigns'">
            <div class="card-icon">⚠️</div>
            <h3>Early Warning Signs</h3>
            <p>Learn to recognize heatstroke, sunburn, and exhaustion symptoms</p>
          </div>
          
          <div class="nav-card" @click="activeComponent = 'ComfortEducationChat'">
            <div class="card-icon">🤖</div>
            <h3>AI Comfort Assistant</h3>
            <p>Get instant answers to comfort and safety questions</p>
            <div class="card-badge">AI Powered</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal Overlay -->
    <div v-if="activeComponent" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <button @click="closeModal" class="modal-close-btn">
            ✕
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Conditional Component Rendering -->
          <ParentTips v-if="activeComponent === 'ParentTips'" />
          <HeatSafetyQuiz v-if="activeComponent === 'HeatSafetyQuiz'" />
          <EarlySigns v-if="activeComponent === 'EarlySigns'" />
          <ComfortEducationChat v-if="activeComponent === 'ComfortEducationChat'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ParentTips from '@/components/ParentTips.vue'
import HeatSafetyQuiz from '@/components/HeatSafetyQuiz.vue'
import EarlySigns from '@/components/EarlySigns.vue'
import ComfortEducationChat from '@/components/ComfortEducationChat.vue'

const activeComponent = ref(null)

function closeModal() {
  activeComponent.value = null
}
</script>

<style scoped>
.comfort-matters-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 50%, #ddeeff 100%);
}

/* Make navbar hamburger visible over green hero section */

.hero-section {
  padding: 120px 20px 80px;
  text-align: center;
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 50%, #009922 100%);
  color: white;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-shadow: 3px 3px 0 #000;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 0 #000;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 8px;
}

.navigation-section {
  padding: 80px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 60px;
  color: #333;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.nav-card {
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 5px 5px 0 #000;
  position: relative;
}

.nav-card:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 #000;
  background: #f0f8ff;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.nav-card h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  margin-bottom: 15px;
  color: #333;
}

.nav-card p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
}

.card-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #00ff41;
  color: #000;
  padding: 5px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 #000;
}

.content-section {
  padding: 40px 20px 80px;
  background: white;
}

.content-header {
  margin-bottom: 40px;
}

.back-btn {
  background: #00ff41;
  color: #000;
  border: 3px solid #000;
  padding: 12px 24px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
  transition: all 0.1s;
}

.back-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #000;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 10px 10px 0 #000;
  max-width: 95vw;
  max-height: 95vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: #00ff41;
  border-bottom: 3px solid #000;
}

.modal-close-btn {
  background: #ff4444;
  color: white;
  border: 2px solid #000;
  width: 40px;
  height: 40px;
  border-radius: 0;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 #000;
  transition: all 0.1s;
}

.modal-close-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #000;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.8rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 30px;
  }
  
  .nav-cards {
    grid-template-columns: 1fr;
  }
  
  .nav-card {
    padding: 20px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-width: 100vw;
    max-height: 100vh;
  }
}
</style>
