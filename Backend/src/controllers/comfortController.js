// Comfort analysis controller

const { 
  getTreeCanopyCoverage
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

module.exports = { getTreeCoverageController };
