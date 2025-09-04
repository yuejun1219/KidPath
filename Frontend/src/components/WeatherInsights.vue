<!-- src/components/WeatherInsights.vue -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import Papa from 'papaparse'
import {
  Chart,
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
  RadialLinearScale, ArcElement, PolarAreaController
} from 'chart.js'

Chart.register(
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
  RadialLinearScale, ArcElement, PolarAreaController
)

const props = defineProps({
  rainfallUrl: { type: String, required: true }, // BOM rainfall CSV
  windUrl:     { type: String, required: true }  // wind CSV: date,name,windgust,windspeed,winddir
})

/* ---------- State ---------- */
const loading = ref(true)
const err = ref('')

const monthsL12 = ref([])
const rainL12 = ref([])
const rainTotalL12 = computed(() => rainL12.value.reduce((a,b)=>a+b,0))
const wettest = ref({ month:'—', mm:0 })

const windBins = ref([0,0,0,0,0,0,0,0]) // N,NE,E,SE,S,SW,W,NW
const prevailing = computed(() => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  const i = windBins.value.indexOf(Math.max(...windBins.value))
  return dirs[i] ?? '—'
})

/* ---------- Utils ---------- */
function parseCSV(text){
  const out = Papa.parse(text.trim(), {
    skipEmptyLines: true,
    dynamicTyping: false
  })
  return out.data // array-of-arrays
}
function ym(dateStr){
  const d = new Date(dateStr)
  if (Number.isNaN(d)) return null
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function lastNMonths(n, end=new Date()){
  const arr = []
  const d = new Date(end.getFullYear(), end.getMonth(), 1)
  for (let i=n-1;i>=0;i--){
    const t = new Date(d.getFullYear(), d.getMonth()-i, 1)
    arr.push(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`)
  }
  return arr
}
function windBinIndex(deg){
  let d = (deg % 360 + 360) % 360
  if (d < 22.5 || d >= 337.5) return 0
  if (d < 67.5)  return 1
  if (d < 112.5) return 2
  if (d < 157.5) return 3
  if (d < 202.5) return 4
  if (d < 247.5) return 5
  if (d < 292.5) return 6
  return 7
}

/* smart header helpers */
function norm(s){ return String(s||'').trim().toLowerCase().replace(/\s+|[_\-\/()]/g,'') }
const MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12}
function toYMFromYearMonth(yearVal, monthVal){
  const y = parseInt(yearVal,10)
  const mRaw = String(monthVal||'').trim()
  let m = parseInt(mRaw,10)
  if (!Number.isFinite(m)){ m = MONTHS[norm(mRaw).slice(0,3)] }
  if (!y || !m) return null
  return `${y}-${String(m).padStart(2,'0')}`
}
function pickHeaderIndex(head, candidates){
  const norms = head.map(h => norm(h))
  for (let i=0;i<norms.length;i++){
    for (const c of candidates){
      if (c instanceof RegExp){
        if (c.test(norms[i])) return i
      }else{
        if (norms[i] === c) return i
      }
    }
  }
  return -1
}

/* ---------- Fetch + aggregate ---------- */
async function load(){
  try{
    loading.value = true
    err.value = ''

    /* ===== Rainfall (BOM) ===== */
    const rainTxt = await (await fetch(props.rainfallUrl, { cache:'no-store' })).text()
    const rainRows = parseCSV(rainTxt)
    if (rainRows.length < 2) throw new Error('Rainfall CSV: no data rows')

    const [head, ...rows] = rainRows
    const dIdx = pickHeaderIndex(head, [/^date$/])
    const yIdx = pickHeaderIndex(head, [/^year$/])
    const mIdx = pickHeaderIndex(head, [/^month$/])

    const rainIdx = pickHeaderIndex(head, [
      /(rain|rainfall|precip|precipitation).*(mm|millimetre)/,
      /^rainfallamount$/, /^rainfalltotal$/, /^totalrain$/, /^total$/,
      /^rain$/, /^rainfall$/, /^precip$/, /^precipitation$/, /^mm$/
    ])
    if (rainIdx < 0){
      console.warn('Rainfall CSV headers:', head)
      throw new Error('Rainfall CSV: missing rainfall column')
    }

    const monthly = new Map()
    for (const r of rows){
      const rainVal = parseFloat(r[rainIdx] ?? '0') || 0
      let key = null
      if (dIdx >= 0){
        key = ym(r[dIdx])
      } else if (yIdx >= 0 && mIdx >= 0){
        key = toYMFromYearMonth(r[yIdx], r[mIdx])
      }
      if (!key) continue
      monthly.set(key, (monthly.get(key) || 0) + rainVal)
    }
    if (monthly.size === 0){
      console.warn('Headers (no usable date parts):', head)
      throw new Error('Rainfall CSV: need a "Date" or both "Year" and "Month".')
    }

    const l12 = lastNMonths(12)
    monthsL12.value = l12
    rainL12.value   = l12.map(m => +(monthly.get(m)||0))

    let best = { month:'—', mm:0 }
    monthly.forEach((v,k)=>{ if (v>best.mm) best = {month:k, mm:v} })
    wettest.value = best

    /* ===== Wind (date,name,windgust,windspeed,winddir) ===== */
    const windTxt = await (await fetch(props.windUrl, { cache:'no-store' })).text()
    const windRows = parseCSV(windTxt)
    if (windRows.length < 2) throw new Error('Wind CSV: no data rows')

    const [wHead, ...wData] = windRows
    // exact positions for your schema (with Papa they’re correct even with commas in quotes)
    const dirIdx = pickHeaderIndex(wHead, [/^winddir$/])  // degrees
    let spdIdx = pickHeaderIndex(wHead, [/^windspeed$/])  // prefer windspeed
    if (spdIdx < 0) spdIdx = pickHeaderIndex(wHead, [/^windgust$/]) // fallback

    if (dirIdx < 0){
      console.warn('Wind CSV headers:', wHead)
      throw new Error('Wind CSV: missing "winddir" column')
    }

    function parseNum(cell){
      // Handles "12", "12.3", "12 km/h"
      const m = String(cell ?? '').match(/-?\d+(\.\d+)?/)
      return m ? parseFloat(m[0]) : NaN
    }

    const bins = [0,0,0,0,0,0,0,0]
    wData.forEach(r => {
      const deg = parseNum(r[dirIdx])
      if (!Number.isFinite(deg)) return
      let weight = 1
      if (spdIdx >= 0){
        const sp = parseNum(r[spdIdx])
        if (Number.isFinite(sp)) weight = Math.max(sp, 0.1)
      }
      bins[windBinIndex(deg)] += weight
    })
    windBins.value = bins.every(v=>v===0) ? [0.001,0.001,0.001,0.001,0.001,0.001,0.001,0.001] : bins

    // render
    loading.value = false
    await nextTick()
    mountCharts()
  }catch(e){
    err.value = e.message || 'Failed to load climate data'
    console.error(e)
    loading.value = false
  }
}

/* ---------- Charts ---------- */
let rainMini, windMini, rainFull, windFull
const rainMiniEl = ref(null)
const windMiniEl = ref(null)
const rainFullEl = ref(null)
const windFullEl = ref(null)

function mountCharts(){
  ;[rainMini, windMini, rainFull, windFull].forEach(c => c?.destroy?.())
  if (!rainMiniEl.value || !windMiniEl.value) return

  // Rain (mini)
  rainMini = new Chart(rainMiniEl.value.getContext('2d'), {
    type: 'line',
    data: {
      labels: monthsL12.value,
      datasets: [{
        label: 'Monthly rainfall (mm)',
        data: rainL12.value,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false }, tooltip: { mode:'index', intersect:false } },
      scales: { x: { display:false }, y: { display:false } },
      elements: { line: { borderJoinStyle:'round' } },
      maintainAspectRatio: false
    }
  })

  // Wind (mini)
  windMini = new Chart(windMiniEl.value.getContext('2d'), {
    type: 'polarArea',
    data: {
      labels: ['N','NE','E','SE','S','SW','W','NW'],
      datasets: [{ data: windBins.value }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false }, tooltip: { enabled:true } },
      scales: { r: { ticks: { display:false }, grid: { display:false } } },
      maintainAspectRatio: false
    }
  })

  // Rain (full)
  if (rainFullEl.value){
    rainFull = new Chart(rainFullEl.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: monthsL12.value,
        datasets: [{
          label: 'Monthly rainfall (mm)',
          data: rainL12.value,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display:false } },
        scales: { x: { title: { display:true, text:'Month' } },
                 y: { title: { display:true, text:'mm' }, beginAtZero:true } }
      }
    })
  }

  // Wind (full)
  if (windFullEl.value){
    windFull = new Chart(windFullEl.value.getContext('2d'), {
      type: 'polarArea',
      data: {
        labels: ['N','NE','E','SE','S','SW','W','NW'],
        datasets: [{ label:'Wind (speed-weighted)', data: windBins.value }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position:'bottom' } },
        scales: { r: { beginAtZero:true } }
      }
    })
  }
}

/* ---------- Modals ---------- */
const showRain = ref(false)
const showWind = ref(false)

/* ---------- Init ---------- */
onMounted(() => { load() })
</script>

<template>
  <section class="section-grid stack-first" id="climate">
    <aside class="aside reveal">
      <h2 class="title-underline">Climate (rain & wind)</h2>
      <p class="muted lead">Tiny glanceable charts. Open the full view if you want details.</p>

      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Rain (12 mo)</div>
          <div class="kpi-value">{{ Math.round(rainTotalL12).toLocaleString() }}<span> mm</span></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Wettest month</div>
          <div class="kpi-value">{{ wettest.month }}<span> · {{ Math.round(wettest.mm) }} mm</span></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Prevailing wind</div>
          <div class="kpi-value">{{ prevailing }}</div>
        </div>
      </div>
    </aside>

    <div class="content card climate-card reveal">
      <div v-if="loading" class="loading">Loading climate data…</div>
      <div v-else-if="err" class="err">{{ err }}</div>
      <div v-else class="mini-grid">
        <div class="mini">
          <header>
            <h3>Rainfall (last 12 months)</h3>
            <button class="btn-soft" @click="showRain=true">View full</button>
          </header>
          <div class="mini-chart">
            <canvas ref="rainMiniEl" aria-label="Rainfall sparkline"></canvas>
          </div>
        </div>

        <div class="mini">
          <header>
            <h3>Wind rose</h3>
            <button class="btn-soft" @click="showWind=true">View full</button>
          </header>
          <div class="mini-chart">
            <canvas ref="windMiniEl" aria-label="Wind rose"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Rain modal -->
    <dialog class="modal" :open="showRain" @close="showRain=false">
      <div class="modal-inner">
        <header><h3>Monthly rainfall</h3><button class="close" @click="showRain=false">✕</button></header>
        <canvas ref="rainFullEl" style="max-height: 52vh"></canvas>
      </div>
    </dialog>

    <!-- Wind modal -->
    <dialog class="modal" :open="showWind" @close="showWind=false">
      <div class="modal-inner">
        <header><h3>Wind rose (speed-weighted)</h3><button class="close" @click="showWind=false">✕</button></header>
        <canvas ref="windFullEl" style="max-height: 52vh"></canvas>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.kpis{
  margin-top: 10px;
  display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px;
}
@media (max-width: 900px){ .kpis{ grid-template-columns: 1fr; } }
.kpi{
  background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86));
  border:1px solid rgba(0,0,0,.06); border-radius:14px; padding:12px;
  box-shadow: 0 10px 24px rgba(0,0,0,.06);
}
.kpi-label{ color:#4a5f52; font-weight:700; font-size:.9rem; }
.kpi-value{ font-size:1.4rem; font-weight:900; color:#1b5e20; }
.kpi-value span{ font-size:.9rem; font-weight:700; color:#365a3d; margin-left:6px;}

.mini-grid{
  display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px;
}
@media (max-width: 900px){ .mini-grid{ grid-template-columns: 1fr; } }

.mini{
  padding:10px; border:1px solid rgba(0,0,0,.06); border-radius:14px;
  background:#fff; box-shadow: 0 10px 24px rgba(0,0,0,.06);
}
.mini header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.mini h3{ margin:0; font-size:1rem; color:#1b5e20; }
.btn-soft{
  background:#fff; color:#2e7d32; border:1px solid rgba(46,125,50,.25);
  padding:6px 10px; border-radius:999px; font-weight:700; cursor:pointer;
}
.mini-chart{ height: 140px; }

.loading{ padding:10px; color:#365a3d }
.err{ color:#a33; padding:10px; }

.modal{
  border:0; padding:0; margin:auto; width:min(900px, 92vw);
  background: transparent;
}
.modal::backdrop{ background: rgba(0,0,0,.25); }
.modal .modal-inner{
  background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:16px; padding:16px;
  box-shadow: 0 16px 40px rgba(0,0,0,.24);
}
.modal header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.modal .close{
  background:transparent; border:0; font-size:18px; cursor:pointer; color:#365a3d;
}
</style>
