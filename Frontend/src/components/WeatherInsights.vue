<!-- src/components/WeatherInsights.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
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

/* ===== Tunables ===== */
const WINDY_SPEED_KMH = 20  // a day is “windy” if avg speed ≥ 20
const WINDY_GUST_KMH  = 35  // …or gust ≥ 35

/* ===== Props ===== */
const props = defineProps({
  rainfallUrl: { type: String, required: true }, // BoM rainfall CSV
  windUrl:     { type: String, required: true }  // CSV: date,name,windgust,windspeed,winddir
})


const rainDlg = ref(null)
const windDlg = ref(null)

/* ===== State ===== */
const loading = ref(true)
const err = ref('')

const monthsL12 = ref([])               // last 12 months (of available data)
const rainL12   = ref([])               // mm per month (last 12)
const wettest   = ref({ month:'—', mm:0 })

const windBins  = ref([0,0,0,0,0,0,0,0])// wind rose (N..NW)
const monthlyWindyDays = ref(new Map()) // 'YYYY-MM' -> windy day count
const monthlyDays      = ref(new Map()) // 'YYYY-MM' -> calendar day count

/* NEW: climatology (across ALL years) keyed by month-of-year (1..12) */
const climoRainSum   = ref(Array(13).fill(0))
const climoRainCnt   = ref(Array(13).fill(0))
const climoWindPctSum= ref(Array(13).fill(0))
const climoWindPctCnt= ref(Array(13).fill(0))

/* Dialog flags (for “Open chart”) */
const showRain = ref(false)
const showWind = ref(false)

/* KPIs */
const rainTotalL12 = computed(() => rainL12.value.reduce((a,b)=>a+b,0))
const prevailing = computed(() => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  const i = windBins.value.indexOf(Math.max(...windBins.value))
  return i >= 0 ? dirs[i] : '—'
})

/* ===== Utils ===== */
function parseCSV(text){
  const out = Papa.parse(text.trim(), { skipEmptyLines:true, dynamicTyping:false })
  return out.data
}
function ym(dateStr){
  const d = new Date(dateStr)
  if (Number.isNaN(d)) return null
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function lastNMonths(n, end){
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
      }else if (norms[i] === c){
        return i
      }
    }
  }
  return -1
}
function parseNum(cell){
  const m = String(cell ?? '').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : NaN
}
function daysInCalendarMonth(ymKey){
  const [yy, mm] = ymKey.split('-').map(Number)
  return new Date(yy, mm, 0).getDate()
}

