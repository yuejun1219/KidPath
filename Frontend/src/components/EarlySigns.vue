<template>
  <div class="early-signs">
    <div class="signs-header">
      <h2>⚠️ Early Warning Signs</h2>
      <p class="signs-subtitle">Learn to identify signs of heatstroke, sunburn, and exhaustion in children</p>
    </div>

    <!-- Quick Reference Cards -->
    <div class="signs-overview">
      <div class="overview-card heatstroke-card">
        <div class="card-header">
          <div class="card-icon">🌡️</div>
          <h3>Heatstroke</h3>
          <div class="severity-badge critical">CRITICAL</div>
        </div>
        <div class="card-content">
          <div class="signs-list">
            <div class="sign-item" v-for="sign in heatstrokeSigns" :key="sign">
              <span class="sign-icon">⚠️</span>
              <span class="sign-text">{{ sign }}</span>
            </div>
          </div>
          <div class="action-required">
            <strong>IMMEDIATE ACTION:</strong> Call emergency services, move to cool area, remove excess clothing, apply cool water
          </div>
        </div>
      </div>

      <div class="overview-card heat-exhaustion-card">
        <div class="card-header">
          <div class="card-icon">😰</div>
          <h3>Heat Exhaustion</h3>
          <div class="severity-badge serious">SERIOUS</div>
        </div>
        <div class="card-content">
          <div class="signs-list">
            <div class="sign-item" v-for="sign in heatExhaustionSigns" :key="sign">
              <span class="sign-icon">⚠️</span>
              <span class="sign-text">{{ sign }}</span>
            </div>
          </div>
          <div class="action-required">
            <strong>ACTION NEEDED:</strong> Move to shade, give water, rest, monitor closely
          </div>
        </div>
      </div>

      <div class="overview-card sunburn-card">
        <div class="card-header">
          <div class="card-icon">🔥</div>
          <h3>Sunburn</h3>
          <div class="severity-badge moderate">MODERATE</div>
        </div>
        <div class="card-content">
          <div class="signs-list">
            <div class="sign-item" v-for="sign in sunburnSigns" :key="sign">
              <span class="sign-icon">⚠️</span>
              <span class="sign-text">{{ sign }}</span>
            </div>
          </div>
          <div class="action-required">
            <strong>ACTION NEEDED:</strong> Cool compress, aloe vera, pain relief, avoid further sun exposure
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Symptom Checker -->
    <div class="symptom-checker">
      <h3>🔍 Interactive Symptom Checker</h3>
      <p>Select the symptoms you observe to get immediate guidance:</p>
      
      <div class="symptom-categories">
        <div class="category">
          <h4>🌡️ Temperature & Sweating</h4>
          <div class="symptom-options">
            <label v-for="symptom in temperatureSymptoms" :key="symptom.id" class="symptom-option">
              <input type="checkbox" v-model="selectedSymptoms" :value="symptom.id">
              <span>{{ symptom.text }}</span>
            </label>
          </div>
        </div>

        <div class="category">
          <h4>😴 Behavior & Energy</h4>
          <div class="symptom-options">
            <label v-for="symptom in behaviorSymptoms" :key="symptom.id" class="symptom-option">
              <input type="checkbox" v-model="selectedSymptoms" :value="symptom.id">
              <span>{{ symptom.text }}</span>
            </label>
          </div>
        </div>

        <div class="category">
          <h4>🔥 Skin & Appearance</h4>
          <div class="symptom-options">
            <label v-for="symptom in skinSymptoms" :key="symptom.id" class="symptom-option">
              <input type="checkbox" v-model="selectedSymptoms" :value="symptom.id">
              <span>{{ symptom.text }}</span>
            </label>
          </div>
        </div>

        <div class="category">
          <h4>💧 Hydration & Breathing</h4>
          <div class="symptom-options">
            <label v-for="symptom in hydrationSymptoms" :key="symptom.id" class="symptom-option">
              <input type="checkbox" v-model="selectedSymptoms" :value="symptom.id">
              <span>{{ symptom.text }}</span>
            </label>
          </div>
        </div>
      </div>

      <div v-if="selectedSymptoms.length > 0" class="assessment-result">
        <div class="result-card" :class="assessmentResult.severity">
          <div class="result-header">
            <div class="result-icon">{{ assessmentResult.icon }}</div>
            <h4>{{ assessmentResult.title }}</h4>
            <div class="severity-badge" :class="assessmentResult.severity">{{ assessmentResult.severity.toUpperCase() }}</div>
          </div>
          <div class="result-content">
            <p class="result-description">{{ assessmentResult.description }}</p>
            <div class="immediate-actions">
              <h5>Immediate Actions:</h5>
              <ul>
                <li v-for="action in assessmentResult.actions" :key="action">{{ action }}</li>
              </ul>
            </div>
            <div v-if="assessmentResult.severity === 'critical'" class="emergency-notice">
              <strong>🚨 CALL EMERGENCY SERVICES IMMEDIATELY</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prevention Tips -->
    <div class="prevention-tips">
      <h3>🛡️ Prevention is Better Than Cure</h3>
      <div class="prevention-grid">
        <div class="prevention-card">
          <div class="prevention-icon">⏰</div>
          <h4>Timing</h4>
          <ul>
            <li>Plan activities before 10 AM or after 4 PM</li>
            <li>Avoid peak heat hours (12 PM - 3 PM)</li>
            <li>Take breaks every 15-20 minutes</li>
          </ul>
        </div>

        <div class="prevention-card">
          <div class="prevention-icon">👕</div>
          <h4>Clothing</h4>
          <ul>
            <li>Light, loose-fitting, light-colored clothes</li>
            <li>Wide-brimmed hats (not caps)</li>
            <li>UV-protective sunglasses</li>
          </ul>
        </div>

        <div class="prevention-card">
          <div class="prevention-icon">🧴</div>
          <h4>Protection</h4>
          <ul>
            <li>SPF 30+ sunscreen on all exposed skin</li>
            <li>Reapply every 2 hours</li>
            <li>Seek shade whenever possible</li>
          </ul>
        </div>

        <div class="prevention-card">
          <div class="prevention-icon">💧</div>
          <h4>Hydration</h4>
          <ul>
            <li>Drink water every 15-20 minutes</li>
            <li>Pack extra water bottles</li>
            <li>Watch for signs of dehydration</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Emergency Contact Card -->
    <div class="emergency-card">
      <h3>📞 Emergency Information</h3>
      <div class="emergency-content">
        <div class="emergency-numbers">
          <div class="emergency-item">
            <span class="emergency-label">Emergency Services:</span>
            <span class="emergency-number">000</span>
          </div>
          <div class="emergency-item">
            <span class="emergency-label">Poison Information:</span>
            <span class="emergency-number">13 11 26</span>
          </div>
          <div class="emergency-item">
            <span class="emergency-label">Health Direct:</span>
            <span class="emergency-number">1800 022 222</span>
          </div>
        </div>
        <div class="emergency-tips">
          <h4>When to Call Emergency Services:</h4>
          <ul>
            <li>Temperature above 40°C (104°F)</li>
            <li>Loss of consciousness or confusion</li>
            <li>Severe headache or vomiting</li>
            <li>Rapid breathing or heart rate</li>
            <li>Hot, dry skin (no sweating)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedSymptoms = ref([])

