// src/services/routeService.js
// Route planning service with OSRM integration and seasonal comfort weighting

const fetch = require('node-fetch');
const turf = require('@turf/turf');

// OSRM configuration
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/foot';

// Seasonal comfort weights
const SEASONAL_WEIGHTS = {
  summer: {
    treeCanopy: 0.8,
    parks: 0.6,
    water: 0.4,
    shade: 0.9
  },
  winter: {
    treeCanopy: 0.3,
    parks: 0.4,
    water: 0.2,
    shade: 0.2
  },
  spring: {
    treeCanopy: 0.6,
    parks: 0.7,
    water: 0.5,
    shade: 0.6
  },
  autumn: {
    treeCanopy: 0.7,
    parks: 0.8,
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
const calculateComfortScore = (segment, season, treeCanopyData, parksData) => {
  const weights = SEASONAL_WEIGHTS[season] || SEASONAL_WEIGHTS.summer;
  let score = 0;
  let factors = 0;

  // Check tree canopy coverage
  if (treeCanopyData && treeCanopyData.features) {
    const treeCoverage = calculateTreeCoverage(segment, treeCanopyData);
    score += treeCoverage * weights.treeCanopy;
    factors += weights.treeCanopy;
  }

  // Check park proximity
  if (parksData && parksData.features) {
    const parkProximity = calculateParkProximity(segment, parksData);
    score += parkProximity * weights.parks;
    factors += weights.parks;
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

// Calculate park proximity for a segment
const calculateParkProximity = (segment, parksData) => {
  try {
    const segmentCenter = turf.centroid(segment);
    let minDistance = Infinity;

    parksData.features.forEach(park => {
      const distance = turf.distance(segmentCenter, park, { units: 'kilometers' });
      minDistance = Math.min(minDistance, distance);
    });

    // Convert distance to proximity score (closer = higher score)
    return Math.max(0, 1 - (minDistance / 0.5)); // 500m max influence
  } catch (error) {
    console.error('Error calculating park proximity:', error);
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

    // Get comfort data (this would typically come from your database)
    const treeCanopyData = await getTreeCanopyData();
    const parksData = await getParksData();

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
                comfort_score: calculateComfortScore(step.geometry, season, treeCanopyData, parksData)
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
  // This is a simplified calculation
  // In reality, you'd analyze the route geometry against road data
  return Math.floor(route.distance / 200); // Rough estimate: 1 crossing per 200m
};

// Get tree canopy data (placeholder - would come from your database)
const getTreeCanopyData = async () => {
  // This would typically query your tree_canopy table
  // For now, return empty data
  return {
    type: 'FeatureCollection',
    features: []
  };
};

// Get parks data (placeholder - would come from your database)
const getParksData = async () => {
  // This would typically query your parks table
  // For now, return empty data
  return {
    type: 'FeatureCollection',
    features: []
  };
};

module.exports = {
  planComfortRoute,
  getCurrentSeason,
  calculateComfortScore,
  getOSRMRoute
};
