<template>
  <div class="parent-tips">
    <div class="tips-header">
      <h2>📚 Parent Tips: Why Comfort Matters</h2>
      <p class="tips-subtitle">Science-based guidance on children's vulnerability to heat, cold, and pollen</p>
    </div>

    <div class="tips-grid">
      <!-- Heat Vulnerability -->
      <div class="tip-card heat-card">
        <div class="card-header">
          <div class="card-icon">🌡️</div>
          <h3>Heat Vulnerability</h3>
        </div>
        <div class="card-content">
          <div class="science-fact">
            <strong>Science Fact:</strong> Children's bodies heat up 3-5x faster than adults because they have:
          </div>
          <ul class="fact-list">
            <li>Higher surface area to body mass ratio</li>
            <li>Less efficient sweating mechanisms</li>
            <li>Higher metabolic rates</li>
            <li>Thinner skin that absorbs more heat</li>
          </ul>
          <div class="practical-tips">
            <h4>Practical Tips:</h4>
            <ul>
              <li>Plan outdoor activities before 10 AM or after 4 PM</li>
              <li>Take breaks every 15-20 minutes in shade</li>
              <li>Dress in light, loose-fitting clothing</li>
              <li>Use hats with wide brims (not caps)</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Cold Vulnerability -->
      <div class="tip-card cold-card">
        <div class="card-header">
          <div class="card-icon">❄️</div>
          <h3>Cold Vulnerability</h3>
        </div>
        <div class="card-content">
          <div class="science-fact">
            <strong>Science Fact:</strong> Children lose body heat faster because they have:
          </div>
          <ul class="fact-list">
            <li>Larger head-to-body ratio (up to 20% heat loss)</li>
            <li>Less body fat for insulation</li>
            <li>Higher breathing rates</li>
            <li>Less developed shivering response</li>
          </ul>
          <div class="practical-tips">
            <h4>Practical Tips:</h4>
            <ul>
              <li>Layer clothing (base, insulating, outer shell)</li>
              <li>Keep head, hands, and feet warm</li>
              <li>Watch for signs of shivering or fatigue</li>
              <li>Limit time outdoors in extreme cold</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Pollen Sensitivity -->
      <div class="tip-card pollen-card">
        <div class="card-header">
          <div class="card-icon">🌸</div>
          <h3>Pollen Sensitivity</h3>
        </div>
        <div class="card-content">
          <div class="science-fact">
            <strong>Science Fact:</strong> Children are more sensitive to allergens because they have:
          </div>
          <ul class="fact-list">
            <li>Immature immune systems</li>
            <li>Smaller airways that swell more easily</li>
            <li>Higher breathing rates (more pollen inhaled)</li>
            <li>Less developed nasal filters</li>
          </ul>
          <div class="practical-tips">
            <h4>Practical Tips:</h4>
            <ul>
              <li>Check pollen counts before going out</li>
              <li>Choose routes with fewer flowering plants</li>
              <li>Wash hands and face after outdoor play</li>
              <li>Keep windows closed during high pollen times</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- UV Protection -->
      <div class="tip-card uv-card">
        <div class="card-header">
          <div class="card-icon">☀️</div>
          <h3>UV Protection</h3>
        </div>
        <div class="card-content">
          <div class="science-fact">
            <strong>Science Fact:</strong> Children's skin is more vulnerable to UV damage because:
          </div>
          <ul class="fact-list">
            <li>Thinner epidermis (outer skin layer)</li>
            <li>Less melanin production</li>
            <li>More time spent outdoors</li>
            <li>UV damage accumulates over lifetime</li>
          </ul>
          <div class="practical-tips">
            <h4>Practical Tips:</h4>
            <ul>
              <li>Use SPF 30+ sunscreen on all exposed skin</li>
              <li>Reapply every 2 hours or after swimming</li>
              <li>Seek shade during peak UV hours (10 AM - 4 PM)</li>
              <li>Wear UV-protective clothing and sunglasses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Reference Guide -->
    <div class="quick-reference">
      <h3>🚀 Quick Reference Guide</h3>
      <div class="reference-grid">
        <div class="reference-item">
          <div class="temp-indicator hot">🌡️ 30°C+</div>
          <div class="action">Seek shade, frequent breaks, extra hydration</div>
        </div>
        <div class="reference-item">
          <div class="temp-indicator moderate">🌡️ 20-30°C</div>
          <div class="action">Normal outdoor play with sun protection</div>
        </div>
        <div class="reference-item">
          <div class="temp-indicator cold">🌡️ Below 10°C</div>
          <div class="action">Layer up, limit time outdoors, watch for shivering</div>
        </div>
        <div class="reference-item">
          <div class="temp-indicator pollen">🌸 High Pollen</div>
          <div class="action">Choose indoor activities or low-pollen routes</div>
        </div>
      </div>
    </div>

    <!-- Safety Checklist -->
    <div class="safety-checklist">
      <h3>✅ Pre-Outdoor Safety Checklist</h3>
      <div class="checklist-grid">
        <div class="checklist-category">
          <h4>🌡️ Temperature Check</h4>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.temperature">
            <span>Checked current temperature and heat index</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.clothing">
            <span>Dressed appropriately for weather</span>
          </label>
        </div>
        
        <div class="checklist-category">
          <h4>☀️ Sun Protection</h4>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.sunscreen">
            <span>Applied SPF 30+ sunscreen</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.hat">
            <span>Wearing wide-brimmed hat</span>
          </label>
        </div>
        
        <div class="checklist-category">
          <h4>💧 Hydration</h4>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.water">
            <span>Packed water bottles</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.breaks">
            <span>Planned regular shade breaks</span>
          </label>
        </div>
        
        <div class="checklist-category">
          <h4>🌸 Allergies</h4>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.pollen">
            <span>Checked pollen count</span>
          </label>
          <label class="checklist-item">
            <input type="checkbox" v-model="checklist.medication">
            <span>Packed allergy medication if needed</span>
          </label>
        </div>
      </div>
      
      <div class="checklist-summary" v-if="completedItems > 0">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <p>{{ completedItems }}/{{ totalItems }} items completed ({{ Math.round(progressPercentage) }}%)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const checklist = ref({
  temperature: false,
  clothing: false,
  sunscreen: false,
  hat: false,
  water: false,
  breaks: false,
  pollen: false,
  medication: false
})

