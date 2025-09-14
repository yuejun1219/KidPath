<template>
  <div class="parent-tips">
    <div class="tips-header">
      <h2>📚 Parent Tips: Why Comfort Matters</h2>
      <p class="tips-subtitle">Quick, science-based guidance for heat, cold, pollen & UV</p>
    </div>

    <!-- 两列卡片 -->
    <div class="tips-grid">
      <!-- Heat -->
      <article class="tip-card">
        <header class="card-header">
          <div class="card-icon">🌡️</div>
          <h3>Heat Vulnerability</h3>
        </header>
        <div class="science-pill"><strong>Fact:</strong> Kids heat up 3–5× faster.</div>
        <ul class="fact-list">
          <li>More surface area per kg</li>
          <li>Sweat less efficient</li>
          <li>Thinner skin</li>
        </ul>
        <h4 class="tips-title">Do this</h4>
        <ul class="tips-list">
          <li>Play before 10am / after 4pm</li>
          <li>Shade break every 15–20 min</li>
          <li>Light, loose clothes + wide-brim hat</li>
        </ul>
      </article>

      <!-- Cold -->
      <article class="tip-card">
        <header class="card-header">
          <div class="card-icon">❄️</div>
          <h3>Cold Vulnerability</h3>
        </header>
        <div class="science-pill"><strong>Fact:</strong> Kids lose heat faster.</div>
        <ul class="fact-list">
          <li>Bigger head-to-body ratio</li>
          <li>Less insulation (body fat)</li>
          <li>Weaker shiver response</li>
        </ul>
        <h4 class="tips-title">Do this</h4>
        <ul class="tips-list">
          <li>Layer up (base / warm / shell)</li>
          <li>Keep head, hands & feet warm</li>
          <li>Shorter sessions, warm drinks</li>
        </ul>
      </article>

      <!-- Pollen -->
      <article class="tip-card">
        <header class="card-header">
          <div class="card-icon">🌸</div>
          <h3>Pollen Sensitivity</h3>
        </header>
        <div class="science-pill"><strong>Fact:</strong> Airways are more reactive.</div>
        <ul class="fact-list">
          <li>Immature immunity</li>
          <li>Smaller airways</li>
          <li>Faster breathing</li>
        </ul>
        <h4 class="tips-title">Do this</h4>
        <ul class="tips-list">
          <li>Check pollen map first</li>
          <li>Pick low-pollen routes</li>
          <li>Wash hands/face after play</li>
        </ul>
      </article>

      <!-- UV -->
      <article class="tip-card">
        <header class="card-header">
          <div class="card-icon">☀️</div>
          <h3>UV Protection</h3>
        </header>
        <div class="science-pill"><strong>Fact:</strong> Skin burns more easily.</div>
        <ul class="fact-list">
          <li>Less melanin</li>
          <li>Thinner epidermis</li>
          <li>More time outdoors</li>
        </ul>
        <h4 class="tips-title">Do this</h4>
        <ul class="tips-list">
          <li>SPF 30+, reapply every 2h</li>
          <li>Shade 10–4, sunglasses</li>
          <li>UPF clothing + wide-brim hat</li>
        </ul>
      </article>
    </div>

    <!-- 下面两个区保持原样；如需也做两列可继续用同样网格方式 -->
    <div class="quick-reference">
      <h3>🚀 Quick Reference Guide</h3>
      <div class="reference-grid">
        <div class="reference-item">
          <div class="temp-indicator hot">🌡️ 30°C+</div>
          <div class="action">Seek shade, frequent breaks, extra hydration</div>
        </div>
        <div class="reference-item">
          <div class="temp-indicator moderate">🌡️ 20–30°C</div>
          <div class="action">Normal play with sun protection</div>
        </div>
        <div class="reference-item">
          <div class="temp-indicator cold">🌡️ &lt;10°C</div>
          <div class="action">Layer up, limit time, watch shivering</div>
        </div>
        <div class="reference-item">
          <div class="temp-indicator pollen">🌸 High Pollen</div>
          <div class="action">Indoor play or low-pollen routes</div>
        </div>
      </div>
    </div>

    <div class="safety-checklist">
      <h3>✅ Pre-Outdoor Safety Checklist</h3>
      <div class="checklist-grid">
        <div class="checklist-category">
          <h4>🌡️ Temperature</h4>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.temperature"><span>Checked temperature / heat index</span></label>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.clothing"><span>Weather-appropriate clothing</span></label>
        </div>
        <div class="checklist-category">
          <h4>☀️ Sun</h4>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.sunscreen"><span>SPF 30+ applied</span></label>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.hat"><span>Wide-brim hat on</span></label>
        </div>
        <div class="checklist-category">
          <h4>💧 Hydration</h4>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.water"><span>Water bottles packed</span></label>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.breaks"><span>Shade breaks planned</span></label>
        </div>
        <div class="checklist-category">
          <h4>🌸 Allergies</h4>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.pollen"><span>Pollen checked</span></label>
          <label class="checklist-item"><input type="checkbox" v-model="checklist.medication"><span>Medication (if needed)</span></label>
        </div>
      </div>

      <div class="checklist-summary" v-if="completedItems > 0">
        <div class="progress-bar"><div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div></div>
        <p>{{ completedItems }}/{{ totalItems }} done ({{ Math.round(progressPercentage) }}%)</p>
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

