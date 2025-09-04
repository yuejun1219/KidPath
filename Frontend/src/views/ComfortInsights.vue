<!-- src/views/ComfortInsights.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

import CanopySection from './CanopySection.vue'
import WaterAccess from '@/components/WaterAccess.vue'
import NearbyFountains from '@/components/NearbyFountains.vue'
import CoolRoute from '@/components/CoolRoute.vue'
import WeatherInsights from '@/components/WeatherInsights.vue'

/* ---------- cross-section plumbing ---------- */
const selectedSuburbs = ref([])
function onPlanCoolRoute(ids){
  selectedSuburbs.value = ids || []
  document.querySelector('#water')?.scrollIntoView({ behavior:'smooth' })
}

/* ---------- page-level reliability: mount maps after first paint ---------- */
const ready = ref(false)
function nudgeResize(times = 2){
  let i = 0
  const tick = () => {
    window.dispatchEvent(new Event('resize'))
    if (++i < times) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
const onPageShow = () => nudgeResize(2)
const onVisChange = () => { if (document.visibilityState === 'visible') nudgeResize(2) }

onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    ready.value = true
    nudgeResize(2)
  })
  window.addEventListener('pageshow', onPageShow)
  document.addEventListener('visibilitychange', onVisChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('pageshow', onPageShow)
  document.removeEventListener('visibilitychange', onVisChange)
})

/* ---------- Jumpbar active link (on scroll) ---------- */
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

/* ---------- Fancy-hero parallax ---------- */
const heroEl = ref(null)
function handleHeroMove(e) {
  const el = heroEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.style.setProperty('--parX', (x * 14) + 'px')
  el.style.setProperty('--parY', (y * 14) + 'px')
  el.style.setProperty('--tiltX', (x * 7) + 'deg')
  el.style.setProperty('--tiltY', (-y * 7) + 'deg')
}
onMounted(() => {
  heroEl.value?.addEventListener('mousemove', handleHeroMove, { passive: true })
})
onBeforeUnmount(() => {
  heroEl.value?.removeEventListener('mousemove', handleHeroMove)
})

/* ---------- reveal-on-scroll for text blocks ---------- */
let revealObs
function observeRevealsIn(scope = document) {
  const els = scope.querySelectorAll('.reveal:not(.visible)')
  els.forEach(el => revealObs?.observe(el))
}
onMounted(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'))
    return
  }
  revealObs = new IntersectionObserver(
    (entries, io) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          io.unobserve(e.target)
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  )
  observeRevealsIn(document)
})
onBeforeUnmount(() => { if (revealObs) revealObs.disconnect() })

/* ---------- Water tabs ---------- */
const waterMode = ref('overview')  // 'overview' | 'nearby'

function forceRevealInWater() {
  // Make sure newly mounted .reveal content in #water is visible
  const wrap = document.getElementById('water')
  if (!wrap) return
  wrap.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'))
}

function switchWaterMode(mode) {
  if (mode !== 'overview' && mode !== 'nearby') return
  if (waterMode.value === mode) return
  waterMode.value = mode
  nextTick(() => {
    forceRevealInWater()  // <— fix: reveal newly mounted card
    nudgeResize(3)        // <— fix: maps re-measure after DOM swap
  })
}
</script>

<template>
  <main class="page">


 <!-- HERO -->
