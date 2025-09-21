// Points of Interest controller

const { 
  findPOIsAlongRoute, 
  findComfortPOIsAlongRoute, 
  findPOIsInBbox,
  getPOICategories,
  findNearbyPOIs 
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

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        route: routeGeometry,
        max_distance: maxDistanceNum,
        categories: categories,
        pois: pois,
        count: pois.length
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

// Find POIs in bounding box
const findPOIsInBboxController = async (req, res) => {
  try {
    const { bbox, categories } = req.query;

    if (!bbox) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Bounding box is required'
      });
    }

    const bboxParts = bbox.split(',').map(coord => parseFloat(coord.trim()));
    if (bboxParts.length !== 4 || bboxParts.some(isNaN)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid bounding box format. Use: minLng,minLat,maxLng,maxLat'
      });
    }

    const [minLng, minLat, maxLng, maxLat] = bboxParts;
    const categoryList = categories ? categories.split(',').map(cat => cat.trim()) : [];

    const pois = await findPOIsInBbox(minLng, minLat, maxLng, maxLat, categoryList);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        bbox: { minLng, minLat, maxLng, maxLat },
        categories: categoryList,
        pois: pois,
        count: pois.length
      }
    });

  } catch (error) {
    console.error('Error in findPOIsInBboxController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while finding POIs in bounding box'
    });
  }
};

// Get POI categories
const getPOICategoriesController = async (req, res) => {
  try {
    const categories = await getPOICategories();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        categories: categories,
        count: categories.length
      }
    });

  } catch (error) {
    console.error('Error in getPOICategoriesController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while getting POI categories'
    });
  }
};

// Find nearby POIs
const findNearbyPOIsController = async (req, res) => {
  try {
    const { lat, lng, radius = 0.1, categories } = req.query;

    if (!lat || !lng) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid coordinate or radius format'
      });
    }

    const categoryList = categories ? categories.split(',').map(cat => cat.trim()) : [];
    const pois = await findNearbyPOIs(latNum, lngNum, radiusNum, categoryList);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        location: { lat: latNum, lng: lngNum },
        radius: radiusNum,
        categories: categoryList,
        pois: pois,
        count: pois.length
      }
    });

  } catch (error) {
    console.error('Error in findNearbyPOIsController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while finding nearby POIs'
    });
  }
};

module.exports = {
  findPOIsAlongRouteController,
  findComfortPOIsAlongRouteController,
  findPOIsInBboxController,
  getPOICategoriesController,
  findNearbyPOIsController
};
