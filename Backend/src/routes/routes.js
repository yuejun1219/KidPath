// src/routes/routes.js
// Route planning routes

const express = require('express');
const router = express.Router();
const { planRouteController, getCurrentSeasonController } = require('../controllers/routeController');
const { validateRoutePlanning } = require('../middleware/validation');

// Route planning endpoints
router.post('/plan', validateRoutePlanning, planRouteController);
router.get('/plan', validateRoutePlanning, planRouteController);
router.get('/season', getCurrentSeasonController);

module.exports = router;
