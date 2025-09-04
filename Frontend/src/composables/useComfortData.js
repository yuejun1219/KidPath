// src/composables/useComfortData.js
import { ref } from 'vue'

export function useComfortData() {
  const lat = ref(null)
  const lon = ref(null)
  const uvIndex = ref(null)
  const windSpeed = ref(null) 
  const windLevel = ref('')
  const loading = ref(true)
  const error = ref(null)
  const uvTimestamp = ref('')
  const windTimestamp = ref('')

  function getWindLevel(value) {
    if (value < 10) return 'Low'
    if (value < 20) return 'Moderate'
    if (value < 30) return 'Strong'
    return 'Very Strong'
  }

  async function fetchData(_lat = -37.8136, _lon = 144.9631) {
    loading.value = true
    error.value = null
    lat.value = _lat
    lon.value = _lon
    try {
      const [uvRes, windRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${_lat}&longitude=${_lon}&current=uv_index`),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${_lat}&longitude=${_lon}&current=wind_speed_10m`)
      ])
      const uvData = await uvRes.json()
      const windData = await windRes.json()

      uvIndex.value = uvData?.current?.uv_index ?? null
      uvTimestamp.value = uvData?.current?.time ?? ''
      
      const windValue = windData?.current?.wind_speed_10m ?? null
      windSpeed.value = windValue
      windLevel.value = windValue !== null ? getWindLevel(windValue) : ''
      windTimestamp.value = windData?.current?.time ?? ''
    } catch (e) {
      error.value = e.message || 'Fetch failed'
    } finally {
      loading.value = false
    }
  }

  function init() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        fetchData(latitude, longitude)
      },
      () => {
        fetchData() // fallback to Melbourne
      }
    )
  }

  return {
    uvIndex,
    windSpeed,
    windLevel,
    loading,
    error,
    init,
    uvTimestamp,
    windTimestamp
  }
}