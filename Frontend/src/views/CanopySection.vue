<script setup>
import { computed } from 'vue'
import Canopy3DMap from '../components/Canopy3DMap.vue'

// Props you can pass down from your parent if you want dynamic values
const props = defineProps({
  avgShade: { type: Number, default: 24 },
  topSuburb: { type: String, default: 'Park Orchards' },
  bottomSuburb: { type: String, default: 'Docklands' },
})
const chips = computed(() => ([
  { label: 'Average shade', value: `${Math.round(props.avgShade)}%` },
  { label: 'Most shaded',   value: props.topSuburb },
  { label: 'Least shaded',  value: props.bottomSuburb },
]))
</script>

<template>
  <section id="canopy-section" class="canopy-block">
    <!-- Left: Text + design -->
    <aside class="info">
      <h2 class="kicker">Tree Canopy</h2>

      <h3 class="hero-copy">
        <span class="shine">Shade changes everything.</span><br />
        Pick cooler streets & parks—at a glance.
      </h3>

      <div class="chips">
        <div v-for="c in chips" :key="c.label" class="chip">
          <div class="value">{{ c.value }}</div>
          <div class="label">{{ c.label }}</div>
        </div>
      </div>

      <div class="squiggle" aria-hidden="true">
        <svg viewBox="0 0 120 24"><path d="M2 12c12-8 24 8 36 0s24-8 36 0 24 8 36 0" fill="none" stroke="#77c285" stroke-width="3" stroke-linecap="round"/></svg>
      </div>

      <div class="card explain">
        <h4>What this means</h4>
        <ul>
          <li>🌡️ Areas with <strong>&gt;30% canopy</strong> can feel <strong>2–3°C cooler</strong> on hot days.</li>
          <li>🧢 More shade = safer midday walks for kids.</li>
          <li>🏞️ Use <em>Most shaded</em> to find natural “green shelters”.</li>
        </ul>
        <p class="muted">Tip: click any two suburbs to compare; double-click a bar to zoom.</p>
      </div>

      <div class="cta-row">
        <button class="btn-primary" @click="$emit('planCoolRoute')">Plan a cool route</button>
        <button class="btn-ghost" @click="document.querySelector('#water-section')?.scrollIntoView({behavior:'smooth'})">
          Jump to water ↓
        </button>
      </div>
    </aside>

    <!-- Right: Map in a soft card -->
    <div class="viz-card">
      <Canopy3DMap @planCoolRoute="$emit('planCoolRoute', $event)" />
    </div>

    <!-- Decorative blobs -->
    <span class="blob b1"></span>
    <span class="blob b2"></span>
  </section>
</template>

<style scoped>
/* --- Layout --- */
.canopy-block{
  position: relative;
  display: grid;
  grid-template-columns: 1.1fr 1.9fr;   /* text | map */
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 16px 12px;
}
@media (max-width: 960px){
  .canopy-block{ grid-template-columns: 1fr; }
  .info{ position: static; }
}

/* --- Left (text panel) --- */
.info{
  position: sticky; top: 72px;
  align-self: start;
  padding: 18px 16px;
  border-radius: 18px;
  background: #ffffffcc;
  border: 1px solid rgba(0,0,0,.06);
  backdrop-filter: blur(6px);
}
.kicker{ margin:0 0 6px; color:#1b5e20; font-weight:800; letter-spacing:.3px; }
.hero-copy{
  margin:0 0 10px;
  font-size: clamp(1.4rem, 2.5vw, 2.2rem);
  line-height: 1.05;
  color:#1f3d2b;
}
.shine{
  background: linear-gradient(90deg,#215d30,#77c285,#215d30);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}

/* --- Stat chips --- */
.chips{ display:grid; grid-template-columns: repeat(3,1fr); gap:8px; margin:10px 0 8px; }
.chip{ background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:12px; padding:10px; box-shadow:0 10px 24px rgba(0,0,0,.06); }
.value{ font-weight:800; color:#2e7d32; font-size:1.1rem; }
.label{ font-size:.82rem; color:#667; }

/* --- Squiggle divider --- */
.squiggle{ margin: 6px 0 10px; opacity:.8 }
.squiggle svg{ width: 180px; height: 30px; display:block }

/* --- Explainer card --- */
.card.explain{ background:#f7fbf8; border:1px solid rgba(0,0,0,.06); border-radius:12px; padding:12px; }
.card.explain h4{ margin:0 0 6px; color:#1b5e20; }
.card.explain ul{ margin:6px 0 8px; padding-left: 18px; }
.card.explain li{ margin:4px 0; }
.muted{ color:#566; font-size:.86rem }

/* --- CTA buttons --- */
.cta-row{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap }
.btn-primary{ background:#2e7d32; color:#fff; border:0; padding:10px 14px; border-radius:12px; cursor:pointer; box-shadow:0 10px 24px rgba(0,0,0,.08) }
.btn-primary:hover{ filter:brightness(1.05) }
.btn-ghost{ background:#fff; color:#2e7d32; border:1px solid #2e7d32; padding:10px 12px; border-radius:12px; cursor:pointer }

/* --- Right (map card) --- */
.viz-card{
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 14px 32px rgba(0,0,0,.10);
  padding: 10px;
}
.viz-card :deep(.map-wrap){
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
}

/* --- Decorative background blobs --- */
.blob{ position:absolute; border-radius:50%; filter:blur(48px); opacity:.18; pointer-events:none }
.b1{ width:320px; height:320px; background:#bfe6c3; left:-140px; top:-60px }
.b2{ width:260px; height:260px; background:#d6f0d9; right:-120px; bottom:-60px }
</style>
