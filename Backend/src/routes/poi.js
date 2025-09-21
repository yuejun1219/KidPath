// Points of Interest routes

const express = require('express');
const router = express.Router();
const { 
  findPOIsAlongRouteController, 
  findComfortPOIsAlongRouteController, 
  findPOIsInBboxController,
  getPOICategoriesController,
  findNearbyPOIsController 
} = require('../controllers/poiController');
const { validateCoordinates, validateBbox } = require('../middleware/validation');

// POI search endpoints
router.post('/along-route', findPOIsAlongRouteController);
router.post('/comfort-along-route', findComfortPOIsAlongRouteController);
router.get('/in-bbox', validateBbox, findPOIsInBboxController);
router.get('/categories', getPOICategoriesController);
router.get('/nearby', validateCoordinates, findNearbyPOIsController);

module.exports = router;