const completedItems = computed(() => Object.values(checklist.value).filter(Boolean).length)
const totalItems = computed(() => Object.keys(checklist.value).length)
const progressPercentage = computed(() => (completedItems.value / totalItems.value) * 100)
</script>

<style scoped>
/* ===== Tokens（与 About 页面一致的感觉） ===== */
.parent-tips{
  --kp-green:#2e7d32;
  --kp-purple:#5e35b1;
  --kp-text:#2f3d4a;
  --kp-muted:#667085;
  --kp-border:rgba(0,0,0,.08);
  --shadow-1:0 10px 24px rgba(0,0,0,.08);
  --shadow-2:0 18px 40px rgba(0,0,0,.14);
  max-width:1200px; margin:0 auto; font-family:'Segoe UI','Arial',sans-serif; color:var(--kp-text);
}

/* ===== Header ===== */
.tips-header{ text-align:center; margin:18px auto 34px; padding:0 16px; }
.tips-header h2{ font-weight:900; font-size:clamp(22px,3.2vw,34px); color:var(--kp-green); margin:0 0 8px; }
.tips-subtitle{ color:var(--kp-muted); max-width:760px; margin:0 auto; line-height:1.7; }

/* ===== Two-col grid ===== */
.tips-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0, 1fr)); /* 一行两个 */
  gap:22px;
  margin:0 16px 40px;
}

/* ===== Card ===== */
.tip-card{
  background:linear-gradient(180deg,#ffffff 0%,#fbfcff 100%);
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:20px 18px;
  box-shadow:var(--shadow-1);
  transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease;
}
.tip-card:hover{ transform:translateY(-3px); box-shadow:var(--shadow-2); border-color:rgba(46,125,50,.18); }

.card-header{ display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.card-icon{
  width:42px; height:42px; display:grid; place-items:center; border-radius:50%;
  background:linear-gradient(135deg,#ede7f6,#e8f5e9); color:var(--kp-purple);
  box-shadow:0 6px 16px rgba(94,53,177,.18); font-size:22px;
}
.card-header h3{ margin:0; font-weight:800; font-size:1.1rem; color:var(--kp-green); }

/* concise fact + lists */
.science-pill{
  display:inline-block; margin:2px 0 10px; padding:8px 12px;
  border-radius:12px; background:#f6f8ff; border:1px solid rgba(94,53,177,.18);
  color:var(--kp-text);
}
.science-pill strong{ color:var(--kp-purple); }
.fact-list, .tips-list{ margin:0 0 6px; padding-left:18px; }
.fact-list li, .tips-list li{ margin:6px 0; color:var(--kp-text); line-height:1.55; }
.tips-title{ margin:10px 0 6px; font-weight:800; color:var(--kp-green); font-size:.98rem; }

/* ===== Quick Reference ===== */
.quick-reference{
  margin:0 16px 34px; padding:24px 20px; border:1px solid var(--kp-border);
  border-radius:18px; background:linear-gradient(135deg,#edf6ed,#cfead3); box-shadow:var(--shadow-1);
}
.quick-reference h3{ text-align:center; margin:0 0 14px; color:var(--kp-green); font-weight:900; font-size:1.2rem; }

.reference-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0,1fr)); /* 一行两个 */
  gap:16px;
  align-items:stretch;
}
.reference-item{
  background:#fff; border:1px solid var(--kp-border); border-radius:14px;
  padding:14px 16px; box-shadow:0 6px 18px rgba(0,0,0,.06);
}
.temp-indicator{ display:inline-block; padding:6px 10px; border-radius:999px; font-weight:700; margin-bottom:8px; background:#f6f7f9; }
.temp-indicator.hot{ background:#fff1f1; color:#d32f2f; }
.temp-indicator.moderate{ background:#fff6e6; color:#f57c00; }
.temp-indicator.cold{ background:#eef5ff; color:#1565c0; }
.temp-indicator.pollen{ background:#fff0fa; color:#ad308e; }
.action{ color:var(--kp-muted); }

/* ===== Checklist ===== */
.safety-checklist{
  margin:0 16px 50px; padding:24px 20px; background:#fff;
  border:1px solid var(--kp-border); border-radius:18px; box-shadow:var(--shadow-1);
}
.safety-checklist h3{ text-align:center; margin:0 0 14px; color:var(--kp-green); font-weight:900; font-size:1.2rem; }

.checklist-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0,1fr)); /* 一行两个 */
  gap:18px;
}
.checklist-category h4{ margin:6px 0 8px; color:var(--kp-purple); font-weight:800; font-size:.98rem; }
.checklist-item{ display:flex; align-items:center; gap:10px; margin:8px 0; }
.checklist-item input{ width:18px; height:18px; accent-color:var(--kp-purple); }
.progress-bar{ width:100%; height:12px; background:#eef2ff; border-radius:999px; overflow:hidden; margin:10px 0 6px; }
.progress-fill{ height:100%; background:linear-gradient(90deg,var(--kp-purple),var(--kp-green)); border-radius:999px; transition:width .3s ease; }
.checklist-summary{ text-align:center; color:var(--kp-muted); }

/* ===== Responsive ===== */
@media (max-width: 980px){
  .tips-grid,
  .reference-grid,
  .checklist-grid{
    grid-template-columns:1fr; /* 窄屏回落为单列 */
  }
}
</style>
