const express = require('express');
const seasonalComfortRoutes = require('./seasonalComfort');
const healthRoutes = require('./health');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

// API versioning
const API_VERSION = '/api/v1';

// routes
router.use(API_VERSION, seasonalComfortRoutes);
router.use('/', healthRoutes);
router.use(`${API_VERSION}/ai`, aiRoutes);

// API root endpoint
router.get('/api', (req, res) => {
  res.json({
    service: 'Seasonal Comfort API',
    version: '1.0.0',
    description: 'Recommended Playgrounds for Seasonal Fun for Melbourne Families',
    endpoints: {
      health: '/health',
      seasonal_comfort: '/api/v1/seasonal-comfort',
      playground_detail: '/api/v1/playground/:id',
      nearest_playgrounds: '/api/v1/playgrounds/nearest',
      statistics: '/api/v1/statistics'
    },
    documentation: 'https://github.com/your-repo/seasonal-comfort-api'
  });
});

module.exports = router;