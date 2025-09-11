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
/* ====== KidPath design tokens ====== */
.early-signs{
  --kp-green:#2e7d32;
  --kp-purple:#5e35b1;
  --kp-text:#2f3d4a;
  --kp-muted:#667085;
  --kp-border:rgba(0,0,0,.08);
  --kp-shadow:0 10px 28px rgba(0,0,0,.12);
  --kp-shadow-hover:0 16px 36px rgba(0,0,0,.16);
  max-width:1200px;
  margin:0 auto;
  font-family:'Segoe UI','Arial',sans-serif;
  color:var(--kp-text);
}

/* ====== Header ====== */
.signs-header{ text-align:center; margin:12px auto 28px; padding:0 16px; }
.signs-header h2{
  font-weight:800;
  font-size:clamp(22px,3.2vw,34px);
  color:var(--kp-green);
  letter-spacing:.3px;
  margin-bottom:8px;
}
.signs-subtitle{
  font-size:1.05rem; color:var(--kp-muted);
  max-width:760px; margin:0 auto; line-height:1.7;
}

/* ====== Overview cards ====== */
.signs-overview{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
  gap:22px;
  padding:0 16px;
  margin-bottom:26px;
}
.overview-card{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:20px 18px;
  box-shadow:var(--kp-shadow);
  transition:transform .18s ease, box-shadow .18s ease;
}
.overview-card:hover{ transform:translateY(-2px); box-shadow:var(--kp-shadow-hover); }

