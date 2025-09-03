<!-- src/views/ComfortInsights.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

import CanopySection from './CanopySection.vue'
import WaterAccess from '@/components/WaterAccess.vue'
import NearbyFountains from '@/components/NearbyFountains.vue'
import CoolRoute from '@/components/CoolRoute.vue'

const selectedSuburbs = ref([])
function onPlanCoolRoute(ids){
  selectedSuburbs.value = ids || []
  document.querySelector('#water')?.scrollIntoView({ behavior:'smooth' })
}

/* Jumpbar active link (on scroll) */
const activeId = ref('shade')
let obs
onMounted(() => {
  const sections = [...document.querySelectorAll('section[id]')]
  obs = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b)=> b.intersectionRatio - a.intersectionRatio)[0]
    if (visible) activeId.value = visible.target.id
  }, { rootMargin: '-30% 0px -60% 0px', threshold: [0.1, 0.25, 0.5] })
  sections.forEach(s => obs.observe(s))
})
onBeforeUnmount(() => { if (obs) obs.disconnect() })
</script>

<template>
  <main class="page">

    <!-- Sticky local nav -->
    <nav class="jumpbar">
      <a :class="{active: activeId==='shade'}" href="#shade">🌳 Shade</a>
      <a :class="{active: activeId==='water'}" href="#water">🚰 Water</a>
      <a :class="{active: activeId==='route'}" href="#route">🗺️ Plan a route</a>
    </nav>

    <!-- Hero -->
    <header class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1>Comfort Insights</h1>
          <p class="lede">Plan a cooler walk using shade (trees & parks) and nearby water.</p>
        </div>
        <ul class="hero-points">
          <li><span>🏞️</span> Compare suburbs by tree canopy</li>
          <li><span>🚰</span> Check drinking fountain coverage</li>
          <li><span>🧭</span> Route planner that prefers shade</li>
        </ul>
      </div>
    </header>

    <!-- SHADE / CANOPY -->
    <section id="shade" class="section-grid band">
      <aside class="aside">
        <h2>Tree canopy by suburb</h2>
        <p class="muted">
          This is a <strong>suburb-level distribution</strong> of tree cover. Taller bars and deeper
          greens mean a suburb has more canopy overall—useful for choosing greener neighbourhoods at a glance.
        </p>
        <ul class="bullets">
          <li><strong>Greener suburbs (≈30%+)</strong> tend to feel cooler on hot days.</li>
          <li>Use the list to compare suburbs; double-click a row to zoom the map.</li>
          <li>For <em>street-level</em> choices, use <strong>Plan a route</strong> below.</li>
        </ul>
      </aside>

      <div class="content card shade-card">
        <CanopySection @planCoolRoute="onPlanCoolRoute" />
      </div>
    </section>

    <!-- WATER -->
    <section id="water" class="section-grid">
      <aside class="aside">
        <h2>Drinking fountains by suburb</h2>
        <p class="muted">
          A <strong>suburb-level distribution</strong> of fountains. Clusters often follow parks, trails
          and activity centres—handy for picking better-served areas.
        </p>
        <ul class="bullets">
          <li>Spot <strong>well-served</strong> areas vs. <strong>gaps</strong>.</li>
          <li>Combine with canopy to choose cooler destinations.</li>
          <li>For exact taps along a path, plan a route first, then check nearby taps.</li>
        </ul>
      </aside>

      <!-- NEW: side-by-side layout for water -->
      <div class="water-grid">
        <div class="content card water-card">
          <WaterAccess :focusSuburbs="selectedSuburbs" />
        </div>

        <div class="content card fountains-card">
          <h3 class="subhead">Nearby fountains</h3>
          <NearbyFountains :focusSuburbs="selectedSuburbs" />
        </div>
      </div>
    </section>

    <!-- ROUTE -->
    <section id="route" class="section-grid band">
      <aside class="aside">
        <h2>Plan a cool route</h2>
        <p class="muted">
          Street-level routing that prefers shade. Pick two points; we’ll fetch walking alternatives
          and score them using nearby parks & street trees.
        </p>
        <ul class="bullets">
          <li>Adjust sliders to favour shade and set parks/trees mix.</li>
          <li>After choosing a route, scroll to <strong>Water</strong> for taps along the way.</li>
        </ul>
      </aside>

      <div class="content card route-card">
        <CoolRoute
          parksUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/parks.geojson"
          treesUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/trees.geojson"
          grassUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/grass.geojson"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ===== knobs you can change quickly ===== */
:root{
  --site-header-h: 72px;
  --page-max: 1240px;         /* slightly narrower for better line length */
  --aside-w: 420px;
  --gap: 26px;
  --gutter: 22px;
}

