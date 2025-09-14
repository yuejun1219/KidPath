<template>
  <div class="comfort-matters-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-overlay">
        <div class="hero-inner">
          <h1 class="hero-title">Why Comfort Matters for Young Kids</h1>
          <p class="hero-subtitle">
            Science-based tips, quizzes, and interactive tools to keep your family safe and comfortable outdoors
          </p>

          <div class="hero-stats">
            <div class="stat">
              <span class="stat-number">3x</span>
              <span class="stat-label">More vulnerable to heat</span>
            </div>
            <div class="stat">
              <span class="stat-number">5x</span>
              <span class="stat-label">Faster dehydration</span>
            </div>
            <div class="stat">
              <span class="stat-number">2x</span>
              <span class="stat-label">Higher sunburn risk</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Navigation Cards -->
    <section class="navigation">
      <div class="container">
        <h2 class="section-title">Learn & Protect Your Family</h2>

        <div class="nav-cards">
          <button class="nav-card" @click="activeComponent = 'ParentTips'">
            <div class="card-icon">📚</div>
            <h3>Parent Tips</h3>
            <p>Science-based guidance on children's vulnerability to heat, cold, and pollen</p>
          </button>

          <button class="nav-card" @click="activeComponent = 'HeatSafetyQuiz'">
            <div class="card-icon">🧠</div>
            <h3>Heat Safety Quiz</h3>
            <p>Test your knowledge and identify safety blind spots for summer outings</p>
          </button>

          <button class="nav-card" @click="activeComponent = 'EarlySigns'">
            <div class="card-icon">⚠️</div>
            <h3>Early Warning Signs</h3>
            <p>Learn to recognize heatstroke, sunburn, and exhaustion symptoms</p>
          </button>

          <button class="nav-card" @click="activeComponent = 'ComfortEducationChat'">
            <div class="card-icon">💡</div>
            <h3>Frequently Asked Questions</h3>
            <p>Get instant answers to comfort and safety questions</p>
          </button>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="activeComponent" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
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
const closeModal = () => (activeComponent.value = null)
</script>

<style scoped>
/* ====== 基础变量：与首页一致 ====== */
:root {
  --kp-green: #2e7d32;
  --kp-green-weak: #e8f5e9;
  --kp-purple: #5e35b1;
  --kp-purple-weak: #ede7f6;
  --kp-text: #2b2b2b;
  --kp-muted: #6b7280;
  --kp-card-bg: #ffffff;
  --kp-shadow: 0 8px 30px rgba(0,0,0,.08);
  --kp-shadow-strong: 0 15px 40px rgba(0,0,0,.15);
  --kp-radius-lg: 20px;
  --kp-radius-md: 16px;
  --kp-radius-sm: 12px;
}

.comfort-matters-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8faf8 0%, #e8f5e8 100%);
  color: var(--kp-text);
  font-family: 'Segoe UI','Arial',sans-serif;
}

/* ====== Hero（同首页：大图+覆盖层+柔光） ====== */
.hero {
  position: relative;
  min-height: 520px;
  background: url('../images/tree-bg.png') center/cover no-repeat;
  display: grid;
  place-items: center;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.35);
}

.hero-overlay {
  position: relative;
  z-index: 1;
  width: 100%;
  display: grid;
  place-items: center;
  padding: 80px 20px;
}

.hero-inner {
  max-width: 1100px;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: .2px;
  margin: 0 0 16px;
  color: #8efaf7;                  
  text-shadow: 1px 1px 3px rgba(0,0,0,.5);
}

.hero-subtitle {
  color: #fff;
  font-size: 1.15rem;
  line-height: 1.7;
  max-width: 850px;
  margin: 0 auto 28px;
  text-shadow: 1px 1px 2px rgba(0,0,0,.6);
}

/* Stats 卡片优化 */
.hero-stats {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  justify-content: center;
}

.stat {
  background: rgba(255, 255, 255, 0.9); 
  backdrop-filter: blur(10px);          
  border-radius: 16px;                 
  padding: 24px 30px;
  min-width: 200px;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); 
}

.stat-number {
  display: block;
  font-weight: 800;
  font-size: 2.2rem;
  color: #5e35b1;
  margin-bottom: 6px;
}

.stat-label {
  color: #2e7d32;
  font-size: 1rem;
  font-weight: 500;
}


/* ====== 通用容器/标题（同首页） ====== */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--kp-green);
  text-align: center;
  margin: 60px 0 30px;
}

/* ====== 导航卡片 ====== */
.navigation {
  padding: 60px 0 90px;
  position: relative;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.nav-card {
  border: 1px solid rgba(0,0,0,.08);
  background: var(--kp-card-bg);
  border-radius: var(--kp-radius-lg);
  padding: 28px 22px;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--kp-shadow);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  position: relative;
  color: var(--kp-text);
}

.nav-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--kp-shadow-strong);
  border-color: rgba(94,53,177,.25);
}

.card-icon {
  font-size: 2.4rem;
  margin-bottom: 12px;
}

.nav-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--kp-green);
  margin: 6px 0 8px;
}

.nav-card p {
  font-size: .98rem;
  line-height: 1.6;
  color: var(--kp-muted);
}

/* ====== Modal ====== */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
  padding: 16px;
}

.modal {
  width: min(980px, 96vw);
  max-height: 92vh;
  background: #fff;
  border-radius: var(--kp-radius-lg);
  box-shadow: var(--kp-shadow-strong);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: flex-end;
  padding: 12px 12px 0 0;
}

.modal-close {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
  color: var(--kp-purple);
  border-radius: 12px;
  font-size: 22px;
  line-height: 1;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all .2s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
}

.modal-close:hover {
  transform: translateY(-1px);
  background: #f7f7fb;
  box-shadow: 0 10px 24px rgba(0,0,0,.12);
}

.modal-body {
  padding: 10px 16px 18px;
  overflow: auto;
}

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .hero-title { font-size: 2.2rem; }
  .hero-subtitle { font-size: 1rem; }
  .stat { min-width: 180px; }
  .section-title { font-size: 1.8rem; margin-bottom: 24px; }
  .nav-card { padding: 22px 18px; }
}
</style>