/* ===== Fetch + aggregate ===== */
async function load(){
  try{
    loading.value = true
    err.value = ''

    /* --- Rainfall --- */
    const rainTxt  = await (await fetch(props.rainfallUrl, { cache:'no-store' })).text()
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
    if (rainIdx < 0) throw new Error('Rainfall CSV: missing rainfall column')

    const monthly = new Map() // ym -> mm
    const overallMonths = new Set()
    for (const r of rows){
      const rainVal = parseFloat(r[rainIdx] ?? '0') || 0
      let key = null
      if (dIdx >= 0){ key = ym(r[dIdx]) }
      else if (yIdx >= 0 && mIdx >= 0){ key = toYMFromYearMonth(r[yIdx], r[mIdx]) }
      if (!key) continue
      monthly.set(key, (monthly.get(key) || 0) + rainVal)
      overallMonths.add(key)
    }
    if (monthly.size === 0) throw new Error('Rainfall CSV: no usable dates')

    // latest real month in the dataset
    const sortedMonths = [...monthly.keys()].sort()
    const latestKey = sortedMonths[sortedMonths.length - 1]
    const latestDate = new Date(latestKey + '-01')

    // last 12 strip
    const l12 = lastNMonths(12, latestDate)
    monthsL12.value = l12
    rainL12.value   = l12.map(m => +(monthly.get(m)||0))

    // wettest month (overall)
    let best = { month:'—', mm:0 }
    monthly.forEach((v,k)=>{ if (v>best.mm) best = {month:k, mm:v} })
    wettest.value = best

    // build rainfall climatology by month-of-year
    for (const mKey of overallMonths){
      const [, mm] = mKey.split('-').map(Number)
      climoRainSum[mm] += monthly.get(mKey) || 0
      climoRainCnt[mm] += 1
    }
    const rainSum = Array(13).fill(0)
const rainCnt = Array(13).fill(0)
for (const mKey of overallMonths){
  const mm = Number(mKey.slice(5,7)) // 'YYYY-MM' → MM
  rainSum[mm] += monthly.get(mKey) || 0
  rainCnt[mm] += 1
}
climoRainSum.value = rainSum
climoRainCnt.value = rainCnt

    /* --- Wind (daily → monthly windy-day counts + wind rose) --- */
    const windTxt  = await (await fetch(props.windUrl, { cache:'no-store' })).text()
    const windRows = parseCSV(windTxt)
    if (windRows.length < 2) throw new Error('Wind CSV: no data rows')

    const [wHead, ...wData] = windRows
    const dateIdx = pickHeaderIndex(wHead, [/^date$/])
    const dirIdx  = pickHeaderIndex(wHead, [/^winddir$/])
    let spdIdx    = pickHeaderIndex(wHead, [/^windspeed$/])
    let gstIdx    = pickHeaderIndex(wHead, [/^windgust$/])
    if (dirIdx < 0)  throw new Error('Wind CSV: missing "winddir" column')
    if (dateIdx < 0) throw new Error('Wind CSV: missing "date" column')

    const bins = [0,0,0,0,0,0,0,0]
    const windySetByYM = new Map()   // ym -> Set(day)
    const daysByYM     = new Map()   // ym -> Set(day)

    wData.forEach(r => {
      const dateStr = r[dateIdx]
      const d = new Date(dateStr)
      if (Number.isNaN(d)) return
      const kYM  = ym(dateStr)
      const kDay = dateStr?.slice(0,10)

      // wind rose (speed-weighted)
      const deg = parseNum(r[dirIdx])
      if (Number.isFinite(deg)){
        let weight = 1
        if (spdIdx >= 0){
          const sp = parseNum(r[spdIdx])
          if (Number.isFinite(sp)) weight = Math.max(sp, 0.1)
        }
        bins[windBinIndex(deg)] += weight
      }

      // windy day counting
      const sp = spdIdx >= 0 ? parseNum(r[spdIdx]) : NaN
      const gs = gstIdx >= 0 ? parseNum(r[gstIdx]) : NaN
      const isWindy = (Number.isFinite(sp) && sp >= WINDY_SPEED_KMH) ||
                      (Number.isFinite(gs) && gs >= WINDY_GUST_KMH)
      if (!kYM || !kDay) return
      if (!daysByYM.has(kYM)) daysByYM.set(kYM, new Set())
      daysByYM.get(kYM).add(kDay)
      if (isWindy){
        if (!windySetByYM.has(kYM)) windySetByYM.set(kYM, new Set())
        windySetByYM.get(kYM).add(kDay)
      }
    })

    // wind rose dataset
    windBins.value = bins.every(v=>v===0) ? bins.map(()=>0.001) : bins

    const wSum = Array(13).fill(0)
const wCnt = Array(13).fill(0)
for (const k of daysByYM.keys()){
  const mm  = Number(k.slice(5,7))
  const wd  = (windySetByYM.get(k)?.size || 0)
  const dd  = (daysByYM.get(k)?.size || daysInCalendarMonth(k))
  const pct = dd ? (wd/dd)*100 : 0
  wSum[mm] += pct
  wCnt[mm] += 1
}
climoWindPctSum.value = wSum
climoWindPctCnt.value = wCnt
    // monthly windy-day counts aligned to last 12 + total days
    const windyCount = new Map()
    const dayCount   = new Map()
    const allYMKeys  = [...daysByYM.keys()]
    monthsL12.value.forEach(k => {
      windyCount.set(k, windySetByYM.has(k) ? windySetByYM.get(k).size : 0)
      dayCount.set(k,   daysByYM.has(k)      ? daysByYM.get(k).size      : daysInCalendarMonth(k))
    })
    monthlyWindyDays.value = windyCount
    monthlyDays.value      = dayCount

    // build wind climatology by month-of-year (% windy days)
    for (const k of allYMKeys){
      const [, m] = k.split('-').map(Number)
      const wd = (windySetByYM.get(k)?.size || 0)
      const dd = (daysByYM.get(k)?.size || daysInCalendarMonth(k))
      const pct = dd ? (wd/dd)*100 : 0
      climoWindPctSum[m] += pct
      climoWindPctCnt[m] += 1
    }

    loading.value = false
    await nextTick()
    await new Promise(r => requestAnimationFrame(r))
    mountMiniCharts()
  }catch(e){
    err.value = e.message || 'Failed to load climate data'
    console.error(e)
    loading.value = false
  }
}

