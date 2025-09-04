const express = require('express');
const healthController = require('../controllers/health');

const router = express.Router();

router.get('/health', healthController.healthCheck);

router.get('/health/detailed', healthController.detailedHealthCheck);

router.get('/api/test', healthController.detailedHealthCheck);

module.exports = router;