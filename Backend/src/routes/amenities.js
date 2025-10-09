// Routes for amenities API endpoints

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getNearbyAmenitiesController,
  getAmenitiesByBboxController,
  searchAmenitiesByNameController,
  getAmenityCategoriesController,
  getAmenityByIdController,
  getSearchSuggestionsController,
  getPopularSearchTermsController,
  filterAmenitiesController
} = require('../controllers/amenitiesController');

// Import validation middleware
const {
  validateNearbyAmenities,
  validateBboxAmenities,
  validateSearchAmenities
} = require('../middleware/validation');

// GET /api/amenities/nearby - Get nearby amenities
router.get('/nearby', validateNearbyAmenities, getNearbyAmenitiesController);

// GET /api/amenities/bbox - Get amenities by bounding box
router.get('/bbox', validateBboxAmenities, getAmenitiesByBboxController);

// GET /api/amenities/search - Search amenities by name
router.get('/search', validateSearchAmenities, searchAmenitiesByNameController);

// GET /api/amenities/categories - Get available amenity categories
router.get('/categories', getAmenityCategoriesController);

// GET /api/amenities/suggestions - Get search suggestions
router.get('/suggestions', getSearchSuggestionsController);

// GET /api/amenities/popular - Get popular search terms
router.get('/popular', getPopularSearchTermsController);

// GET /api/amenities/filter - Advanced amenities filter (Epic 6)
// IMPORTANT: place this BEFORE '/:id' so it doesn't get captured as an ID
router.get('/filter', filterAmenitiesController);

// GET /api/amenities/:id - Get amenity by ID
router.get('/:id', getAmenityByIdController);

module.exports = router;