/* ===== Derived facts ===== */
const monthNice = (ymKey) => {
  const [y,m] = ymKey.split('-').map(Number)
  return new Date(y, m-1, 1).toLocaleString(undefined, { month:'short', year:'2-digit' })
}
const monthsWithFacts = computed(() =>
  monthsL12.value.map(k => {
    const rain = rainL12.value[monthsL12.value.indexOf(k)] || 0
    const wd   = monthlyWindyDays.value.get(k) || 0
    const days = monthlyDays.value.get(k)      || daysInCalendarMonth(k)
    const windyPct = days ? Math.round((wd/days)*100) : 0
    return { k, rain, wd, days, windyPct }
  })
)
const mostRainy = computed(() =>
  [...monthsWithFacts.value].sort((a,b)=>b.rain-a.rain).slice(0,3)
)
const mostWindy = computed(() =>
  [...monthsWithFacts.value].sort((a,b)=>b.windyPct-a.windyPct).slice(0,3)
)
const calmest   = computed(() =>
  [...monthsWithFacts.value].sort((a,b)=>a.windyPct-b.windyPct).slice(0,3)
)

/* ===== Outlook (next 3 months) based on climatology ===== */
function monthLabelShort(idx){ return new Date(2000, idx-1, 1).toLocaleString(undefined,{month:'short'}) }
function todayMonth(){ return (new Date()).getMonth() + 1 }
function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0 }

const outlook3 = computed(() => {
  const startM = todayMonth()
  const facts = monthsWithFacts.value
  const out = []

  for (let i=0;i<3;i++){
    const m = ((startM - 1 + i) % 12) + 1

    // try long-term climatology
    let avgRain = climoRainCnt.value[m]     ? climoRainSum.value[m]    / climoRainCnt.value[m]     : null
    let avgWind = climoWindPctCnt.value[m]  ? climoWindPctSum.value[m] / climoWindPctCnt.value[m]  : null
    let source  = 'climo'

    // fallback: same month pulled from last-12 facts if climo missing
    if (avgRain === null || avgWind === null){
      const recents = facts.filter(x => Number(x.k.slice(5,7)) === m)
      if (recents.length){
        if (avgRain === null) avgRain = mean(recents.map(x => x.rain))
        if (avgWind === null) avgWind = mean(recents.map(x => x.windyPct))
        source = 'recent'
      }
    }

    // if we still have nothing, keep nulls (UI will show a dash)
    const tags = []
    if (Number.isFinite(avgRain)){
      if (avgRain >= 120) tags.push('Usually wet')
      else if (avgRain >= 80) tags.push('Often showery')
    }
    if (Number.isFinite(avgWind)){
      if (avgWind >= 35) tags.push('Usually breezy')
      else if (avgWind <= 20) tags.push('Usually gentle')
    }

    let tip = 'Good for parks.'
    if (Number.isFinite(avgRain) && Number.isFinite(avgWind)){
      if (avgRain >= 80 && avgWind >= 30) tip = 'Plan indoor backup & windbreaks.'
      else if (avgRain >= 80)            tip = 'Pack rain cover & gumboots.'
      else if (avgWind >= 30)            tip = 'Pick sheltered playgrounds.'
    } else {
      tip = 'Limited history; check weekly forecast.'
    }

    out.push({
      m, label: monthLabelShort(m),
      avgRain: Number.isFinite(avgRain) ? Math.round(avgRain) : null,
      avgWind: Number.isFinite(avgWind) ? Math.round(avgWind) : null,
      tags, tip, source
    })
  }
  return out
})


