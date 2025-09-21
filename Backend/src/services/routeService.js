// src/services/routeService.js
// Route planning service with OSRM integration and seasonal comfort weighting

const fetch = require('node-fetch');
const turf = require('@turf/turf');
const { amenitiesPool } = require('../config/amenitiesDatabase');

// OSRM configuration
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/foot';

// Seasonal comfort weights
const SEASONAL_WEIGHTS = {
  summer: {
    treeCanopy: 0.8,
    amenities: 0.6,  // Changed from 'parks' to 'amenities'
    water: 0.4,
    shade: 0.9
  },
  winter: {
    treeCanopy: 0.3,
    amenities: 0.4,  // Changed from 'parks' to 'amenities'
    water: 0.2,
    shade: 0.2
  },
  spring: {
    treeCanopy: 0.6,
    amenities: 0.7,  // Changed from 'parks' to 'amenities'
    water: 0.5,
    shade: 0.6
  },
  autumn: {
    treeCanopy: 0.7,
    amenities: 0.8,  // Changed from 'parks' to 'amenities'
    water: 0.4,
    shade: 0.7
  }
};

// Get current season based on month
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return 'summer'; // Australian summer
  if (month >= 3 && month <= 5) return 'autumn';
  if (month >= 6 && month <= 8) return 'winter';
  return 'spring';
};

// Calculate comfort score for a route segment
const calculateComfortScore = (segment, season, treeCanopyData, amenitiesData) => {
  const weights = SEASONAL_WEIGHTS[season] || SEASONAL_WEIGHTS.summer;
  let score = 0;
  let factors = 0;

  // Check tree canopy coverage
  if (treeCanopyData && treeCanopyData.features) {
    const treeCoverage = calculateTreeCoverage(segment, treeCanopyData);
    score += treeCoverage * weights.treeCanopy;
    factors += weights.treeCanopy;
  }

  // Check amenity proximity (now considers all facility types)
  if (amenitiesData && amenitiesData.features) {
    const amenityProximity = calculateAmenityProximity(segment, amenitiesData);
    score += amenityProximity * weights.amenities;
    factors += weights.amenities;
  }

  return factors > 0 ? score / factors : 0;
};

// Calculate tree canopy coverage for a segment
const calculateTreeCoverage = (segment, treeCanopyData) => {
  try {
    const segmentBuffer = turf.buffer(segment, 0.01, { units: 'kilometers' });
    let totalCoverage = 0;
    let intersectionCount = 0;

    treeCanopyData.features.forEach(tree => {
      if (turf.intersect(segmentBuffer, tree)) {
        const intersection = turf.intersect(segmentBuffer, tree);
        if (intersection) {
          const intersectionArea = turf.area(intersection);
          const segmentArea = turf.area(segmentBuffer);
          totalCoverage += intersectionArea / segmentArea;
          intersectionCount++;
        }
      }
    });

    return intersectionCount > 0 ? totalCoverage / intersectionCount : 0;
  } catch (error) {
    console.error('Error calculating tree coverage:', error);
    return 0;
  }
};

