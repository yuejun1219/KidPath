// Points of Interest routes

const express = require('express');
const router = express.Router();
const { 
  findPOIsAlongRouteController, 
  findComfortPOIsAlongRouteController,
  getRouteAmenitiesSummaryController
} = require('../controllers/poiController');

// POI search endpoints
router.post('/along-route', findPOIsAlongRouteController);
router.post('/comfort-along-route', findComfortPOIsAlongRouteController);
router.post('/route-amenities-summary', getRouteAmenitiesSummaryController);

module.exports = router;