<header class="hero fancy-hero full-bleed" ref="heroEl">
  <div class="bg">
    <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
    <div class="spark s1"></div><div class="spark s2"></div><div class="spark s3"></div>
  </div>

  <div class="hero-inner hero-grid">
    <!-- Left: Big copy -->
    <div class="hero-copy">
      <p class="eyebrow">KidPath · Comfort Insights</p>
      <h1 class="headline-xl">
        Cooler walks, <span class="grad">happier kids</span>.
      </h1>
      <p class="lede-xl">
        Plan <strong>shade-first</strong> routes and find <strong>nearby drinking water</strong>, all in one place.
      </p>

      <div class="cta-row">
        <!-- SINGLE primary CTA -->
        <a class="btn btn-primary" href="#route">🧭 Plan a route</a>

        <!-- Optional secondary: links to shade section (not Water to avoid dup) -->

      </div>

      <!-- Two-segment quick nav (no Plan here to avoid duplication) -->
      <div class="mode-switch glass small">
        <a class="seg" href="#shade"><i>🌳</i><span>Shade</span></a>
        <a class="seg" href="#water"><i>🚰</i><span>Water</span></a>
      </div>
    </div>

    <!-- Right: Animated route graphic (SVG) -->
    <div class="hero-graphic">
      <svg class="route-illo" viewBox="0 0 360 240" fill="none" aria-hidden="true">
        <!-- soft card -->
        <rect x="8" y="8" width="344" height="224" rx="18"
              fill="#fff" stroke="rgba(0,0,0,.06)"/>
        <!-- parks blobs -->
        <circle cx="70" cy="70" r="26" fill="#e8f5e9"/>
        <circle cx="300" cy="100" r="20" fill="#e8f5e9"/>
        <circle cx="210" cy="55" r="14" fill="#e8f5e9"/>

        <!-- dashed path (animated) -->
        <path id="routePath"
              d="M60 180 C 110 150, 160 120, 190 140 S 280 190, 300 110"
              stroke="#2e7d32" stroke-width="4" stroke-linecap="round"
              stroke-dasharray="8 10" />

        <!-- moving dot -->
        <circle r="6" fill="#0d47a1">
          <animateMotion dur="6s" repeatCount="indefinite" keyTimes="0;1"
                         keySplines="0.25 0.1 0.25 1" calcMode="spline">
            <mpath xlink:href="#routePath"/>
          </animateMotion>
        </circle>

        <!-- start/end pins -->
        <g>
          <circle cx="60"  cy="180" r="7" fill="#2e7d32"/>
          <circle cx="300" cy="110" r="7" fill="#2e7d32"/>
        </g>
      </svg>

      <!-- (Optional) drop-in GIF/Lottie goes here -->
      <!-- <img class="hero-gif" src="/img/walk-loop.gif" alt="" decoding="async" /> -->
    </div>
  </div>

  <svg class="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,10 1440,60 L1440,120 L0,120 Z"></path>
  </svg>
