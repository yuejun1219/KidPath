// Comfort analysis routes

const express = require('express');
const router = express.Router();
const { 
  getTreeCoverageController
} = require('../controllers/comfortController');
const { validateCoordinates } = require('../middleware/validation');

// Comfort analysis endpoints
router.post('/tree-coverage', validateCoordinates, getTreeCoverageController);
router.get('/tree-coverage', validateCoordinates, getTreeCoverageController);

module.exports = router;