const heatstrokeSigns = ref([
  'High body temperature (40°C/104°F or higher)',
  'Hot, red, dry skin (no sweating)',
  'Rapid, strong pulse',
  'Throbbing headache',
  'Dizziness and nausea',
  'Confusion or disorientation',
  'Loss of consciousness'
])

const heatExhaustionSigns = ref([
  'Heavy sweating',
  'Cold, pale, clammy skin',
  'Fast, weak pulse',
  'Nausea or vomiting',
  'Muscle cramps',
  'Tiredness or weakness',
  'Dizziness or fainting'
])

const sunburnSigns = ref([
  'Red, painful skin',
  'Skin feels warm to touch',
  'Swelling or blisters',
  'Headache and fever',
  'Nausea and fatigue',
  'Skin peeling after a few days'
])

const temperatureSymptoms = ref([
  { id: 'high-temp', text: 'High body temperature (feels very hot)' },
  { id: 'no-sweat', text: 'Hot, dry skin with no sweating' },
  { id: 'cold-sweat', text: 'Cold, clammy skin with heavy sweating' },
  { id: 'chills', text: 'Chills or shivering' }
])

const behaviorSymptoms = ref([
  { id: 'confusion', text: 'Confusion or disorientation' },
  { id: 'irritability', text: 'Unusual irritability or crying' },
  { id: 'lethargy', text: 'Extreme tiredness or weakness' },
  { id: 'unconscious', text: 'Loss of consciousness or fainting' }
])

