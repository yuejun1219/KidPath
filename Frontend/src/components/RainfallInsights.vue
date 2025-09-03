<script setup>
import { ref, computed, watch, onMounted } from 'vue'   // ← keep watch (we’ll use it)
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  csvUrl: { type: String, default: 'https://weather-data-kidpath.s3.ap-southeast-2.amazonaws.com/Rainfall_Data_2014-2025(July).csv' },
  rows:   { type: Array,  default: () => [] },
  defaultYearsWindow: { type: Number, default: 10 }
})

const yearsWindow = ref(props.defaultYearsWindow)
const rawRows = ref([])
const loadErr = ref('')   // ← new

async function loadCsv(url) {
  try {
    loadErr.value = ''
    const resp = await fetch(url, { cache: 'no-store' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const text = await resp.text()
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
  } catch (e) {
    loadErr.value = `Failed to load CSV (${String(e)})`
    return []
  }
}

onMounted(async () => {
  if (props.rows && props.rows.length) rawRows.value = props.rows
  else if (props.csvUrl) rawRows.value = await loadCsv(props.csvUrl)
})

// ← if the url/rows prop changes, refresh data
watch(() => [props.rows, props.csvUrl], async ([r, url]) => {
  if (r && r.length) rawRows.value = r
  else if (url) rawRows.value = await loadCsv(url)
})

/* …(unchanged helpers & seasonAgg)… */

const chartData = computed(() => ({
  labels: seasonAgg.value.map(d => d.label),
  datasets: [{
    label: 'Avg rainfall (mm/day)',
    data: seasonAgg.value.map(d => d.value),
    backgroundColor: (ctx) => {
      const i = (ctx && typeof ctx.dataIndex === 'number') ? ctx.dataIndex : 0  // ← guard
      return seasonAgg.value[i]?.fill ?? '#94a3b8'
    },
    borderRadius: 6,
    barPercentage: 0.8,
    categoryPercentage: 0.9,
  }]
}))

/* …(unchanged options & plugin)… */
</script>

<template>
  <div class="rainfall-card">
    <div class="header">
      <h3>Seasonal Rainfall (Avg mm/day)</h3>
      <div class="controls">
        <label>Window</label>
        <select v-model.number="yearsWindow">
          <option :value="5">Last 5 years</option>
          <option :value="10">Last 10 years</option>
        </select>
      </div>
    </div>

    <!-- show a friendly message if CSV failed -->
    <p v-if="loadErr" style="color:#b91c1c; margin:6px 0;">{{ loadErr }}</p>

    <div class="chart-wrap">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div class="legend">
      <span class="swatch swatch--blue"></span> High Rain Risk (≥ 75th percentile)
      <span class="gap"></span>
      <span class="swatch swatch--grey"></span> Normal
    </div>
  </div>
</template>
