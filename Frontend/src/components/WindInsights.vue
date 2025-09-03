<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  csvUrl: { type: String, default: 'https://weather-data-kidpath.s3.ap-southeast-2.amazonaws.com/Wind_Data.csv' },     // path to CSV
  rows:   { type: Array,  default: () => [] }, // optional: pass rows directly
  defaultYearsWindow: { type: Number, default: 10 }, // 5 or 10
  defaultMetric: { type: String, default: 'windspeed' } // 'windspeed' | 'windgust'
})

// UI state
const yearsWindow = ref(props.defaultYearsWindow)
const metric = ref(props.defaultMetric) // choose windspeed or windgust
const rawRows = ref([])

// ---------- CSV loader (simple) ----------
async function loadCsv(url) {
  const text = await (await fetch(url, { cache: 'no-store' })).text()
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map(h => h.trim())
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    const row = {}
    headers.forEach((h, idx) => (row[h] = cols[idx]))
    out.push(row)
  }
  return out
}

onMounted(async () => {
  if (props.rows?.length) {
    rawRows.value = props.rows
  } else if (props.csvUrl) {
    rawRows.value = await loadCsv(props.csvUrl)
  }
})

// ---------- Helpers ----------
const toNum = (v, f=0) => {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : f
}
const getSeason = (m) => {
  if ([12,1,2].includes(m)) return 'Summer'
  if ([3,4,5].includes(m))  return 'Autumn'
  if ([6,7,8].includes(m))  return 'Winter'
  return 'Spring'
}
const getSeasonYear = (y, m) => (m === 12 ? y + 1 : y)
function percentile(arr, p) {
  if (!arr.length) return 0
  const a = [...arr].sort((x,y)=>x-y)
  const idx = (a.length - 1) * p
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return lo === hi ? a[lo] : a[lo] + (a[hi]-a[lo])*(idx-lo)
}

// Accept either date column or Year/Month/Day
function parseYMD(row) {
  const dcol = row.date || row.Date || row.timestamp
  if (dcol) {
    const d = new Date(dcol)
    return { y: d.getFullYear(), m: d.getMonth()+1, d: d.getDate() }
  }
  return {
    y: toNum(row.Year),
    m: toNum(row.Month),
    d: toNum(row.Day)
  }
}

// ---------- Aggregation ----------
const seasonAgg = computed(() => {
  const rows = rawRows.value
  if (!rows?.length) return []

  const enr = rows.map(r => {
    const { y, m, d } = parseYMD(r)
    const ws = toNum(r.windspeed ?? r.WindSpeed ?? r['wind speed'])
    const wg = toNum(r.windgust  ?? r.WindGust  ?? r['wind gust'])
    const season = getSeason(m)
    const sy = getSeasonYear(y, m)
    return { y, m, d, ws, wg, season, sy }
  })

  const maxSY = enr.reduce((acc, r) => Math.max(acc, r.sy), -Infinity)
  const minSY = maxSY - (yearsWindow.value - 1)

  const key = (sy, s) => `${sy}::${s}`
  const bucket = new Map()
  for (const r of enr) {
    if (r.sy < minSY || r.sy > maxSY) continue
    const k = key(r.sy, r.season)
    const cur = bucket.get(k) || { sum: 0, cnt: 0, sumG: 0 }
    cur.sum  += (metric.value === 'windgust' ? r.wg : r.ws)
    cur.sumG += r.wg
    cur.cnt  += 1
    bucket.set(k, cur)
  }

  const out = []
  for (const [k, { sum, cnt, sumG }] of bucket.entries()) {
    const [syStr, s] = k.split('::')
    const sy = Number(syStr)
    const value = cnt ? sum / cnt : 0
    const avgGust = cnt ? sumG / cnt : 0
    out.push({
      label: `${sy} • ${s}`,
      year: sy,
      season: s,
      value: Number(value.toFixed(2)),
      avgGust: Number(avgGust.toFixed(2)),
      countDays: cnt
    })
  }

  const order = { Summer:0, Autumn:1, Winter:2, Spring:3 }
  out.sort((a,b)=> a.year===b.year ? order[a.season]-order[b.season] : a.year-b.year)

  const vals = out.map(d => d.value)
  const p75  = percentile(vals, 0.75)

  return out.map(d => ({
    ...d,
    high: d.value >= p75,
    fill: d.value >= p75 ? '#2563eb' : '#94a3b8',
    threshold: p75
  }))
})

