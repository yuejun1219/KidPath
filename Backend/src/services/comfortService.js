// src/services/comfortService.js
// Comfort analysis service

const { pool } = require('../config/database');
const { amenitiesPool } = require('../config/amenitiesDatabase');
const turf = require('@turf/turf');

// Get tree canopy coverage for a point
const getTreeCanopyCoverage = async (lat, lng, radius = 0.1) => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          ST_AsGeoJSON(geom) as geometry,
          ST_Area(geom) as area
        FROM tree_canopy 
        WHERE ST_DWithin(
          geom, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326), 
          $3
        )
      `;
      
      const result = await client.query(query, [lng, lat, radius]);
      
      if (result.rows.length === 0) {
        return {
          coverage_percentage: 0,
          total_area: 0,
          tree_count: 0
        };
      }

      // Calculate coverage percentage
      const point = turf.point([lng, lat]);
      const buffer = turf.buffer(point, radius, { units: 'kilometers' });
      const bufferArea = turf.area(buffer);
      
      let totalTreeArea = 0;
      result.rows.forEach(row => {
        const treeGeometry = JSON.parse(row.geometry);
        const treeArea = turf.area(treeGeometry);
        totalTreeArea += treeArea;
      });

      const coveragePercentage = Math.min(100, (totalTreeArea / bufferArea) * 100);

      return {
        coverage_percentage: Math.round(coveragePercentage * 100) / 100,
        total_area: Math.round(totalTreeArea * 100) / 100,
        tree_count: result.rows.length
      };

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getTreeCanopyCoverage:', error);
    throw new Error(`Failed to get tree canopy coverage: ${error.message}`);
  }
};

// Get comfort amenities near a point
const getComfortAmenities = async (lat, lng, radius = 0.1) => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      const query = `
        SELECT 
          amenity_id,
          category,
          name,
          opening_hours,
          wheelchair,
          ST_AsGeoJSON(geom) as geometry,
          ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance
        FROM comfort.amenities 
        WHERE ST_DWithin(
          geom, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326), 
          $3
        )
        ORDER BY distance
        LIMIT 10
      `;
      
      const result = await client.query(query, [lng, lat, radius]);
      
      return result.rows.map(row => ({
        amenity_id: row.amenity_id,
        category: row.category,
        name: row.name,
        opening_hours: row.opening_hours,
        wheelchair: row.wheelchair,
        geometry: JSON.parse(row.geometry),
        distance: Math.round(row.distance * 1000) // Convert to meters
      }));

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getComfortAmenities:', error);
    throw new Error(`Failed to get comfort amenities: ${error.message}`);
  }
};

// Analyze comfort for a route segment
const analyzeRouteSegment = async (startLat, startLng, endLat, endLng) => {
  try {
    const segment = turf.lineString([[startLng, startLat], [endLng, endLat]]);
    const segmentCenter = turf.centroid(segment);
    const centerCoords = segmentCenter.geometry.coordinates;
    
    // Get tree canopy coverage
    const treeCoverage = await getTreeCanopyCoverage(centerCoords[1], centerCoords[0]);
    
    // Get comfort amenities
    const amenities = await getComfortAmenities(centerCoords[1], centerCoords[0]);
    
    // Calculate comfort score
    const comfortScore = calculateComfortScore(treeCoverage, amenities);
    
    return {
      segment: {
        start: { lat: startLat, lng: startLng },
        end: { lat: endLat, lng: endLng },
        center: { lat: centerCoords[1], lng: centerCoords[0] }
      },
      tree_coverage: treeCoverage,
      amenities: amenities,
      comfort_score: comfortScore,
      comfort_level: getComfortLevel(comfortScore)
    };

  } catch (error) {
    console.error('Error in analyzeRouteSegment:', error);
    throw new Error(`Failed to analyze route segment: ${error.message}`);
  }
};

// Calculate comfort score based on tree coverage and amenities
const calculateComfortScore = (treeCoverage, amenities) => {
  let score = 0;
  let factors = 0;

  // Tree coverage factor (0-1)
  const treeFactor = treeCoverage.coverage_percentage / 100;
  score += treeFactor * 0.6; // 60% weight for tree coverage
  factors += 0.6;

  // Amenities factor (0-1)
  const amenityFactor = Math.min(1, amenities.length / 5); // Max score at 5 amenities
  score += amenityFactor * 0.4; // 40% weight for amenities
  factors += 0.4;

  return factors > 0 ? score / factors : 0;
};

// Get comfort level description
const getComfortLevel = (score) => {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Moderate';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
};

// Get seasonal comfort recommendations
const getSeasonalRecommendations = (season) => {
  const recommendations = {
    summer: {
      priority: 'shade',
      message: 'High temperatures expected. Prioritize shaded routes and water access.',
      tips: [
        'Look for routes with high tree canopy coverage',
        'Plan stops at playgrounds with water fountains',
        'Avoid routes with long sun-exposed segments'
      ]
    },
    winter: {
      priority: 'shelter',
      message: 'Cooler weather. Focus on sheltered routes and indoor amenities.',
      tips: [
        'Look for routes with covered walkways',
        'Plan stops at libraries or community centers',
        'Consider routes with wind protection'
      ]
    },
    spring: {
      priority: 'comfort',
      message: 'Mild weather. Enjoy comfortable walking conditions.',
      tips: [
        'Any route should be comfortable',
        'Look for routes with parks and green spaces',
        'Consider routes with scenic views'
      ]
    },
    autumn: {
      priority: 'comfort',
      message: 'Pleasant weather. Good conditions for walking.',
      tips: [
        'Look for routes with parks and green spaces',
        'Consider routes with scenic views',
        'Plan stops at playgrounds and recreational areas'
      ]
    }
  };

  return recommendations[season] || recommendations.spring;
};

module.exports = {
  getTreeCanopyCoverage,
  getComfortAmenities,
  analyzeRouteSegment,
  calculateComfortScore,
  getComfortLevel,
  getSeasonalRecommendations
};