const completedItems = computed(() => {
  return Object.values(checklist.value).filter(Boolean).length
})

const totalItems = computed(() => {
  return Object.keys(checklist.value).length
})

const progressPercentage = computed(() => {
  return (completedItems.value / totalItems.value) * 100
})
</script>

<style scoped>
/* ========== KidPath base tokens ========== */
.parent-tips {
  --kp-green: #2e7d32;
  --kp-purple: #5e35b1;
  --kp-text: #2f3d4a;
  --kp-muted: #667085;
  --kp-border: rgba(0,0,0,.08);
  --kp-shadow: 0 10px 28px rgba(0,0,0,.12);
  --kp-shadow-hover: 0 16px 36px rgba(0,0,0,.16);
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI','Arial',sans-serif;
  color: var(--kp-text);
}

/* ========== Header ========== */
.tips-header {
  text-align: center;
  margin: 20px auto 40px;
  padding: 0 16px;
}

.tips-header h2 {
  font-weight: 800;
  font-size: clamp(22px, 3.2vw, 34px);
  color: var(--kp-green);
  letter-spacing: .3px;
  margin-bottom: 10px;
}

.tips-subtitle {
  font-size: 1.05rem;
  color: var(--kp-muted);
  max-width: 760px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ========== Card Grid ========== */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  margin: 28px 16px 50px;
}

.tip-card {
  background: #fff;
  border: 1px solid var(--kp-border);
  border-radius: 18px;
  padding: 22px 20px;
  box-shadow: var(--kp-shadow);
  transition: transform .18s ease, box-shadow .18s ease;
}

