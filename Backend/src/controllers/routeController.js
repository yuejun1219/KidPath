// src/controllers/routeController.js
// Route planning controller

const { planComfortRoute, getCurrentSeason } = require('../services/routeService');
const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');

// Plan comfort-optimized route
const planRouteController = async (req, res) => {
  try {
    const { startLng, startLat, endLng, endLat, season } = req.query;

    // Validate required parameters
    if (!startLng || !startLat || !endLng || !endLat) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Start and end coordinates are required'
      });
    }

    // Validate coordinate ranges
    const startLngNum = parseFloat(startLng);
    const startLatNum = parseFloat(startLat);
    const endLngNum = parseFloat(endLng);
    const endLatNum = parseFloat(endLat);

    if (isNaN(startLngNum) || isNaN(startLatNum) || isNaN(endLngNum) || isNaN(endLatNum)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid coordinate format'
      });
    }

    // Validate Melbourne area (rough bounds)
    if (startLngNum < 144.5 || startLngNum > 146.0 || startLatNum < -38.5 || startLatNum > -37.0 ||
        endLngNum < 144.5 || endLngNum > 146.0 || endLatNum < -38.5 || endLatNum > -37.0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Coordinates must be within Melbourne area'
      });
    }

    // Plan route
    const result = await planComfortRoute(startLngNum, startLatNum, endLngNum, endLatNum, { season });

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Route Planning Error',
        message: result.error
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: result.data
    });

  } catch (error) {
    console.error('Error in planRouteController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while planning route'
    });
  }
};

// Get current season
const getCurrentSeasonController = async (req, res) => {
  try {
    const season = getCurrentSeason();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        season: season,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getCurrentSeasonController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while getting season'
    });
  }
};

module.exports = {
  planRouteController,
  getCurrentSeasonController
};
