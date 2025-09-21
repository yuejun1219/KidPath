// Comfort analysis controller

const { 
  getTreeCanopyCoverage, 
  getComfortAmenities, 
  analyzeRouteSegment,
  getSeasonalRecommendations 
} = require('../services/comfortService');
const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');

// Get tree canopy coverage for a point
const getTreeCoverageController = async (req, res) => {
  try {
    // Support both query parameters and JSON body
    let lat, lng, radius = 0.1;
    
    if (req.body && (req.body.lat || req.body.lng)) {
      // JSON body format
      ({ lat, lng, radius = 0.1 } = req.body);
    } else {
      // Query parameters format
      ({ lat, lng, radius = 0.1 } = req.query);
    }

    if (lat === undefined || lng === undefined) {
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

    const result = await getTreeCanopyCoverage(latNum, lngNum, radiusNum);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        location: { lat: latNum, lng: lngNum },
        radius: radiusNum,
        tree_coverage: result
      }
    });

  } catch (error) {
    console.error('Error in getTreeCoverageController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while getting tree coverage'
    });
  }
};

// Get comfort amenities near a point
const getComfortAmenitiesController = async (req, res) => {
  try {
    const { lat, lng, radius = 0.1 } = req.query;

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

    const amenities = await getComfortAmenities(latNum, lngNum, radiusNum);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        location: { lat: latNum, lng: lngNum },
        radius: radiusNum,
        amenities: amenities,
        count: amenities.length
      }
    });

  } catch (error) {
    console.error('Error in getComfortAmenitiesController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while getting comfort amenities'
    });
  }
};

// Analyze route segment comfort
const analyzeSegmentController = async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Start and end coordinates are required'
      });
    }

    const startLatNum = parseFloat(startLat);
    const startLngNum = parseFloat(startLng);
    const endLatNum = parseFloat(endLat);
    const endLngNum = parseFloat(endLng);

    if (isNaN(startLatNum) || isNaN(startLngNum) || isNaN(endLatNum) || isNaN(endLngNum)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid coordinate format'
      });
    }

    const analysis = await analyzeRouteSegment(startLatNum, startLngNum, endLatNum, endLngNum);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: analysis
    });

  } catch (error) {
    console.error('Error in analyzeSegmentController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while analyzing segment'
    });
  }
};

// Get seasonal comfort recommendations
const getSeasonalRecommendationsController = async (req, res) => {
  try {
    const { season } = req.query;
    
    const recommendations = getSeasonalRecommendations(season);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        season: season || 'current',
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error('Error in getSeasonalRecommendationsController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while getting seasonal recommendations'
    });
  }
};

module.exports = {
  getTreeCoverageController,
  getComfortAmenitiesController,
  analyzeSegmentController,
  getSeasonalRecommendationsController
};
