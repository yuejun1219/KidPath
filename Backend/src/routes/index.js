const express = require('express');
const seasonalComfortRoutes = require('./seasonalComfort');
const healthRoutes = require('./health');
const aiRoutes = require('./aiRoutes');
const amenitiesRoutes = require('./amenities');
const geojsonRoutes = require('./geojson');
const routeRoutes = require('./routes');
const comfortRoutes = require('./comfort');
const poiRoutes = require('./poi');
const playgrRoutes = require('./playgr');

const router = express.Router();

// API versioning
const API_VERSION = '/api/v1';

// routes
router.use(`${API_VERSION}/ai`, aiRoutes);
router.use(`${API_VERSION}/seasonal-comfort`, seasonalComfortRoutes);
router.use(`${API_VERSION}/amenities`, amenitiesRoutes);
router.use(`${API_VERSION}/geojson`, geojsonRoutes);
router.use(`${API_VERSION}/routes`, routeRoutes);
router.use(`${API_VERSION}/comfort`, comfortRoutes);
router.use(`${API_VERSION}/poi`, poiRoutes);
router.use('/', healthRoutes);
router.use(`${API_VERSION}/playgr`, playgrRoutes);

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
        by_id: '/api/v1/amenities/:id'
      },
      geojson: {
        parks: '/api/v1/geojson/parks',
        trees: '/api/v1/geojson/trees',
        grass: '/api/v1/geojson/grass',
        all: '/api/v1/geojson/all'
      },
      routes: {
        plan: '/api/v1/routes/plan',
        season: '/api/v1/routes/season'
      },
      comfort: {
        tree_coverage: '/api/v1/comfort/tree-coverage',
        amenities: '/api/v1/comfort/amenities',
        analyze_segment: '/api/v1/comfort/analyze-segment',
        seasonal_recommendations: '/api/v1/comfort/seasonal-recommendations'
      },
      poi: {
        along_route: '/api/v1/poi/along-route',
        comfort_along_route: '/api/v1/poi/comfort-along-route',
        in_bbox: '/api/v1/poi/in-bbox',
        categories: '/api/v1/poi/categories',
        nearby: '/api/v1/poi/nearby'
      }
    },
    documentation: 'https://github.com/your-repo/seasonal-comfort-api'
  });
});

module.exports = router;