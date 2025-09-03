const playgroundService = require('../services/playgroundService');
const { testConnection } = require('../config/database');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');

class HealthController {
  
  async healthCheck(req, res) {
    try {
      const response = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Seasonal Comfort API',
        version: '1.0.0',
        uptime: process.uptime()
      };
      
      res.json(response);
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async detailedHealthCheck(req, res) {
    try {
      const dbConnected = await testConnection();
      const stats = await playgroundService.getStatistics();

      const response = {
        status: dbConnected ? 'OK' : 'WARNING',
        timestamp: new Date().toISOString(),
        service: 'Seasonal Comfort API',
        checks: {
          database: {
            connected: dbConnected,
            message: dbConnected ? SUCCESS_MESSAGES.DATABASE_CONNECTED : 'Database connection failed'
          },
          data: {
            playground_count: parseInt(stats.total_playgrounds),
            canopy_count: parseInt(stats.total_canopy_polygons),
            playgrounds_with_location: parseInt(stats.playgrounds_with_location)
          }
        },
        system: {
          uptime_seconds: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version
        }
      };

      const statusCode = dbConnected ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('health test failed:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: {
            connected: false,
            message: 'Database connection test failed'
          }
        }
      });
    }
  }
}

module.exports = new HealthController();