// Points of Interest controller

const { 
  findPOIsAlongRoute, 
  findComfortPOIsAlongRoute
} = require('../services/poiService');
const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');

// Find POIs along a route
const findPOIsAlongRouteController = async (req, res) => {
  try {
    const { lineString, route, maxDistance = 0.1, buffer = 0.1, categories = [] } = req.body;

    // Support both lineString and route formats
    let routeGeometry;
    if (lineString && Array.isArray(lineString)) {
      routeGeometry = { coordinates: lineString };
    } else if (route && route.coordinates && Array.isArray(route.coordinates)) {
      routeGeometry = route;
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Route geometry with coordinates is required (use lineString or route.coordinates)'
      });
    }

    const maxDistanceNum = parseFloat(buffer || maxDistance);
    if (isNaN(maxDistanceNum) || maxDistanceNum <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid maxDistance/buffer value'
      });
    }

    const pois = await findPOIsAlongRoute(routeGeometry, maxDistanceNum);

    // Calculate amenities statistics for route display
    const amenitiesStats = {
      total: pois.length,
      by_category: {},
      has_toilet: false,
      has_fountain: false,
      has_playground: false,
      has_library: false
    };

    pois.forEach(poi => {
      const category = poi.category;
      amenitiesStats.by_category[category] = (amenitiesStats.by_category[category] || 0) + 1;
      
      // Set boolean flags for common amenities
      if (category === 'toilet') amenitiesStats.has_toilet = true;
      if (category === 'fountain') amenitiesStats.has_fountain = true;
      if (category === 'playground') amenitiesStats.has_playground = true;
      if (category === 'library') amenitiesStats.has_library = true;
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        route: routeGeometry,
        max_distance: maxDistanceNum,
        categories: categories,
        pois: pois,
        count: pois.length,
        amenities_stats: amenitiesStats
      }
    });

  } catch (error) {
    console.error('Error in findPOIsAlongRouteController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while finding POIs along route'
    });
  }
};

// Find comfort POIs along a route
const findComfortPOIsAlongRouteController = async (req, res) => {
  try {
    const { lineString, route, maxDistance = 0.1, buffer = 0.1, categories = [], season, weights } = req.body;

    // Support both lineString and route formats
    let routeGeometry;
    if (lineString && Array.isArray(lineString)) {
      routeGeometry = { coordinates: lineString };
    } else if (route && route.coordinates && Array.isArray(route.coordinates)) {
      routeGeometry = route;
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Route geometry with coordinates is required (use lineString or route.coordinates)'
      });
    }

    const maxDistanceNum = parseFloat(buffer || maxDistance);
    if (isNaN(maxDistanceNum) || maxDistanceNum <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid maxDistance/buffer value'
      });
    }

    const pois = await findComfortPOIsAlongRoute(routeGeometry, maxDistanceNum);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        route: routeGeometry,
        max_distance: maxDistanceNum,
        categories: categories,
        season: season,
        weights: weights,
        comfort_pois: pois,
        count: pois.length
      }
    });

  } catch (error) {
    console.error('Error in findComfortPOIsAlongRouteController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while finding comfort POIs along route'
    });
  }
};


// Get route amenities summary (for Epic 5 display)
const getRouteAmenitiesSummaryController = async (req, res) => {
  try {
    const { routes, maxDistance = 0.1 } = req.body;

    if (!routes || !Array.isArray(routes)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Routes array is required'
      });
    }

    const maxDistanceNum = parseFloat(maxDistance);
    if (isNaN(maxDistanceNum) || maxDistanceNum <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid maxDistance value'
      });
    }

    const results = {};
    
    for (const routeItem of routes) {
      if (!routeItem.id || !routeItem.geometry || !Array.isArray(routeItem.geometry.coordinates)) {
        continue; // Skip invalid routes
      }

      const pois = await findPOIsAlongRoute(routeItem.geometry, maxDistanceNum);
      
      // Calculate summary statistics
      const summary = {
        total_amenities: pois.length,
        by_category: {},
        has_toilet: false,
        has_fountain: false,
        has_playground: false,
        has_library: false,
        amenities_list: [] // For display purposes
      };

      pois.forEach(poi => {
        const category = poi.category;
        summary.by_category[category] = (summary.by_category[category] || 0) + 1;
        
        // Set boolean flags
        if (category === 'toilet') summary.has_toilet = true;
        if (category === 'fountain') summary.has_fountain = true;
        if (category === 'playground') summary.has_playground = true;
        if (category === 'library') summary.has_library = true;
        
        // Add to display list
        summary.amenities_list.push({
          category: category,
          name: poi.name || `${category} facility`,
          distance: poi.distance
        });
      });

      results[routeItem.id] = summary;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: results
    });

  } catch (error) {
    console.error('Error in getRouteAmenitiesSummaryController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while getting route amenities summary'
    });
  }
};

module.exports = {
  findPOIsAlongRouteController,
  findComfortPOIsAlongRouteController,
  getRouteAmenitiesSummaryController
};
