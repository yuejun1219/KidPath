// Points of Interest routes

const express = require('express');
const router = express.Router();
const { 
  findPOIsAlongRouteController, 
  findComfortPOIsAlongRouteController,
  findPOIsInBboxController,
  getPOICategoriesController,
  findNearbyPOIsController,
  getRouteAmenitiesSummaryController
} = require('../controllers/poiController');
const { validateCoordinates, validateBbox } = require('../middleware/validation');

// POI search endpoints
router.post('/along-route', findPOIsAlongRouteController);
router.post('/comfort-along-route', findComfortPOIsAlongRouteController);
router.get('/in-bbox', validateBbox, findPOIsInBboxController);
router.get('/categories', getPOICategoriesController);
router.get('/nearby', validateCoordinates, findNearbyPOIsController);
router.post('/route-amenities-summary', getRouteAmenitiesSummaryController);

module.exports = router;