.tip-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--kp-shadow-hover);
}

/* ========== Card Header ========== */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.card-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg,#ede7f6,#f3e5f5);
  color: var(--kp-purple);
  box-shadow: 0 4px 12px rgba(94,53,177,.18);
  font-size: 22px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--kp-green);
  letter-spacing: .2px;
}

/* ========== Card Body ========== */
.science-fact {
  background: #f7f6ff;
  border: 1px solid rgba(94,53,177,.18);
  color: var(--kp-text);
  border-radius: 12px;
  padding: 14px 14px;
  margin: 8px 0 16px;
  line-height: 1.6;
}
.science-fact strong { color: var(--kp-purple); }

.fact-list {
  margin: 10px 0 6px;
  padding-left: 20px;
}
.fact-list li {
  margin: 6px 0;
  line-height: 1.6;
}

.practical-tips h4 {
  margin: 18px 0 8px;
  color: var(--kp-green);
  font-size: 1rem;
  font-weight: 700;
}
.practical-tips ul {
  margin: 0;
  padding-left: 20px;
}
.practical-tips li { margin: 6px 0; line-height: 1.6; }

/* ========== Quick Reference ========== */
.quick-reference {
  margin: 18px 16px 40px;
  padding: 26px 22px;
  background: linear-gradient(135deg,#edf6ed,#cfead3);
  border: 1px solid var(--kp-border);
  border-radius: 18px;
  box-shadow: var(--kp-shadow);
}

.quick-reference h3 {
  text-align: center;
  margin: 0 0 18px;
  color: var(--kp-green);
  font-size: 1.25rem;
  font-weight: 800;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.reference-item {
  background: #fff;
  border: 1px solid var(--kp-border);
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
}

.temp-indicator {
  display: inline-block;
  font-weight: 700;
  font-size: .95rem;
  padding: 6px 10px;
  border-radius: 999px;
  margin-bottom: 8px;
  background: #f6f7f9;
  color: var(--kp-text);
}
.temp-indicator.hot { background: #fff1f1; color: #d32f2f; }
.temp-indicator.moderate { background: #fff6e6; color: #f57c00; }
.temp-indicator.cold { background: #eef5ff; color: #1565c0; }
.temp-indicator.pollen { background: #fff0fa; color: #ad308e; }

.action { color: var(--kp-muted); line-height: 1.6; }

/* ========== Safety Checklist ========== */
.safety-checklist {
  margin: 0 16px 50px;
  padding: 26px 22px;
  background: #fff;
  border: 1px solid var(--kp-border);
  border-radius: 18px;
  box-shadow: var(--kp-shadow);
}

.safety-checklist h3 {
  text-align: center;
  margin: 0 0 18px;
  color: var(--kp-green);
  font-weight: 800;
  font-size: 1.25rem;
}

.checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 18px;
}

.checklist-category h4 {
  margin: 8px 0 10px;
  color: var(--kp-purple);
  font-size: 1rem;
  font-weight: 700;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  cursor: pointer;
}
.checklist-item input[type="checkbox"] {
  width: 18px; height: 18px;
  accent-color: var(--kp-purple);
}
.checklist-item span { color: var(--kp-text); }

/* Progress */
.checklist-summary {
  margin-top: 18px;
  text-align: center;
  color: var(--kp-muted);
}
.progress-bar {
  width: 100%;
  height: 12px;
  background: #eef2ff;
  border-radius: 999px;
  overflow: hidden;
  margin: 0 0 8px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--kp-purple), var(--kp-green));
  border-radius: 999px;
  transition: width .3s ease;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .tips-header h2 { font-size: 22px; }
  .tips-grid,
  .reference-grid,
  .checklist-grid { grid-template-columns: 1fr; }
  .tip-card { padding: 18px; }
  .card-icon { width: 38px; height: 38px; font-size: 20px; }
}
</style>
