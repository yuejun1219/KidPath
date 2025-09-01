// fetch_fountains.js
import fs from 'fs'
import fetch from 'node-fetch'

const OUT = './public/datasets/osm_fountains_metro_melb.geojson'
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Metro Melbourne bbox
const MEL_BBOX = { south: -38.6, west: 144.4, north: -37.5, east: 145.6 }

const query = `
[out:json][timeout:60];
(
  node["amenity"="drinking_water"](${MEL_BBOX.south},${MEL_BBOX.west},${MEL_BBOX.north},${MEL_BBOX.east});
  way["amenity"="drinking_water"](${MEL_BBOX.south},${MEL_BBOX.west},${MEL_BBOX.north},${MEL_BBOX.east});
  relation["amenity"="drinking_water"](${MEL_BBOX.south},${MEL_BBOX.west},${MEL_BBOX.north},${MEL_BBOX.east});
);
out center;
`

function toGeoJSON(json) {
  const feats = (json.elements || []).map(el => {
    let lon = el.lon, lat = el.lat
    if (el.type !== 'node' && el.center) { lon = el.center.lon; lat = el.center.lat }
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        id: `${el.type}/${el.id}`,
        name: el.tags?.name || 'Drinking fountain',
        source: 'OSM',
        tags: el.tags || {}
      }
    }
  }).filter(Boolean)

  return { type: 'FeatureCollection', features: feats }
}

async function main() {
  console.log('Fetching OSM fountains…')
  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query })
  })
  if (!resp.ok) throw new Error(`Overpass error: ${resp.status} ${resp.statusText}`)
  const json = await resp.json()
  const gj = toGeoJSON(json)

  fs.mkdirSync('./public/datasets', { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(gj))
  console.log(`Saved ${gj.features.length} fountains → ${OUT}`)
}

main().catch(console.error)