// ---------- Chart config ----------
const chartData = computed(() => ({
  labels: seasonAgg.value.map(d => d.label),
  datasets: [{
    label: metric.value === 'windgust' ? 'Avg wind gust (km/h)' : 'Avg wind speed (km/h)',
    data: seasonAgg.value.map(d => d.value),
    backgroundColor: (ctx) => seasonAgg.value[ctx.dataIndex]?.fill || '#94a3b8',
    borderRadius: 6,
    barPercentage: 0.8,
    categoryPercentage: 0.9,
  }]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { ticks: { maxRotation: 40, minRotation: 40 } },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'km/h' }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items) => {
          const i = items[0].dataIndex
          const row = seasonAgg.value[i]
          return `${row.season} — ${row.year}`
        },
        label: (item) => {
          const v = Number(item.raw).toFixed(2)
          return (metric.value === 'windgust'
            ? `Average wind gust: ${v} km/h`
            : `Average wind speed: ${v} km/h`)
        },
        afterLabel: (item) => {
          const row = seasonAgg.value[item.dataIndex]
          return `Days counted: ${row.countDays}${row.avgGust && metric.value!=='windgust' ? ` \\nAvg gust: ${row.avgGust.toFixed(2)} km/h` : ''}`
        }
      }
    },
    highRisk: { enabled: true }
  }
}))

// Draw labels above high-risk bars
const HighRiskPlugin = {
  id: 'highRisk',
  afterDatasetsDraw(chart, args, opts) {
    if (!opts?.enabled) return
    const { ctx } = chart
    const meta = chart.getDatasetMeta(0)
    ctx.save()
    ctx.fillStyle = '#1d4ed8'
    ctx.font = '600 11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    ctx.textAlign = 'center'
    seasonAgg.value.forEach((d, i) => {
      if (!d.high) return
      const elem = meta.data[i]; if (!elem) return
      const { x, y } = elem.getProps(['x','y'], true)
      ctx.fillText('High Wind Risk', x, y - 6)
    })
    ctx.restore()
  }
}
Chart.register(HighRiskPlugin)
</script>

<template>
  <div class="wind-card">
    <div class="header">
      <h3>Seasonal Wind (Avg)</h3>
      <div class="controls">
        <label>Window</label>
        <select v-model.number="yearsWindow">
          <option :value="5">Last 5 years</option>
          <option :value="10">Last 10 years</option>
        </select>
        <label>Metric</label>
        <select v-model="metric">
          <option value="windspeed">Wind Speed</option>
          <option value="windgust">Wind Gust</option>
        </select>
      </div>
    </div>

    <div class="chart-wrap">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div class="legend">
      <span class="swatch swatch--blue"></span> High Wind Risk (≥ 75th percentile)
      <span class="gap"></span>
      <span class="swatch swatch--grey"></span> Normal
    </div>
  </div>
</template>

<style scoped>
.wind-card { background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 16px; text-align: left; box-shadow: 0 10px 24px rgba(0,0,0,0.06); }
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.header h3 { margin: 0; font-size: 1.05rem; }
.controls { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
.controls select { padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
.chart-wrap { height: 360px; margin-top: 6px; }
.legend { margin-top: 10px; font-size: .9rem; color: #475569; display: flex; align-items: center; }
.swatch { display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; }
.swatch--blue { background: #2563eb; }
.swatch--grey { background: #94a3b8; }
.gap { width: 18px; display: inline-block; }
</style>
