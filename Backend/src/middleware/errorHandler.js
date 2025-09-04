const { HTTP_STATUS } = require('../utils/constants');

// global error handler
const errorHandler = (error, req, res, next) => {
  console.error('Global Error Handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Database Connection Error',
      message: 'database connection failed'
    });
  }

  // PostgreSQL query errors
  if (error.code && error.code.startsWith('42')) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Database Query Error',
      message: 'database query failed: '
    });
  }

  // default error response
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
};

// 404
const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: 'Not Found',
    message: `root ${req.method} ${req.url} endpoint not found`,
    available_endpoints: {
      health: '/health',
      api_info: '/api',
      seasonal_comfort: '/api/v1/seasonal-comfort'
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};