</header>


    <!-- SHADE / CANOPY (STACKED) -->
    <section id="shade" class="section-grid band stack-first">
      <aside class="aside reveal">
        <h2 class="title-underline">Tree canopy by suburb</h2>
        <p class="muted lead">
          Suburb-level distribution of tree cover. Taller bars and deeper greens
          mean a suburb has more canopy—handy for choosing greener neighbourhoods.
        </p>

        <div class="info-cards">
          <div class="info-card">
            <div class="icon">🌡️</div>
            <div class="title">Cooler micro-climate</div>
            <div class="desc">&gt;30% canopy can feel about 2–3°C cooler on hot days.</div>
          </div>
          <div class="info-card">
            <div class="icon">🧭</div>
            <div class="title">Compare & zoom</div>
            <div class="desc">Use the list; double-click a row to zoom the map.</div>
          </div>
          <div class="info-card">
            <div class="icon">🛤️</div>
            <div class="title">Street-level picks</div>
            <div class="desc">Want shady paths? Try <b>Plan a route</b> below.</div>
          </div>
        </div>
      </aside>

      <div class="content card shade-card reveal">
        <CanopySection v-if="ready" @planCoolRoute="onPlanCoolRoute" />
      </div>
    </section>
    <!-- CLIMATE (compact!) -->
    <section id="climate" class="section-grid stack-first">
      <aside class="aside reveal">
        <h2 class="title-underline">Local climate</h2>
        <p class="muted lead">Quick glance at rain & wind — without making the page long.</p>
      </aside>
      <div class="content card reveal">
        <WeatherInsights
          rainfallUrl="https://weather-data-kidpath.s3.ap-southeast-2.amazonaws.com/Rainfall_Data_2014-2025(July).csv"
          windUrl="https://weather-data-kidpath.s3.ap-southeast-2.amazonaws.com/Wind_Data.csv"
        />
      </div>
    </section>

    <!-- WATER (STACKED) -->
    <section id="water" class="section-grid stack-first">
      <aside class="aside reveal">
        <h2 class="title-underline">Drinking water access</h2>
        <p class="muted lead">
          Find refill-friendly places quickly. Suburb coverage first; then check taps near a point.
        </p>

        <!-- Overview / Nearby tabs -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: waterMode === 'overview' }"
            @click="switchWaterMode('overview')"
            :aria-pressed="waterMode === 'overview'">
            Overview
          </button>
          <button
            class="tab"
            :class="{ active: waterMode === 'nearby' }"
            @click="switchWaterMode('nearby')"
            :aria-pressed="waterMode === 'nearby'">
            Nearby
          </button>
        </div>

        <!-- Info cards -->
        <div class="info-cards">
          <div class="info-card">
            <div class="icon">🏞️</div>
            <div class="title">Hotspots</div>
            <div class="desc">Parks & trails often cluster fountains together.</div>
          </div>
          <div class="info-card">
            <div class="icon">🌳</div>
            <div class="title">Combine with shade</div>
            <div class="desc">Pick cooler destinations with both trees and taps.</div>
          </div>
          <div class="info-card">
            <div class="icon">🧭</div>
            <div class="title">Along your route</div>
            <div class="desc">Plan a route first, then switch to “Nearby” for taps.</div>
          </div>
        </div>
      </aside>

      <!-- Overview map -->
      <div
        v-if="waterMode==='overview'"
        key="water-overview"
        class="stack-col content card water-card reveal">
        <WaterAccess v-if="ready" :focusSuburbs="selectedSuburbs" />
      </div>

      <!-- Nearby map -->
      <div
        v-else
        key="water-nearby"
        class="stack-col content card fountains-card reveal">
        <NearbyFountains v-if="ready" />
      </div>
    </section>

    <!-- ROUTE (STACKED) -->
    <section id="route" class="section-grid band stack-first">
      <aside class="aside reveal">
        <h2 class="title-underline">Plan a cool route</h2>
        <p class="muted lead">
          Street-level routing that favours shade. Pick two points; we’ll score walking options using nearby parks & street trees.
        </p>

        <div class="info-cards">
          <div class="info-card">
            <div class="icon">📍</div>
            <div class="title">Pick start & end</div>
            <div class="desc">We’ll fetch alternative walking paths.</div>
          </div>
          <div class="info-card">
            <div class="icon">🎚️</div>
            <div class="title">Tune shade bias</div>
            <div class="desc">Nudge the mix of parks vs street trees.</div>
          </div>
          <div class="info-card">
            <div class="icon">💧</div>
            <div class="title">Refill stops</div>
            <div class="desc">After choosing a route, scroll to Water for taps.</div>
          </div>
        </div>
      </aside>

      <div class="content card route-card reveal">
        <CoolRoute
          v-if="ready"
          parksUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/parks.geojson"
          treesUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/trees.geojson"
          grassUrl="https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com/grass.geojson"
        />
      </div>
    </section>
    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2025 KidPath. Helping families explore safely.</p>
      </div>
    </footer>
  </main>
</template>

<style scoped>
/* ========= Design tokens ========= */
:root{
  --page-max: 1140px;
  --gutter: clamp(20px, 5vw, 56px);
  --inner-pad: clamp(16px, 4vw, 28px);
  --gap: 26px;

  --card-radius: 18px;
  --card-border: 1px solid rgba(0,0,0,.06);
  --shadow-1: 0 6px 14px rgba(0,0,0,.06);
  --shadow-2: 0 12px 28px rgba(0,0,0,.08);
  --shadow-3: 0 18px 40px rgba(0,0,0,.10);
}

/* make padding part of width so nothing overflows */
*, *::before, *::after { box-sizing: border-box; }

