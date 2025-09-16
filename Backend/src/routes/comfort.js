// src/routes/comfort.js
// Comfort analysis routes

const express = require('express');
const router = express.Router();
const { 
  getTreeCoverageController, 
  getComfortAmenitiesController, 
  analyzeSegmentController,
  getSeasonalRecommendationsController 
} = require('../controllers/comfortController');
const { validateCoordinates, validateRouteSegment } = require('../middleware/validation');

// Comfort analysis endpoints
router.get('/tree-coverage', validateCoordinates, getTreeCoverageController);
router.get('/amenities', validateCoordinates, getComfortAmenitiesController);
router.get('/analyze-segment', validateRouteSegment, analyzeSegmentController);
router.get('/seasonal-recommendations', getSeasonalRecommendationsController);

module.exports = router;
