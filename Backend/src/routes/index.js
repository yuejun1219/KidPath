const express = require('express');
const seasonalComfortRoutes = require('./seasonalComfort');
const healthRoutes = require('./health');
const aiRoutes = require('./aiRoutes');
const amenitiesRoutes = require('./amenities');
const geojsonRoutes = require('./geojson');
const comfortRoutes = require('./comfort');
const poiRoutes = require('./poi');

const router = express.Router();

// API versioning
const API_VERSION = '/api/v1';

// routes
router.use(`${API_VERSION}/ai`, aiRoutes);
router.use(`${API_VERSION}/seasonal-comfort`, seasonalComfortRoutes);
router.use(`${API_VERSION}/amenities`, amenitiesRoutes);
router.use(`${API_VERSION}/geojson`, geojsonRoutes);
router.use(`${API_VERSION}/comfort`, comfortRoutes);
router.use(`${API_VERSION}/poi`, poiRoutes);
router.use('/', healthRoutes);

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
      statistics: '/api/v1/statistics',
      ai: '/api/v1/ai/chat',
      amenities: {
        nearby: '/api/v1/amenities/nearby',
        bbox: '/api/v1/amenities/bbox',
        search: '/api/v1/amenities/search',
        categories: '/api/v1/amenities/categories',
        suggestions: '/api/v1/amenities/suggestions',
        popular: '/api/v1/amenities/popular',
        by_id: '/api/v1/amenities/:id',
        filter: '/api/v1/amenities/filter'
      },
      geojson: {
        parks: '/api/v1/geojson/parks',
        trees: '/api/v1/geojson/trees',
        all: '/api/v1/geojson/all'
      },
      comfort: {
        tree_coverage: '/api/v1/comfort/tree-coverage'
      },
      poi: {
        along_route: '/api/v1/poi/along-route',
        comfort_along_route: '/api/v1/poi/comfort-along-route',
        route_amenities_summary: '/api/v1/poi/route-amenities-summary'
      }
    },
    documentation: 'https://github.com/your-repo/seasonal-comfort-api'
  });
});

module.exports = router;