/* ========= Page frame (light green, with clear side margins) ========= */
.page{
  min-height: 100vh;
  background: linear-gradient(180deg, #f2fbf4 0%, #e8f6ec 100%);
  padding-inline: var(--gutter);     /* visible L/R space at all sizes */
  padding-top: 0;
  padding-bottom: 36px;
  overflow-x: hidden;                /* kill accidental horizontal scroll */
  position: relative;
}

/* Every direct child of .page is centered and width-limited */
.page > header,
.page > section,
.page > nav {
  max-width: var(--page-max);
  margin-inline: auto;
  width: 100%;
  padding-inline: var(--inner-pad);  /* inner breathing room */
}

/* ========= Sticky jumpbar ========= */
.jumpbar{
  position: sticky; top: 0; z-index: 9;
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  padding: 10px var(--inner-pad);
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
}
.jumpbar a{
  padding: 6px 12px; border-radius: 999px;
  text-decoration: none; color: #2e7d32; border: 1px solid rgba(0,0,0,0.12);
  background: #fff; font-size: .92rem; transition: all .15s ease;
}
.jumpbar a:hover{ background:#e8f5e9; }
.jumpbar a.active{ background:#2e7d32; color:#fff; border-color:#2e7d32; }

/* ========= Sections ========= */
.section-grid{
  margin: 24px auto 0;
  display: grid;
  grid-template-columns: minmax(280px, 420px) 1fr; /* aside | content */
  gap: var(--gap);
  align-items: start;
}
.section-grid.stack-first{ grid-template-columns: 1fr; }
.section-grid.stack-first .aside{ grid-column: 1 / -1; margin-bottom: 10px; }
.section-grid.stack-first > .content,
.section-grid.stack-first > .stack-col{ grid-column: 1 / -1; }
.section-grid:last-of-type{ margin-bottom: 28px; }

@media (max-width: 1100px){
  .section-grid{ grid-template-columns: 1fr; }
}

/* ========= Aside card ========= */
.aside{
  align-self: start;
  padding: 16px 18px;
  border-radius: 16px;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
  overflow: hidden;
}
.title-underline{
  margin: 0 0 8px;
  color:#1b5e20;
  position: relative;
  display: inline-block;
}
.title-underline::after{
  content:"";
  position:absolute; left:0; right:0; bottom:-4px; height:6px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e8f5e9, #bbdefb);
  transform: scaleX(.4);
  transform-origin: left center;
  transition: transform .35s ease;
}
.aside:hover .title-underline::after{ transform: scaleX(1); }
.lead{ margin-top: 4px; }

/* ========= Info cards ========= */
.info-cards{
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 900px){
  .info-cards{ grid-template-columns: 1fr; }
}
.info-card{
  background:
    linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,.85)),
    radial-gradient(120% 80% at 10% 0%, rgba(46,125,50,.06), transparent 60%);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  display: grid; grid-template-columns: auto 1fr; column-gap: 10px; row-gap: 4px;
  align-items: start;
}
.info-card .icon{ font-size: 22px; line-height: 1; }
.info-card .title{ font-weight: 800; color:#1b5e20; margin-top: -2px }
.info-card .desc{ grid-column: 1 / -1; color:#4a5f52; font-size: .92rem }
.info-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(0,0,0,.10);
  border-color: rgba(46,125,50,.25);
}

/* ========= Water tabs ========= */
#water .tabs{ display:flex; gap:10px; margin:12px 0 6px; }
#water .tab{
  padding:6px 12px; border-radius:999px; cursor:pointer;
  background:#fff; border:1px solid rgba(0,0,0,.15); color:#2e7d32;
  font-size:.92rem; transition: background .15s ease, border-color .15s ease, transform .1s ease;
}
#water .tab:hover{ transform: translateY(-1px); }
#water .tab.active{ background:#e8f5e9; border-color:#2e7d32; }

/* ========= Map cards ========= */
.content.card{
  border-radius: var(--card-radius);
  background:#fff;
  border: var(--card-border);
  box-shadow: var(--shadow-3), var(--shadow-1);
  padding: 10px;
}
.content.card :deep(.map-wrap),
.content.card :deep(.map){
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
}

/* heights */
.shade-card     :deep(.map-wrap){ height: 64vh !important; }
.water-card     :deep(.map-wrap){ height: 60vh !important; }
.fountains-card :deep(.map-wrap){ height: 62vh !important; }
.route-card     :deep(.cool-route-wrap){ height: 52vh !important; }

<<<<<<< HEAD
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

/* Footer */
.footer {
  background: #2e7d32;
  color: white;
  text-align: center;
  padding: 30px 0;
}

.footer p {
  margin: 0;
  font-size: 1rem;
}

/* Responsive */
=======
>>>>>>> avirukth
@media (max-width: 1200px){
  .shade-card     :deep(.map-wrap){ height: 50vh !important; }
  .water-card     :deep(.map-wrap){ height: 46vh !important; }
  .fountains-card :deep(.map-wrap){ height: 46vh !important; }
  .route-card     :deep(.cool-route-wrap){ height: 54vh !important; }
}

/* ========= Reveal-on-scroll ========= */
.reveal{
  opacity: 0;
  transform: translateY(14px) scale(.98);
  filter: blur(6px);
  transition: opacity .6s ease, transform .6s ease, filter .6s ease;
}
.reveal.visible{
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: none;
}

/* ========= Fancy hero + chips ========= */
.fancy-hero{ position: relative; isolation: isolate; overflow: hidden; }
.fancy-hero .hero-inner{
  border: var(--card-border);
  border-radius: 20px;
  background:
    radial-gradient(900px 300px at -10% -10%, rgba(13,71,161,0.10), transparent 60%),
    radial-gradient(800px 280px at 110% 10%, rgba(46,125,50,0.10), transparent 60%),
    #fff;
  box-shadow: var(--shadow-3), var(--shadow-1);
  padding: clamp(16px, 3.5vw, 26px);
  display:grid; gap: clamp(12px, 2.5vw, 18px); grid-template-columns: 1.4fr 1fr;
  overflow: hidden;
}
@media (max-width: 1100px){ .fancy-hero .hero-inner{ grid-template-columns: 1fr; } }
.fancy-hero .bg{
  position:absolute; inset: 0; z-index: 2; overflow:hidden; pointer-events:none;
}
.blob{ position:absolute; width: 320px; height: 320px; filter: blur(22px); opacity: .25; border-radius: 50%; animation: blobFloat 14s ease-in-out infinite; }
.b1{ background: #bbdefb; top:-80px; left:-80px; animation-delay: 0s; }
.b2{ background: #c8e6c9; bottom:-120px; right:-60px; animation-delay: 2.2s; }
.b3{ background: #e1f5fe; top: 30%; right: 12%; width: 220px; height: 220px; animation-delay: 1.1s; }
.spark{ position:absolute; width: 10px; height: 10px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff, #a5d6a7 60%, #81c784 100%); opacity: .9; animation: spark 6s linear infinite; }
.s1{ left: 12%; top: 28%; animation-delay: .2s }
.s2{ left: 22%; top: 18%; animation-delay: 1.2s }
.s3{ left: 32%; top: 26%; animation-delay: 2.0s }
@keyframes blobFloat{ 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-18px) } }

.parallax{ list-style:none; margin:0; padding:0; display:grid; gap:10px; align-content:center; }
.chip{
  display:flex; align-items:center; gap:8px; padding:10px 12px;
  background:#f4fbf6; border:1px solid rgba(0,0,0,.06); border-radius: 14px;
  transform: translate3d(var(--parX,0), var(--parY,0), 0) rotateX(var(--tiltY,0)) rotateY(var(--tiltX,0));
  transition: transform .12s ease, background .12s ease;
}
.chip span{ display:inline-grid; place-items:center; width:28px; height:28px; border-radius: 999px; background:#e8f5e9; }

/* ========= Hero wave (animated, no overflow) ========= */
.wave{ display:block; width:100%; height:90px; margin-top:8px; z-index:1; overflow: hidden; }
.wave path{ fill:#e8f5e9; }

@media (prefers-reduced-motion: no-preference){
  @keyframes spark{
    0%{ transform: translateY(0) scale(.8); opacity: 0; }
    15%{ opacity: 1; }
    70%{ transform: translateY(-28px) scale(1.05); opacity: .9; }
    100%{ transform: translateY(-36px) scale(.9); opacity: 0; }
  }
  @keyframes waveBob{
    0%,100%{ transform: translateX(0) }
    50%{ transform: translateX(-22px) }
  }
  .wave path{
    transform-origin: 50% 50%;
    animation: waveBob 7.5s ease-in-out infinite;
  }
}

.page{
  /* bigger, always-visible side space */
  padding-inline: clamp(10px, 4vw, 20px);
}

/* 2) Center the inner content and give it its own breathing room */

.page > section,
.page > nav{
  max-width: var(--page-max);
  margin-inline: auto;
  /* inner space inside the centered block */
  padding-inline: clamp(16px, 3.5vw, 32px);
}

/* 3) Make every “card” sit off the edges too */
.content.card{
  margin-inline: clamp(4px, 1vw, 22px); /* adds visible margin around cards */
  border-radius: var(--card-radius);
}

/* 4) Safety: ensure map wrappers don’t overflow and hug the edges */
.content.card :deep(.map-wrap){
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
}

/* 5) Optional: if a child sets width:100vw anywhere, neutralize it inside the page */
.page [style*="100vw"]{ width: 100% !important; }

.hero {
  max-width: none !important;   /* ignore page limit */
  padding-inline: 0 !important; /* no inner padding */
  margin-inline: 0 !important;  /* stretch full width */
  width: 100vw;                 /* span viewport */
}
/* Full-bleed utility: cancels page gutters & child padding */
.full-bleed{
  /* ignore the child max-width/padding set by `.page > section, header, nav` */
  max-width: none !important;
  padding-inline: 0 !important;

  /* pull outward to cancel the .page side gutters */
  margin-inline: calc(var(--gutter) * -1);

  /* ensure it spans the viewport on huge screens too */
  width: auto;
}

/* Make the content truly edge-to-edge */
.full-bleed .content.card{
  margin-inline: 0;
  border-radius: 0;
  box-shadow: none;
  border-left: 0;
  border-right: 0;
}

/* Hero specific: remove rounding and make the wave full width */
.fancy-hero{ border-radius: 0 !important; }
.fancy-hero .hero-inner{ border-radius: 0; }
.fancy-hero .wave{
  width: 100vw; max-width: none;
  position: relative; left: 50%; transform: translateX(-50%);
}
/* Make ONLY the hero truly full-bleed (ignores parent padding/max-width) */
.page > header.hero{
  /* escape the page’s gutters */
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw !important;
  margin-right: -50vw !important;

  /* span the viewport */
  width: 100vw !important;
  max-width: 100vw !important;

  /* remove inner padding added by the centering rule */
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Optional: remove the inset card look so edges really touch */
.hero .hero-inner{
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

/* Ensure the wave is also full width */
.hero .wave{
  width: 100vw !important;
  max-width: 100vw !important;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

/* Make the entire route section full-bleed */
.page > section#route{
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  width: 100vw !important;
  max-width: 100vw !important;
  padding: 0 !important;   /* no inner padding */
}
#route .route-card :deep(.cool-route-wrap){
  height: 100vh !important;  /* take full browser height */
  width: 100% !important;
}

/* ===== Bigger, bolder hero type ===== */
.headline-xl{
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  /* scales nicely from mobile to desktop */
  font-size: clamp(32px, 4.6vw, 64px);
  margin: 2px 0 8px;
}
.lede-xl{
  font-size: clamp(16px, 1.6vw, 20px);
  color: #365a3d;
  max-width: 48ch;
  margin-bottom: clamp(14px, 2.2vw, 18px);
}
.grad{
  background: linear-gradient(90deg, #2e7d32 0%, #0d47a1 85%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* ===== Primary/soft buttons (hero only) ===== */
.btn-primary{
  background: #2e7d32; color:#fff; border: 1px solid #2e7d32;
  padding: 10px 16px; border-radius: 999px; font-weight: 700;
  box-shadow: 0 10px 24px rgba(46,125,50,.25);
}
.btn-primary:hover{ filter: brightness(1.05); transform: translateY(-1px); }
.btn-soft{
  background: #ffffff; color:#2e7d32; border:1px solid rgba(46,125,50,.25);
  padding: 10px 16px; border-radius: 999px; font-weight: 700;
}
.cta-row{ display:flex; gap:10px; flex-wrap:wrap; }

/* ===== Hero layout: copy left, graphics right ===== */
.hero-grid{
  display:grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items:center;
  gap: clamp(12px, 3vw, 24px);
  padding-block: clamp(22px, 6vw, 48px);
}
.hero-right{ display:grid; gap: 14px; align-content:center; }

/* ===== Segmented quick nav (replaces those 3 small pills at the very top) ===== */
.mode-switch{
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 10px;
  padding: 10px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86));
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 14px 36px rgba(0,0,0,.10);
}
.mode-switch .seg{
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration:none;
  border: 1px solid rgba(0,0,0,.08);
  background:#f7fbf8;
  color:#275e2b; font-weight: 800;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
}
.mode-switch .seg:hover{ transform: translateY(-1px); background:#eef7f0; }
.mode-switch .seg.primary{
  background:#2e7d32; color:#fff; border-color:#2e7d32;
  box-shadow: 0 10px 22px rgba(46,125,50,.25);
}
.mode-switch .seg i{ font-style: normal; }

/* Stack nicely on small screens */
@media (max-width: 900px){
  .hero-grid{ grid-template-columns: 1fr; }
  .mode-switch{ grid-template-columns: 1fr; }
}

/* ===== Tweak existing hero visuals so it feels more “graphic” ===== */
.fancy-hero .hero-inner{
  border-radius: 0; /* flat card inside full-bleed */
  background:
    radial-gradient(1100px 320px at -10% -20%, rgba(13,71,161,0.08), transparent 60%),
    radial-gradient(1000px 300px at 120% 0%, rgba(46,125,50,0.10), transparent 60%),
    #ffffff;
}

/* Keep your chips but give them a bit more presence next to big type */
.chip{ font-weight: 600; }
.chip span{ width:30px; height:30px; }

/* Optional: keep the sticky jumpbar, but it’s no longer your primary CTA.
   If you want it to feel subtler, lower its contrast a touch: */
.jumpbar{ background: rgba(255,255,255,0.78); }
.fancy-hero .hero-inner{
  padding: clamp(20px, 8vw, 30px) clamp(24px, 6vw, 64px);
}

.hero-copy{
  padding-block: clamp(12px, 3vw, 32px);
}

.cta-row{
  margin-top: clamp(16px, 3vw, 36px);
}

/* give the right-side chips & mode switch more breathing room */
.hero-right{
  gap: clamp(18px, 3vw, 32px);
  padding-block: clamp(12px, 2vw, 28px);
}

/* Bigger, bolder hero (kept from previous step) */
.headline-xl{ font-weight:900; line-height:1.05; letter-spacing:-.02em;
  font-size:clamp(32px,4.6vw,64px); margin:2px 0 8px; }
.lede-xl{ font-size:clamp(16px,1.6vw,20px); color:#365a3d; max-width:48ch; margin-bottom:clamp(14px,2.2vw,18px); }
.grad{ background:linear-gradient(90deg,#2e7d32 0%,#0d47a1 85%); -webkit-background-clip:text; background-clip:text; color:transparent; }

.hero-grid{
  display:grid; grid-template-columns: 1.1fr 0.9fr; align-items:center;
  gap: clamp(14px,3vw,28px);
  padding: clamp(36px,8vw,88px) clamp(24px,6vw,64px);
}
@media (max-width: 900px){ .hero-grid{ grid-template-columns:1fr; } }

.cta-row{ display:flex; gap:10px; flex-wrap:wrap; margin-top: clamp(16px,3vw,28px); }
.btn-primary{
  background:#2e7d32; color:#fff; border:1px solid #2e7d32; padding:10px 16px; border-radius:999px;
  font-weight:700; box-shadow:0 10px 24px rgba(46,125,50,.25); transition:transform .12s ease, filter .12s ease;
}
.btn-primary:hover{ filter:brightness(1.05); transform:translateY(-1px); }
.btn-soft{
  background:#fff; color:#2e7d32; border:1px solid rgba(46,125,50,.25); padding:10px 16px; border-radius:999px; font-weight:700;
}

/* Two-segment switch — small footprint */
.mode-switch.small{ margin-top:12px; padding:8px; }
.mode-switch.small .seg{ padding:8px 10px; font-weight:800; }
.mode-switch{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr));
  gap:10px; border-radius:16px; background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.86));
  border:1px solid rgba(0,0,0,.06); box-shadow:0 14px 36px rgba(0,0,0,.10); }
.mode-switch .seg{
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:10px 12px; border-radius:12px; text-decoration:none;
  border:1px solid rgba(0,0,0,.08); background:#f7fbf8; color:#275e2b;
  transition:transform .12s ease, background .12s ease, border-color .12s ease;
}
.mode-switch .seg:hover{ transform:translateY(-1px); background:#eef7f0; }
.mode-switch .seg i{ font-style:normal; }

/* Animated route illustration */
.hero-graphic{ display:grid; place-items:center; }
.route-illo{
  width: min(520px, 100%);
  height: auto;
  filter: drop-shadow(0 16px 36px rgba(0,0,0,.10));
}

/* Optional GIF/Lottie slot if you use it */
.hero-gif{ width:140px; height:auto; position:absolute; right:14px; bottom:14px; }

/* Respect reduced-motion */
@media (prefers-reduced-motion: reduce){
  .route-illo animateMotion { display:none; } /* stop dot motion */
}

</style>