/* Base */
.page{
  min-height: 100vh;
  background: linear-gradient(180deg,#f6faf7 0%, #edf6ef 100%);
  padding-bottom: 32px;
}

/* Sticky local nav */
.jumpbar{
  position: sticky; top: 0; z-index: 9;
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  padding: 10px; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.jumpbar a{
  padding: 6px 12px; border-radius: 999px;
  text-decoration: none; color: #2e7d32; border: 1px solid rgba(0,0,0,0.12);
  background: #fff; font-size: .92rem; transition: all .15s ease;
}
.jumpbar a:hover{ background:#e8f5e9; }
.jumpbar a.active{ background:#2e7d32; color:#fff; border-color:#2e7d32; }

/* Hero */
.hero{ max-width: var(--page-max); margin: 10px auto 0; padding: 0 var(--gutter); }
.hero-inner{
  border:1px solid rgba(0,0,0,.06); border-radius:18px; background:#fff;
  box-shadow:0 14px 32px rgba(0,0,0,.08);
  padding:18px; display:grid; gap:16px; grid-template-columns: 1.4fr 1fr;
}
.hero h1{ margin: 4px 0 4px; font-size: clamp(2rem, 4vw, 2.6rem); color:#1b5e20; }
.lede{ margin: 0; color:#4f6757 }
.hero-points{ margin:0; padding:0; list-style:none; display:grid; gap:8px; align-content:center; }
.hero-points li{ display:flex; gap:8px; align-items:center; padding:8px 10px; border-radius:12px; background:#f4fbf6; border:1px solid rgba(0,0,0,.05); }
.hero-points span{ display:inline-grid; place-items:center; width:26px; height:26px; border-radius:999px; background:#e8f5e9; }

/* Sections */
section{ scroll-margin-top: calc(var(--site-header-h) + 10px); } /* fix anchor jump under sticky bar */
.section-grid{
  max-width: var(--page-max);
  margin: 18px auto 0;
  padding: 0 var(--gutter);
  display: grid;
  grid-template-columns: var(--aside-w) 1fr;
  gap: var(--gap);
  align-items: start;
  overflow: visible;
}

/* Alternating band */
.band{ position: relative; }
.band::before{
  content:""; position:absolute; inset:-12px 0 -12px 0;
  background: linear-gradient(180deg, rgba(231,247,235,.5), rgba(231,247,235,0));
  z-index: 0;
}
.band > *{ position: relative; z-index: 1; }

/* Sticky aside */
.aside{
  position: sticky;
  top: calc(var(--site-header-h) + 12px);
  align-self: start;
  background:#ffffffcc; backdrop-filter: blur(6px);
  border:1px solid rgba(0,0,0,.06); border-radius:16px;
  padding:16px;
  box-shadow:0 10px 22px rgba(0,0,0,.06);
}
.aside h2{ margin: 2px 0 6px; color:#1b5e20; }
.muted{ color:#51665a }
.bullets{ margin: 6px 0 0; padding-left: 18px; }
.bullets li{ margin: 4px 0; }

/* Cards for maps/components */
.content.card{
  border-radius:18px; background:#fff;
  border:1px solid rgba(0,0,0,.06); box-shadow:0 14px 32px rgba(0,0,0,.10);
  padding:10px;
}

/* Clip inner maps nicely */
.content.card :deep(.map-wrap),
.content.card :deep(.map){
  border-radius:14px; overflow:hidden;
  box-shadow:0 10px 24px rgba(0,0,0,.08);
}

/* ===== Size tuning ===== */
/* 1) CANOPY: force full width & tall map */
.shade-card :deep(.block){ max-width: none !important; padding: 0 !important; }
.shade-card :deep(.map-wrap){ height: 68vh !important; }

/* 2) WATER: side-by-side on desktop */
.water-grid{
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--gap);
  align-items: stretch;
}
.water-card :deep(.block){ max-width: none !important; padding: 0 !important; }
.water-card :deep(.map-wrap){ height: 60vh; }
.fountains-card{ display:flex; flex-direction: column; }
.subhead{ margin: 6px 8px 10px; color:#1b5e20; font-size:1.05rem; font-weight:800; }
.fountains-card :deep(.map-wrap){ height: 100%; min-height: 40vh; }

/* 3) ROUTE: keep compact */
.route-card :deep(.cool-route-wrap){ height: 54vh; }

/* Responsive */
@media (max-width: 1200px){
  .hero-inner{ grid-template-columns: 1fr; }
  .section-grid{ grid-template-columns: 1fr; }
  .aside{ position: static; }
  .water-grid{ grid-template-columns: 1fr; } /* stack map over nearby on tablet/mobile */
  .shade-card :deep(.map-wrap){ height: 56vh !important; }
  .water-card :deep(.map-wrap){ height: 52vh; }
  .fountains-card :deep(.map-wrap){ height: 48vh; }
  .route-card :deep(.cool-route-wrap){ height: 58vh; }
}
</style>
