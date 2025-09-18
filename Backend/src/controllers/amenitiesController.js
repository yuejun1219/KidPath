// src/controllers/amenitiesController.js
// Controller for amenities API endpoints

const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');
const {
  getNearbyAmenities,
  getAmenitiesByBbox,
  searchAmenitiesByName,
  getAmenityCategories,
  getAmenityById,
  getSearchSuggestions,
  getPopularSearchTerms,
  formatAsGeoJSON,
  formatBboxAsGeoJSON,
  formatSearchAsGeoJSON
} = require('../services/amenitiesService');

// Get nearby amenities
const getNearbyAmenitiesController = async (req, res) => {
  try {
    const { validatedLat, validatedLon, validatedRadius, validatedCategories, validatedLimit } = req;
    
    // Call service to get nearby amenities
    const result = await getNearbyAmenities(
      validatedLat,
      validatedLon,
      validatedRadius,
      validatedCategories,
      validatedLimit
    );

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch nearby amenities'
      });
    }

    // Format as GeoJSON
    const geoJsonData = formatAsGeoJSON(result.data, {
      search_radius: validatedRadius,
      center: [validatedLon, validatedLat],
      categories: validatedCategories
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: geoJsonData
    });

  } catch (error) {
    console.error('Error in getNearbyAmenitiesController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching nearby amenities'
    });
  }
};

// Get amenities by bounding box
const getAmenitiesByBboxController = async (req, res) => {
  try {
    const { validatedBbox, validatedCategory, validatedLimit } = req;
    
    // Call service to get amenities by bbox
    const result = await getAmenitiesByBbox(
      validatedBbox,
      validatedCategory,
      validatedLimit
    );

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch amenities by bbox'
      });
    }

    // Format as GeoJSON with enhanced metadata
    const geoJsonData = formatBboxAsGeoJSON(result.data, {
      bbox: validatedBbox,
      category: validatedCategory
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: geoJsonData
    });

  } catch (error) {
    console.error('Error in getAmenitiesByBboxController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching amenities by bbox'
    });
  }
};

// Search amenities by name
const searchAmenitiesByNameController = async (req, res) => {
  try {
    const { validatedSearchName, validatedCategory, validatedLimit } = req;
    
    // Call service to search amenities by name
    const result = await searchAmenitiesByName(
      validatedSearchName,
      validatedCategory,
      validatedLimit
    );

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to search amenities by name'
      });
    }

    // Format as GeoJSON with enhanced metadata
    const geoJsonData = formatSearchAsGeoJSON(result.data, {
      search_name: validatedSearchName,
      category: validatedCategory
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: geoJsonData
    });

  } catch (error) {
    console.error('Error in searchAmenitiesByNameController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while searching amenities by name'
    });
  }
};

// Get available amenity categories
const getAmenityCategoriesController = async (req, res) => {
  try {
    // Call service to get categories
    const result = await getAmenityCategories();

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch amenity categories'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        categories: result.data,
        count: result.count
      }
    });

  } catch (error) {
    console.error('Error in getAmenityCategoriesController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching amenity categories'
    });
  }
};

// Get amenity by ID
const getAmenityByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Amenity ID is required'
      });
    }

    // Call service to get amenity by ID
    const result = await getAmenityById(id);

    if (!result.success) {
      if (result.error === 'Amenity not found') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: 'Amenity not found'
        });
      }
      
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch amenity by ID'
      });
    }

    // Format as GeoJSON Feature
    const geoJsonData = formatAsGeoJSON([result.data]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: geoJsonData.features[0] // Return single feature, not collection
    });

  } catch (error) {
    console.error('Error in getAmenityByIdController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching amenity by ID'
    });
  }
};

// Get search suggestions
const getSearchSuggestionsController = async (req, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchLimit = Math.min(parseInt(limit) || 10, 20);
    
    // Call service to get search suggestions
    const result = await getSearchSuggestions(q.trim(), searchLimit);

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch search suggestions'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        suggestions: result.data,
        count: result.count,
        query: q.trim()
      }
    });

  } catch (error) {
    console.error('Error in getSearchSuggestionsController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching search suggestions'
    });
  }
};

// Get popular search terms
const getPopularSearchTermsController = async (req, res) => {
  try {
    const { limit } = req.query;
    const searchLimit = Math.min(parseInt(limit) || 20, 50);
    
    // Call service to get popular search terms
    const result = await getPopularSearchTerms(searchLimit);

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch popular search terms'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        popular_terms: result.data,
        count: result.count
      }
    });

  } catch (error) {
    console.error('Error in getPopularSearchTermsController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching popular search terms'
    });
  }
};

module.exports = {
  getNearbyAmenitiesController,
  getAmenitiesByBboxController,
  searchAmenitiesByNameController,
  getAmenityCategoriesController,
  getAmenityByIdController,
  getSearchSuggestionsController,
  getPopularSearchTermsController
};
