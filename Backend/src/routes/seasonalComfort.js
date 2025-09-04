const express = require('express');
const seasonalComfortController = require('../controllers/seasonalComfort');

const router = express.Router();

// Seasonal Comfortness Primary API
router.get('/seasonal-comfort', seasonalComfortController.getSeasonalComfortData);

// get single playground details by id
router.get('/playground/:id', seasonalComfortController.getPlaygroundDetail);

// get nearest playgrounds
router.get('/playgrounds/nearest', seasonalComfortController.getNearestPlaygrounds);

// get playground overall statistics
router.get('/statistics', seasonalComfortController.getStatistics);

module.exports = router;