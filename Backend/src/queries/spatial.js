const BUFFER_RADIUS = 0.0005; // ~50m

// sql to get playgrounds with shade coverage
const getPlaygroundsWithShadeQuery = `
  SELECT 
    p.id, 
    p.name, 
    p.features, 
    p.location_d,
    p.council_re,
    p.lat, 
    p.lon,
    ST_AsGeoJSON(p.point) as geometry,
    COALESCE(
      (100.0 * SUM(ST_Area(ST_Intersection(c.geom, ST_Buffer(p.point, $1)))) / 
       ST_Area(ST_Buffer(p.point, $1)))::numeric, 
      0
    ) AS shade_coverage
  FROM playgrounds p
  LEFT JOIN tree_canopy c ON ST_Intersects(c.geom, ST_Buffer(p.point, $1))
  WHERE p.point IS NOT NULL
  GROUP BY p.id, p.name, p.features, p.location_d, p.council_re, p.lat, p.lon, p.point
`;

// get single playground's details
const getPlaygroundByIdQuery = `
  SELECT 
    p.id, 
    p.name, 
    p.features, 
    p.location_d,
    p.council_re,
    p.lat, 
    p.lon,
    ST_AsGeoJSON(p.point) as geometry,
    COALESCE(
      (100.0 * SUM(ST_Area(ST_Intersection(c.geom, ST_Buffer(p.point, $2)))) / 
       ST_Area(ST_Buffer(p.point, $2)))::numeric, 
      0
    ) AS shade_coverage
  FROM playgrounds p
  LEFT JOIN tree_canopy c ON ST_Intersects(c.geom, ST_Buffer(p.point, $2))
  WHERE p.point IS NOT NULL AND p.id = $1
  GROUP BY p.id, p.name, p.features, p.location_d, p.council_re, p.lat, p.lon, p.point
`;

// get playgrounds within bounding box
const getPlaygroundsInBoundingBoxQuery = `
  SELECT 
    p.id, 
    p.name, 
    p.features, 
    p.location_d,
    p.council_re,
    p.lat, 
    p.lon,
    ST_AsGeoJSON(p.point) as geometry
  FROM playgrounds p
  WHERE p.point IS NOT NULL 
    AND ST_Within(p.point, ST_MakeEnvelope($1, $2, $3, $4, 4326))
  ORDER BY p.id
`;

// get nearest playgrounds by coordinates
const getNearestPlaygroundsQuery = `
  WITH ref AS (
    SELECT ST_SetSRID(ST_MakePoint($2, $3), 4326) AS pt
  )
  SELECT 
    p.id, 
    p.name, 
    p.features,
    p.location_d,
    p.council_re,
    ST_DistanceSphere(p.point, ref.pt)::integer AS distance_meters,
    ST_AsGeoJSON(p.point) as geometry
  FROM playgrounds p, ref
  WHERE p.point IS NOT NULL
  ORDER BY p.point <-> ref.pt
  LIMIT $1
`;

const getStatisticsQuery = `
  SELECT 
    COUNT(*) as total_playgrounds,
    COUNT(CASE WHEN p.point IS NOT NULL THEN 1 END) as playgrounds_with_location,
    (SELECT COUNT(*) FROM tree_canopy) as total_canopy_polygons
  FROM playgrounds p
`;

// get shade distribution statistics
const getShadeDistributionQuery = `
  WITH playground_shade AS (
    SELECT 
      p.id,
      COALESCE(
        (100.0 * SUM(ST_Area(ST_Intersection(c.geom, ST_Buffer(p.point, $1)))) / 
         ST_Area(ST_Buffer(p.point, $1)))::numeric, 
        0
      ) AS shade_coverage
    FROM playgrounds p
    LEFT JOIN tree_canopy c ON ST_Intersects(c.geom, ST_Buffer(p.point, $1))
    WHERE p.point IS NOT NULL
    GROUP BY p.id, p.point
  )
  SELECT 
    AVG(shade_coverage)::numeric as avg_shade_coverage,
    MIN(shade_coverage)::numeric as min_shade_coverage,
    MAX(shade_coverage)::numeric as max_shade_coverage,
    COUNT(*) as total_analyzed,
    COUNT(CASE WHEN shade_coverage > 50 THEN 1 END) as high_shade_count,
    COUNT(CASE WHEN shade_coverage <= 20 THEN 1 END) as low_shade_count
  FROM playground_shade
`;

module.exports = {
  BUFFER_RADIUS,
  getPlaygroundsWithShadeQuery,
  getPlaygroundByIdQuery, 
  getPlaygroundsInBoundingBoxQuery,
  getNearestPlaygroundsQuery,
  getStatisticsQuery,
  getShadeDistributionQuery
};