const skinSymptoms = ref([
  { id: 'red-skin', text: 'Red, painful skin' },
  { id: 'blisters', text: 'Blisters or swelling' },
  { id: 'pale-skin', text: 'Pale or grayish skin' },
  { id: 'hot-skin', text: 'Skin feels very hot to touch' }
])

const hydrationSymptoms = ref([
  { id: 'thirst', text: 'Extreme thirst' },
  { id: 'no-urine', text: 'No urination for several hours' },
  { id: 'rapid-breathing', text: 'Rapid, shallow breathing' },
  { id: 'rapid-pulse', text: 'Rapid or weak pulse' }
])

const assessmentResult = computed(() => {
  const symptoms = selectedSymptoms.value
  
  // Critical symptoms (heatstroke)
  if (symptoms.includes('high-temp') && symptoms.includes('no-sweat') && 
      (symptoms.includes('confusion') || symptoms.includes('unconscious'))) {
    return {
      severity: 'critical',
      icon: '🚨',
      title: 'Possible Heatstroke - EMERGENCY',
      description: 'Your child may be experiencing heatstroke, which is a medical emergency.',
      actions: [
        'Call emergency services (000) immediately',
        'Move child to a cool, shaded area',
        'Remove excess clothing',
        'Apply cool water or ice packs to skin',
        'Do NOT give fluids if unconscious'
      ]
    }
  }
  
  // Serious symptoms (heat exhaustion)
  if ((symptoms.includes('cold-sweat') || symptoms.includes('lethargy')) && 
      symptoms.length >= 3) {
    return {
      severity: 'serious',
      icon: '⚠️',
      title: 'Possible Heat Exhaustion',
      description: 'Your child may be experiencing heat exhaustion and needs immediate attention.',
      actions: [
        'Move to a cool, shaded area immediately',
        'Give small sips of water',
        'Apply cool, wet cloths to skin',
        'Remove excess clothing',
        'Monitor closely and seek medical help if symptoms worsen'
      ]
    }
  }
  
  // Moderate symptoms (sunburn or mild heat issues)
  if (symptoms.includes('red-skin') || symptoms.includes('blisters') || 
      symptoms.includes('thirst') || symptoms.includes('irritability')) {
    return {
      severity: 'moderate',
      icon: '🔥',
      title: 'Mild Heat-Related Symptoms',
      description: 'Your child is showing signs of heat stress or sunburn.',
      actions: [
        'Move to shade immediately',
        'Give plenty of water',
        'Apply cool compress to affected areas',
        'Use aloe vera for sunburn',
        'Monitor for worsening symptoms'
      ]
    }
  }
  
  // No significant symptoms
  return {
    severity: 'mild',
    icon: '✅',
    title: 'No Critical Symptoms Detected',
    description: 'Continue monitoring and ensure proper hydration and sun protection.',
    actions: [
      'Continue regular water breaks',
      'Apply sunscreen if not already done',
      'Seek shade during peak heat hours',
      'Watch for any new symptoms'
    ]
  }
})
</script>