.card-header{
  display:flex; align-items:center; gap:12px; position:relative; margin-bottom:12px;
}
.card-icon{
  width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;
  border-radius:50%;
  background:linear-gradient(135deg,#ede7f6,#f3e5f5);
  color:var(--kp-purple);
  box-shadow:0 4px 12px rgba(94,53,177,.18);
  font-size:22px;
}
.card-header h3{ margin:0; font-weight:800; font-size:1.1rem; color:var(--kp-text); }

/* severity badge (右上角小胶囊) */
.severity-badge{
  position:absolute; top:-6px; right:-6px;
  padding:6px 10px; font-size:.7rem; font-weight:800; letter-spacing:.6px;
  border-radius:999px; border:1px solid rgba(0,0,0,.06);
  box-shadow:0 6px 16px rgba(0,0,0,.12);
  background:#eef2ff; color:var(--kp-purple);
}
.severity-badge.critical{ background:#ffebee; color:#c62828; border-color:#ffcdd2; }
.severity-badge.serious{ background:#fff8e1; color:#ef6c00; border-color:#ffe0b2; }
.severity-badge.moderate{ background:#fffde7; color:#f9a825; border-color:#fff59d; }

/* 内容 */
.signs-list{ display:flex; flex-direction:column; gap:8px; margin:10px 0 14px; }
.sign-item{ display:flex; align-items:flex-start; gap:10px; line-height:1.6; }
.sign-icon{ font-size:18px; opacity:.9; }

.action-required{
  background:#f7f6ff;
  border:1px solid rgba(94,53,177,.18);
  color:#3b3b3b;
  border-radius:12px;
  padding:12px 14px;
  line-height:1.6;
}

/* ====== Symptom checker ====== */
.symptom-checker{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:24px 20px;
  margin:0 16px 26px;
  box-shadow:var(--kp-shadow);
}
.symptom-checker h3{
  text-align:center; margin:0 0 6px;
  font-weight:800; color:var(--kp-green); font-size:1.3rem;
}
.symptom-checker>p{
  text-align:center; color:var(--kp-muted); margin:0 0 16px;
}
.symptom-categories{
  display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
  gap:18px;
}
.category h4{
  margin:6px 0 10px; color:var(--kp-purple); font-weight:800; font-size:1rem;
}
.symptom-options{ display:flex; flex-direction:column; gap:10px; }

.symptom-option{
  display:flex; align-items:center; gap:12px;
  padding:12px;
  border:1px solid var(--kp-border);
  border-radius:12px; background:#fff;
  box-shadow:0 6px 18px rgba(0,0,0,.06);
  transition:background .18s ease, border-color .18s ease, box-shadow .18s ease;
  cursor:pointer;
}
.symptom-option:hover{ background:rgba(94,53,177,.06); }
.symptom-option input{ width:18px;height:18px; accent-color:var(--kp-purple); }
.symptom-option input:checked + span{
  background:linear-gradient(135deg,#f6f1ff,#eef9f0);
  border-radius:8px; padding:2px 6px;
}

/* ====== Assessment result ====== */
.assessment-result{ margin-top:18px; padding:0 4px; }
.result-card{
  border:1px solid var(--kp-border);
  border-left:6px solid var(--kp-purple);
  border-radius:16px;
  padding:18px 16px;
  box-shadow:var(--kp-shadow);
  background:#fff;
}
.result-card.critical{ border-left-color:#c62828; background:#ffebee; }
.result-card.serious{ border-left-color:#ef6c00; background:#fff8e1; }
.result-card.moderate{ border-left-color:#f9a825; background:#fffde7; }
.result-card.mild{ border-left-color:var(--kp-green); background:#f4fbf5; }

.result-header{
  display:flex; align-items:center; gap:12px; position:relative; margin-bottom:8px;
}
.result-icon{
  width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;
  border-radius:50%;
  background:#fff; box-shadow:0 4px 12px rgba(0,0,0,.12);
  font-size:22px;
}
.result-header h4{ margin:0; font-weight:800; font-size:1.05rem; color:var(--kp-text); }
.result-header .severity-badge{ position:static; margin-left:auto; }

.result-description{ color:var(--kp-text); line-height:1.7; margin:10px 0 12px; }

.immediate-actions h5{
  margin:0 0 8px; color:var(--kp-purple); font-weight:800; font-size:1rem;
}
.immediate-actions ul{ margin:0; padding-left:18px; }
.immediate-actions li{ line-height:1.6; margin:6px 0; }

.emergency-notice{
  margin-top:10px; text-align:center;
  background:#c62828; color:#fff; font-weight:800;
  padding:10px 12px; border-radius:10px;
}

/* ====== Prevention tips ====== */
.prevention-tips{
  background:linear-gradient(180deg,#f7fcf8,#fff);
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:22px 20px;
  margin:0 16px 26px;
  box-shadow:var(--kp-shadow);
}
.prevention-tips h3{
  text-align:center; margin:0 0 16px;
  color:var(--kp-green); font-weight:800; font-size:1.25rem;
}
.prevention-grid{
  display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:18px;
}
.prevention-card{
  background:#fff; border:1px solid var(--kp-border);
  border-radius:14px; padding:16px; text-align:center;
  box-shadow:0 8px 22px rgba(0,0,0,.08);
}
.prevention-icon{ font-size:28px; margin-bottom:8px; }
.prevention-card h4{ margin:0 0 10px; color:var(--kp-purple); font-weight:800; }
.prevention-card ul{ text-align:left; margin:0; padding-left:18px; }
.prevention-card li{ line-height:1.6; margin:6px 0; }

/* ====== Emergency card ====== */
.emergency-card{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:22px 20px;
  margin:0 16px 30px;
  box-shadow:var(--kp-shadow);
}
.emergency-card h3{
  text-align:center; margin:0 0 16px;
  color:var(--kp-green); font-weight:800; font-size:1.25rem;
}
.emergency-content{
  display:grid; grid-template-columns:1fr 1fr; gap:20px;
}
.emergency-numbers{ display:flex; flex-direction:column; gap:12px; }
.emergency-item{
  display:flex; justify-content:space-between; align-items:center;
  padding:12px 14px; background:#f7faff;
  border:1px solid var(--kp-border); border-radius:12px;
}
.emergency-label{ font-weight:700; color:var(--kp-text); }
.emergency-number{
  font-weight:800; color:var(--kp-purple);
  background:#fff; border:1px dashed rgba(94,53,177,.35);
  border-radius:8px; padding:4px 8px;
}

.emergency-tips h4{ margin:0 0 10px; color:var(--kp-purple); font-weight:800; }
.emergency-tips ul{ margin:0; padding-left:18px; }
.emergency-tips li{ line-height:1.6; margin:6px 0; }

/* ====== Responsive ====== */
@media (max-width:768px){
  .signs-overview{ grid-template-columns:1fr; }
  .symptom-categories{ grid-template-columns:1fr; }
  .prevention-grid{ grid-template-columns:1fr; }
  .emergency-content{ grid-template-columns:1fr; }
  .signs-header h2{ font-size:1.35rem; }
}
</style>

