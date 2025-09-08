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
.parent-tips {
  max-width: 1200px;
  margin: 0 auto;
}

.tips-header {
  text-align: center;
  margin-bottom: 40px;
}

.tips-header h2 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
}

.tips-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.tip-card {
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 25px;
  box-shadow: 5px 5px 0 #000;
  transition: all 0.3s ease;
}

.tip-card:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 #000;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.card-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.card-header h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.science-fact {
  background: #f0f8ff;
  padding: 15px;
  border: 2px solid #000;
  margin-bottom: 20px;
  font-weight: bold;
}

.fact-list {
  margin: 15px 0;
  padding-left: 20px;
}

.fact-list li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.practical-tips h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin: 20px 0 10px 0;
}

.practical-tips ul {
  margin: 0;
  padding-left: 20px;
}

.practical-tips li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.quick-reference {
  background: #00ff41;
  border: 3px solid #000;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 5px 5px 0 #000;
}

.quick-reference h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #000;
  margin-bottom: 25px;
  text-align: center;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.reference-item {
  background: white;
  border: 2px solid #000;
  padding: 15px;
  text-align: center;
}

.temp-indicator {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.temp-indicator.hot { color: #ff4444; }
.temp-indicator.moderate { color: #ffaa00; }
.temp-indicator.cold { color: #4444ff; }
.temp-indicator.pollen { color: #ff44aa; }

.action {
  font-size: 0.9rem;
  line-height: 1.3;
}

.safety-checklist {
  background: white;
  border: 3px solid #000;
  padding: 30px;
  box-shadow: 5px 5px 0 #000;
}

.safety-checklist h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
}

.checklist-category h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.checklist-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
}

.checklist-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  accent-color: #00ff41;
}

.checklist-item span {
  font-size: 0.9rem;
  line-height: 1.3;
}

.checklist-summary {
  margin-top: 25px;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border: 2px solid #000;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00ff41;
  transition: width 0.3s ease;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .reference-grid {
    grid-template-columns: 1fr;
  }
  
  .checklist-grid {
    grid-template-columns: 1fr;
  }
  
  .tips-header h2 {
    font-size: 1.2rem;
  }
}
</style>