/* ===== Charts (with nicer aesthetics) ===== */
let rainMini, windMini, rainFull, windFull
const rainMiniEl = ref(null)
const windMiniEl = ref(null)
const rainFullEl = ref(null)
const windFullEl = ref(null)

function safeDestroy(c){ try{ c?.destroy?.() }catch{} }

function makeAreaGradient(ctx, hex='#2e7d32'){
  const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height)
  g.addColorStop(0,   hex + 'aa')  // top
  g.addColorStop(0.4, hex + '55')
  g.addColorStop(1,   hex + '10')  // bottom
  return g
}
const gridColor   = 'rgba(0,0,0,.06)'
const axisColor   = 'rgba(0,0,0,.45)'
const lineColor   = '#2e7d32'
const rosePalette = ['#2e7d32','#388e3c','#43a047','#66bb6a','#81c784','#a5d6a7','#c8e6c9','#e8f5e9']

function mountMiniCharts(){
  safeDestroy(rainMini); safeDestroy(windMini)
  if (rainMiniEl.value){
    const ctx = rainMiniEl.value.getContext('2d')
    rainMini = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthsL12.value,
        datasets: [{
          label: 'Monthly rainfall (mm)',
          data: rainL12.value,
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2.2,
          borderColor: lineColor,
          backgroundColor: makeAreaGradient(ctx, '#2e7d32'),
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, animation:false, resizeDelay:150,
        layout:{ padding: {top: 6, right: 8, bottom: 2, left: 4 } },
        plugins:{
          legend:{ display:false },
          tooltip:{
            callbacks:{
              title: (items)=> `Month: ${items[0].label}`,
              label: (item)=> `Rainfall: ${Math.round(item.parsed.y)} mm`
            }
          }
        },
        scales:{
          x:{ grid:{ display:false }, ticks:{ color: axisColor, maxRotation:0, autoSkip:true } },
          y:{ grid:{ color:gridColor }, ticks:{ display:false } }
        },
        elements:{ line:{ borderJoinStyle:'round' } }
      }
    })
  }
  if (windMiniEl.value){
    windMini = new Chart(windMiniEl.value.getContext('2d'), {
      type: 'polarArea',
      data: {
        labels: ['N','NE','E','SE','S','SW','W','NW'],
        datasets: [{ data: windBins.value, backgroundColor: rosePalette, borderColor:'#ffffff', borderWidth:1.5 }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, animation:false, resizeDelay:150,
        plugins:{ legend:{ display:false }, tooltip:{ enabled:true } },
        scales:{ r:{ ticks:{ display:false }, grid:{ color:gridColor }, angleLines:{ color:gridColor } } }
      }
    })
  }
}