// Calculate amenity proximity for a segment (considers all facility types)
const calculateAmenityProximity = (segment, amenitiesData) => {
  try {
    const segmentCenter = turf.centroid(segment);
    let minDistance = Infinity;
    let amenityCount = 0;
    let categoryCounts = {};

    // Calculate distance to nearest amenity and count amenities within range
    amenitiesData.features.forEach(amenity => {
      const distance = turf.distance(segmentCenter, amenity, { units: 'kilometers' });
      minDistance = Math.min(minDistance, distance);
      
      // Count amenities within 500m
      if (distance <= 0.5) {
        amenityCount++;
        const category = amenity.properties?.category || 'unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    // Calculate distance score (closer = higher score)
    const distanceScore = Math.max(0, 1 - (minDistance / 0.5)); // 500m max influence
    
    // Calculate density score (more amenities = higher score)
    const densityScore = Math.min(1, amenityCount / 5); // Max score at 5 amenities
    
    // Calculate diversity score (more categories = higher score)
    const diversityScore = Math.min(1, Object.keys(categoryCounts).length / 3); // Max score at 3 categories
    
    // Combine scores with weights
    return (distanceScore * 0.4 + densityScore * 0.4 + diversityScore * 0.2);
  } catch (error) {
    console.error('Error calculating amenity proximity:', error);
    return 0;
  }
};

// Get route from OSRM
const getOSRMRoute = async (startLng, startLat, endLng, endLat) => {
  try {
    const url = `${OSRM_BASE_URL}/${startLng},${startLat};${endLng},${endLat}?alternatives=true&steps=true&geometries=geojson&overview=full`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM error: ${data.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting OSRM route:', error);
    throw error;
  }
};

// Plan comfort-optimized route
const planComfortRoute = async (startLng, startLat, endLng, endLat, options = {}) => {
  try {
    const season = options.season || getCurrentSeason();
    
    // Get OSRM route
    const osrmRoute = await getOSRMRoute(startLng, startLat, endLng, endLat);
    
    if (!osrmRoute.routes || osrmRoute.routes.length === 0) {
      throw new Error('No routes found');
    }

    // Get comfort data
    const treeCanopyData = await getTreeCanopyData();
    const amenitiesData = await getAmenitiesData();

    // Process routes and add comfort scores
    const processedRoutes = osrmRoute.routes.map((route, index) => {
      const routeGeometry = route.geometry;
      const segments = [];
      
      // Calculate comfort for each segment
      if (route.legs && route.legs[0] && route.legs[0].steps) {
        route.legs[0].steps.forEach(step => {
          if (step.geometry) {
            const segment = {
              type: 'Feature',
              geometry: step.geometry,
              properties: {
                distance: step.distance,
                duration: step.duration,
                comfort_score: calculateComfortScore(step.geometry, season, treeCanopyData, amenitiesData)
              }
            };
            segments.push(segment);
          }
        });
      }

      // Calculate overall comfort score
      const avgComfort = segments.length > 0 
        ? segments.reduce((sum, seg) => sum + seg.properties.comfort_score, 0) / segments.length
        : 0;

      return {
        route_index: index,
        geometry: routeGeometry,
        distance: route.distance,
        duration: route.duration,
        comfort_score: avgComfort,
        segments: segments,
        summary: {
          total_distance: Math.round(route.distance),
          total_duration: Math.round(route.duration / 60), // minutes
          comfort_level: getComfortLevel(avgComfort),
          road_crossings: calculateRoadCrossings(route),
          shaded_segments: segments.filter(s => s.properties.comfort_score > 0.6).length
        }
      };
    });

    // Sort by comfort score (highest first)
    processedRoutes.sort((a, b) => b.comfort_score - a.comfort_score);

    return {
      success: true,
      data: {
        routes: processedRoutes,
        recommended_route: processedRoutes[0],
        season: season,
        comfort_weights: SEASONAL_WEIGHTS[season]
      }
    };

  } catch (error) {
    console.error('Error planning comfort route:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get comfort level description
const getComfortLevel = (score) => {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Moderate';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
};

// Calculate road crossings (simplified)
const calculateRoadCrossings = (route) => {
  // simplified calculation
  return Math.floor(route.distance / 200); // Rough estimate: 1 crossing per 200m
};

// Get tree canopy data (placeholder - would come from your database)
const getTreeCanopyData = async () => {
  // query your tree_canopy table
  return {
    type: 'FeatureCollection',
    features: []
  };
};

// Get amenities data from database (all facility types)
const getAmenitiesData = async () => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      const query = `
        SELECT 
          amenity_id,
          category,
          name,
          ST_AsGeoJSON(geom) as geometry
        FROM comfort.amenities 
        WHERE category IN ('playground', 'toilet', 'library', 'community_centre', 'park')
        ORDER BY category, name
      `;
      
      const result = await client.query(query);
      
      return {
        type: 'FeatureCollection',
        features: result.rows.map(row => ({
          type: 'Feature',
          properties: {
            amenity_id: row.amenity_id,
            category: row.category,
            name: row.name
          },
          geometry: JSON.parse(row.geometry)
        }))
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting amenities data:', error);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
};

module.exports = {
  planComfortRoute,
  getCurrentSeason,
  calculateComfortScore,
  getOSRMRoute
};