<style scoped>
.early-signs {
  max-width: 1200px;
  margin: 0 auto;
}

.signs-header {
  text-align: center;
  margin-bottom: 40px;
}

.signs-header h2 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
}

.signs-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.signs-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.overview-card {
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 25px;
  box-shadow: 5px 5px 0 #000;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 #000;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
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
  flex: 1;
}

.severity-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  padding: 5px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 #000;
}

.severity-badge.critical {
  background: #ff4444;
  color: white;
}

.severity-badge.serious {
  background: #ffaa00;
  color: #000;
}

.severity-badge.moderate {
  background: #ffff00;
  color: #000;
}

.signs-list {
  margin-bottom: 20px;
}

.sign-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.sign-icon {
  margin-right: 10px;
  font-size: 1.2rem;
}

.sign-text {
  line-height: 1.4;
}

.action-required {
  background: #f0f8ff;
  border: 2px solid #000;
  padding: 15px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.symptom-checker {
  background: white;
  border: 3px solid #000;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 5px 5px 0 #000;
}

.symptom-checker h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.symptom-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.category h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.symptom-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.symptom-option {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.symptom-option:hover {
  background: #f0f8ff;
}

.symptom-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  accent-color: #00ff41;
}

.symptom-option span {
  font-size: 0.9rem;
  line-height: 1.3;
}

.assessment-result {
  margin-top: 30px;
}

.result-card {
  border: 3px solid #000;
  padding: 25px;
  box-shadow: 5px 5px 0 #000;
}

.result-card.critical {
  background: #fff0f0;
  border-color: #ff4444;
}

.result-card.serious {
  background: #fff8e0;
  border-color: #ffaa00;
}

.result-card.moderate {
  background: #fff8e0;
  border-color: #ffff00;
}

.result-card.mild {
  background: #f0fff0;
  border-color: #00ff41;
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.result-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.result-header h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: #333;
  margin: 0;
  flex: 1;
}

.result-description {
  font-size: 1.1rem;
  margin-bottom: 20px;
  line-height: 1.4;
}

.immediate-actions h5 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 10px;
}

.immediate-actions ul {
  margin: 0;
  padding-left: 20px;
}

.immediate-actions li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.emergency-notice {
  background: #ff4444;
  color: white;
  padding: 15px;
  text-align: center;
  margin-top: 20px;
  border: 2px solid #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
}

.prevention-tips {
  background: #00ff41;
  border: 3px solid #000;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 5px 5px 0 #000;
}

.prevention-tips h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #000;
  margin-bottom: 25px;
  text-align: center;
}

.prevention-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
}

.prevention-card {
  background: white;
  border: 2px solid #000;
  padding: 20px;
  text-align: center;
}

.prevention-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.prevention-card h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.prevention-card ul {
  text-align: left;
  margin: 0;
  padding-left: 20px;
}

.prevention-card li {
  margin-bottom: 8px;
  line-height: 1.4;
  font-size: 0.9rem;
}

.emergency-card {
  background: white;
  border: 3px solid #000;
  padding: 30px;
  box-shadow: 5px 5px 0 #000;
}

.emergency-card h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.emergency-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.emergency-numbers {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.emergency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f0f8ff;
  border: 2px solid #000;
}

.emergency-label {
  font-weight: bold;
}

.emergency-number {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #00ff41;
  font-weight: bold;
}

.emergency-tips h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.emergency-tips ul {
  margin: 0;
  padding-left: 20px;
}

.emergency-tips li {
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .signs-overview {
    grid-template-columns: 1fr;
  }
  
  .symptom-categories {
    grid-template-columns: 1fr;
  }
  
  .prevention-grid {
    grid-template-columns: 1fr;
  }
  
  .emergency-content {
    grid-template-columns: 1fr;
  }
  
  .signs-header h2 {
    font-size: 1.2rem;
  }
}
</style>