/* Mount/destroy full charts when dialogs open/close */
watch(showRain, async (open) => {
  if (open) {
    // open dialog in the top layer and then mount the chart
    if (rainDlg.value && !rainDlg.value.open) rainDlg.value.showModal()
    await nextTick()
    await new Promise(r => requestAnimationFrame(r))
    safeDestroy(rainFull)
    if (rainFullEl.value) {
      const ctx = rainFullEl.value.getContext('2d')
      rainFull = new Chart(ctx, {
        type: 'line',
        data: { labels: monthsL12.value, datasets: [{
          label:'Monthly rainfall (mm)',
          data: rainL12.value,
          fill: true, tension: .35, pointRadius: 3, pointHoverRadius: 5,
          borderWidth: 2.4, borderColor: '#2e7d32',
          backgroundColor: (g => (g.addColorStop(0,'#2e7d32aa'),
                                   g.addColorStop(.4,'#2e7d3255'),
                                   g.addColorStop(1,'#2e7d3210'), g))(ctx.createLinearGradient(0,0,0,ctx.canvas.height))
        }]},
        options: { responsive: true, maintainAspectRatio: false, resizeDelay: 150,
          plugins: { legend: { display:false } },
          scales: { x:{ grid:{ color:'rgba(0,0,0,.06)' } },
                   y:{ beginAtZero:true, grid:{ color:'rgba(0,0,0,.06)' } } }
        }
      })
      requestAnimationFrame(() => rainFull?.resize())
    }
  } else {
    safeDestroy(rainFull); rainFull = undefined
    if (rainDlg.value?.open) rainDlg.value.close()
  }
})

watch(showWind, async (open) => {
  if (open) {
    if (windDlg.value && !windDlg.value.open) windDlg.value.showModal()
    await nextTick()
    await new Promise(r => requestAnimationFrame(r))
    safeDestroy(windFull)

    if (windFullEl.value) {
      windFull = new Chart(windFullEl.value.getContext('2d'), {
        type: 'polarArea',
        data: {
          labels: ['N','NE','E','SE','S','SW','W','NW'],
          datasets: [{
            data: windBins.value,
            backgroundColor: ['#2e7d32','#388e3c','#43a047','#66bb6a','#81c784','#a5d6a7','#c8e6c9','#e8f5e9'],
            borderColor: '#fff',
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 150,
          layout: { padding: { top: 18, bottom: 36 } },
          plugins: { legend: { position: 'bottom' } },
          scales: {
            r: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,.08)' },
              angleLines: { color: 'rgba(0,0,0,.08)' },
              ticks: {
                z: 10,                        // draw over petals
                showLabelBackdrop: true,
                backdropColor: 'rgba(255,255,255,.96)',
                backdropPadding: 3,
                color: '#36454F',
                font: { size: 12, weight: 600 }
              }
            }
          }
        }
      })

      requestAnimationFrame(() => windFull?.resize())
    }
  } else {
    safeDestroy(windFull); windFull = undefined
    if (windDlg.value?.open) windDlg.value.close()
  }
})



onBeforeUnmount(() => { [rainMini, windMini, rainFull, windFull].forEach(safeDestroy) })

/* ===== Init ===== */
onMounted(() => { load() })
</script>

