// SQL queries for amenities data using comfort.amenities table and nearby_amenities function

// Get nearby amenities using the DS team's function
const getNearbyAmenitiesQuery = `
  SELECT 
    amenity_id,
    category,
    name,
    distance_m,
    opening_hours,
    wheelchair,
    ST_AsGeoJSON(geom) as geometry
  FROM comfort.nearby_amenities($1, $2, $3, $4, $5)
  ORDER BY distance_m ASC
`;

// Get amenities by bounding box with enhanced metadata
const getAmenitiesByBboxQuery = `
  WITH bbox_amenities AS (
    SELECT 
      amenity_id,
      category,
      name,
      opening_hours,
      wheelchair,
      ST_AsGeoJSON(geom) as geometry,
      ST_X(geom) as lon,
      ST_Y(geom) as lat
    FROM comfort.amenities
    WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
    AND ($5::text[] IS NULL OR category = ANY($5::text[]))
    ORDER BY amenity_id
    LIMIT $6
  ),
  category_stats AS (
    SELECT 
      category,
      COUNT(*) as count
    FROM comfort.amenities
    WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
    AND ($5::text[] IS NULL OR category = ANY($5::text[]))
    GROUP BY category
    ORDER BY count DESC
  )
  SELECT 
    amenity_id,
    category,
    name,
    opening_hours,
    wheelchair,
    geometry,
    lon,
    lat,
    (SELECT json_agg(json_build_object('category', category, 'count', count)) FROM category_stats) as category_breakdown,
    (SELECT COUNT(*) FROM comfort.amenities WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326) AND ($5::text[] IS NULL OR category = ANY($5::text[]))) as total_in_bbox
  FROM bbox_amenities
`;

// Search amenities by name using trigram similarity with enhanced features
const searchAmenitiesByNameQuery = `
  WITH search_results AS (
    SELECT 
      amenity_id,
      category,
      name,
      opening_hours,
      wheelchair,
      ST_AsGeoJSON(geom) as geometry,
      ST_X(geom) as lon,
      ST_Y(geom) as lat,
      similarity(name, $1) as similarity_score,
      CASE 
        WHEN name ILIKE $1 THEN 1.0
        WHEN name ILIKE $1 || '%' THEN 0.9
        WHEN name ILIKE '%' || $1 || '%' THEN 0.8
        ELSE similarity(name, $1)
      END as relevance_score
    FROM comfort.amenities
    WHERE name % $1
    AND ($2::text IS NULL OR category = $2::text)
  ),
  category_stats AS (
    SELECT 
      category,
      COUNT(*) as count,
      AVG(similarity(name, $1)) as avg_similarity
    FROM comfort.amenities
    WHERE name % $1
    AND ($2::text IS NULL OR category = $2::text)
    GROUP BY category
    ORDER BY count DESC
  )
  SELECT 
    sr.*,
    (SELECT json_agg(json_build_object('category', category, 'count', count, 'avg_similarity', avg_similarity)) FROM category_stats) as category_breakdown,
    (SELECT COUNT(*) FROM comfort.amenities WHERE name % $1 AND ($2::text IS NULL OR category = $2::text)) as total_matches
  FROM search_results sr
  ORDER BY relevance_score DESC, similarity_score DESC, name ASC
  LIMIT $3
`;

// Get available amenity categories
const getAmenityCategoriesQuery = `
  SELECT DISTINCT category
  FROM comfort.amenities
  WHERE category IS NOT NULL
  ORDER BY category
`;

// Get amenity by ID
const getAmenityByIdQuery = `
  SELECT 
    amenity_id,
    category,
    name,
    opening_hours,
    wheelchair,
    addr_street as address,
    ST_AsGeoJSON(geom) as geometry
  FROM comfort.amenities
  WHERE amenity_id = $1
`;

// Get search suggestions based on partial name
const getSearchSuggestionsQuery = `
  SELECT DISTINCT
    name,
    category,
    similarity(name, $1) as similarity_score
  FROM comfort.amenities
  WHERE name ILIKE '%' || $1 || '%'
  AND name IS NOT NULL
  AND name != ''
  ORDER BY similarity_score DESC, name ASC
  LIMIT $2
`;

// Get popular search terms
const getPopularSearchTermsQuery = `
  SELECT 
    name,
    category,
    COUNT(*) as search_frequency
  FROM comfort.amenities
  WHERE name IS NOT NULL
  AND name != ''
  AND LENGTH(name) > 3
  GROUP BY name, category
  ORDER BY search_frequency DESC, name ASC
  LIMIT $1
`;

module.exports = {
  getNearbyAmenitiesQuery,
  getAmenitiesByBboxQuery,
  searchAmenitiesByNameQuery,
  getAmenityCategoriesQuery,
  getAmenityByIdQuery,
  getSearchSuggestionsQuery,
  getPopularSearchTermsQuery
};