<template>
  <section class="section-grid stack-first" id="climate">
    <aside class="aside reveal">
      <h2 class="title-underline">Outdoor comfort — past & next up</h2>
      <p class="muted lead">
        Last year’s rain/wind at a glance, plus a short seasonal outlook so you can plan the next few months.
      </p>

      <!-- KPIs -->
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Rain (last 12 months)</div>
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

      <!-- Past highlights -->
      <div class="callouts">
        <div class="callout">
          <div class="callout-title">Most rainy months</div>
          <ul>
            <li v-for="m in mostRainy" :key="'rainy-'+m.k">
              <strong>{{ monthNice(m.k) }}</strong>
              <span class="muted small">· {{ Math.round(m.rain) }} mm</span>
            </li>
          </ul>
        </div>

        <div class="callout caution">
          <div class="callout-title">Most windy months</div>
          <ul>
            <li v-for="m in mostWindy" :key="'windy-'+m.k">
              <strong>{{ monthNice(m.k) }}</strong>
              <span class="muted small">· {{ m.windyPct }}% of days windy ({{ m.wd }} days)</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Outlook -->
      <div class="outlook">
        <div class="outlook-title">Seasonal outlook — next 3 months</div>
        <ul class="outlook-list">
          <li v-for="o in outlook3" :key="o.m">
            <div class="left">
              <strong>{{ o.label }}</strong>
              <div class="tiny muted">
                avg rain {{ o.avgRain }} mm · avg {{ o.avgWind }}% windy days
              </div>
            </div>
            <div class="right">
              <span v-for="t in o.tags" :key="t" class="pill" :class="{
                wet: t.includes('wet') || t.includes('showery'),
                breezy: t.includes('breezy'),
                gentle: t.includes('gentle')
              }">{{ t }}</span>
              <div class="tip muted small">{{ o.tip }}</div>
            </div>
          </li>
        </ul>
        <div class="tiny muted">Based on historical month-of-year averages from your BOM files.</div>
      </div>

      <details class="explainer">
        <summary>What this means</summary>
        <p><strong>Past highlights</strong> help you see when conditions were toughest.</p>
        <p><strong>Outlook</strong> suggests what usually happens next so you can prep (e.g. rain cover, sheltered parks).</p>
        <p class="muted small">
          A day is counted “windy” if average wind ≥ {{WINDY_SPEED_KMH}} km/h or gusts ≥ {{WINDY_GUST_KMH}} km/h.
        </p>
      </details>
    </aside>

    <div class="content card climate-card reveal">
      <div v-if="loading" class="loading">Loading climate data…</div>
      <div v-else-if="err" class="err">{{ err }}</div>

      <div v-else class="mini-grid">
        <div class="mini">
          <header>
            <h3>Rainfall — last 12 months</h3>
            <button class="btn-soft" @click="showRain=true">Open chart</button>
          </header>
          <p class="helper">Shaded area shows monthly totals. Taller = wetter.</p>
          <div class="mini-chart">
            <canvas ref="rainMiniEl" aria-label="Rainfall sparkline"></canvas>
          </div>
        </div>

        <div class="mini">
          <header>
            <h3>Wind directions (wind rose)</h3>
            <button class="btn-soft" @click="showWind=true">Open chart</button>
          </header>
          <p class="helper">Bigger petals = more wind from that direction.</p>
          <div class="mini-chart">
            <canvas ref="windMiniEl" aria-label="Wind rose"></canvas>
          </div>
        </div>

        <div class="mini span-2">
          <header><h3>Calmest months (fewest windy days)</h3></header>
          <ul class="months">
            <li v-for="m in calmest" :key="'calm-'+m.k">
              <span class="m">{{ monthNice(m.k) }}</span>
              <span class="chip ok">Calmer</span>
              <span class="muted small">· {{ m.windyPct }}% windy ({{ m.wd }}/{{ m.days }} days)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Rain modal -->
    <!-- Rain modal -->
<dialog ref="rainDlg" class="modal" @close="showRain=false">
  <div class="modal-inner">
    <header><h3>Monthly rainfall</h3><button class="close" @click="showRain=false">✕</button></header>
    <canvas ref="rainFullEl" style="max-height:52vh"></canvas>
  </div>
</dialog>

<!-- Wind modal -->
<dialog ref="windDlg" class="modal" @close="showWind=false">
  <div class="modal-inner">
    <header><h3>Wind rose (speed-weighted)</h3><button class="close" @click="showWind=false">✕</button></header>
    <canvas ref="windFullEl" style="max-height:52vh"></canvas>
  </div>
</dialog>

  </section>
</template>

<style scoped>
/* layout */
.section-grid{ display:grid; grid-template-columns: minmax(280px, 360px) 1fr; gap:16px; }
@media (max-width: 960px){ .section-grid{ grid-template-columns: 1fr; } }

.aside .lead{ margin: 8px 0 12px; }

/* KPIs */
.kpis{ margin-top: 8px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; }
@media (max-width: 900px){ .kpis{ grid-template-columns: 1fr; } }
.kpi{
  background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.88));
  border:1px solid rgba(0,0,0,.06); border-radius:14px; padding:12px;
  box-shadow: 0 10px 24px rgba(0,0,0,.06);
}
.kpi-label{ color:#4a5f52; font-weight:700; font-size:.9rem; }
.kpi-value{ font-size:1.4rem; font-weight:900; color:#1b5e20; }
.kpi-value span{ font-size:.9rem; font-weight:700; color:#365a3d; margin-left:6px;}

/* callouts */
.callouts{
  display:grid; grid-template-columns: repeat(2, minmax(0,1fr));
  gap:12px; align-items:start;
}
@media (max-width: 960px){ .callouts{ grid-template-columns: 1fr; } }
.callout{
  border:1px solid rgba(0,0,0,.06); border-radius:14px; padding:12px; background:#fff;
  box-shadow: 0 10px 24px rgba(0,0,0,.06);
}
.callout.caution{ background:#fff7f3; }
.callout-title{ font-weight:800; color:#1b5e20; margin-bottom:8px; }

/* outlook */
.outlook{ margin-top:12px; background:#fcfffc; border:1px solid rgba(0,0,0,.06); border-radius:14px; padding:12px; box-shadow: 0 10px 24px rgba(0,0,0,.06); }
.outlook-title{ font-weight:800; color:#1b5e20; margin-bottom:6px; }
.outlook-list{ list-style:none; padding:0; margin:6px 0 0; display:grid; gap:8px; }
.outlook-list li{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:8px; border:1px dashed rgba(0,0,0,.06); border-radius:10px; background:#fff; }
.outlook .pill{ margin-left:6px; }
.pill{
  background:#e3f2fd; color:#0d47a1; border:1px solid #bbdefb; border-radius:999px; padding:2px 8px; font-weight:700; font-size:.8rem;
}
.pill.wet{ background:#e8f4ff; color:#084c8c; border-color:#c8e1ff; }
.pill.breezy{ background:#fde7e3; color:#9c2f1c; border-color:#f7c2b8; }
.pill.gentle{ background:#e7f6ec; color:#1b5e20; border-color:#cde9d6; }
.tip{ margin-top:3px; }

/* mini cards */
.mini-grid{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
.mini{ padding:10px; border:1px solid rgba(0,0,0,.06); border-radius:14px; background:#fff; box-shadow: 0 10px 24px rgba(0,0,0,.06); }
.mini header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
.mini h3{ margin:0; font-size:1rem; color:#1b5e20; }
.mini .helper{ margin: 2px 0 8px; color:#4a5f52; font-size:.85rem; }
.mini-chart{ height: 140px; }
.mini.span-2{ grid-column: 1 / -1; }

/* months list */
.months{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; }
@media (max-width: 900px){ .months{ grid-template-columns: 1fr; } }
.months li{
  display:flex; align-items:center; gap:8px; justify-content:space-between;
  padding:10px; border:1px dashed rgba(0,0,0,.06); border-radius:12px; background:#fcfffc;
}
.months .m{ min-width: 92px; font-weight:700; }

/* chips */
.chip{
  border-radius:999px; padding:4px 10px; font-weight:800; font-size:.8rem; border:1px solid transparent;
}
.chip.ok{ background:#e8f4ff; color:#084c8c; border-color:#c8e1ff; }

/* dialog */
.modal{ border:0; padding:0; margin:auto; width:min(900px, 92vw); background: transparent; }
.modal::backdrop{ background: rgba(0,0,0,.25); }
.modal .modal-inner{
  background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:16px; padding:16px;
  box-shadow: 0 16px 40px rgba(0,0,0,.24);
}
.modal header{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.modal .close{ background:transparent; border:0; font-size:18px; cursor:pointer; color:#365a3d; }

/* misc */
.btn-soft{
  background:#fff; color:#2e7d32; border:1px solid rgba(46,125,50,.25);
  padding:6px 10px; border-radius:999px; font-weight:700; cursor:pointer;
}
.loading{ padding:10px; color:#365a3d }
.err{ color:#a33; padding:10px; }
.explainer{ margin-top:8px; }
.explainer summary{ cursor:pointer; font-weight:700; }
.explainer p{ margin:6px 0; }
</style>
