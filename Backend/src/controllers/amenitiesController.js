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
    const { wheelchair, has_shade, open_now } = req.query;
    
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

    // Apply additional filters
    let filteredData = result.data;
    
    // Filter by wheelchair accessibility
    if (wheelchair === 'true') {
      filteredData = filteredData.filter(amenity => amenity.wheelchair === true);
    }
    
    // Filter by shade availability (if data available)
    if (has_shade === 'true') {
      filteredData = filteredData.filter(amenity => amenity.has_shade === true);
    }
    
    // Filter by opening hours (if open_now is true)
    if (open_now === 'true') {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      filteredData = filteredData.filter(amenity => {
        if (!amenity.opening_hours) return false;
        // Simple check - can be enhanced with proper opening hours parsing
        return amenity.opening_hours.toLowerCase().includes('24') || 
               amenity.opening_hours.toLowerCase().includes('always');
      });
    }

    // Format as GeoJSON
    const geoJsonData = formatAsGeoJSON(filteredData, {
      search_radius: validatedRadius,
      center: [validatedLon, validatedLat],
      categories: validatedCategories,
      filters: {
        wheelchair: wheelchair === 'true',
        has_shade: has_shade === 'true',
        open_now: open_now === 'true'
      }
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

    // Format as GeoJSON with enhanced metadata and slimming options
    const geoJsonData = formatBboxAsGeoJSON(result.data, {
      bbox: validatedBbox,
      category: validatedCategory,
      fields: req.validatedFields,
      zoom: req.validatedZoom
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

    // Format as GeoJSON Feature with enhanced details
    const geoJsonData = formatAsGeoJSON([result.data]);
    const amenity = geoJsonData.features[0];
    
    // Add enhanced details for Epic 6
    const enhancedAmenity = {
      ...amenity,
      properties: {
        ...amenity.properties,
        // Accessibility information
        wheelchair_accessible: result.data.wheelchair === true,
        has_shade: result.data.has_shade || false, // Add if available in database
        // Opening hours
        opening_hours: result.data.opening_hours || 'Unknown',
        is_open_24_7: result.data.opening_hours && 
                     (result.data.opening_hours.toLowerCase().includes('24') || 
                      result.data.opening_hours.toLowerCase().includes('always')),
        // Additional metadata
        last_updated: new Date().toISOString(),
        data_source: 'Melbourne Open Data',
        // Nearby amenities count (if available)
        nearby_amenities: {
          playgrounds: 0, // Can be calculated if needed
          fountains: 0,
          toilets: 0
        }
      }
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: enhancedAmenity
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

// Advanced amenities filter (for Epic 6)
const filterAmenitiesController = async (req, res) => {
  try {
    const { 
      lat, 
      lon, 
      radius = 1.0, 
      categories = [], 
      wheelchair, 
      has_shade, 
      open_now,
      limit = 50 
    } = req.query;

    if (!lat || !lon) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Latitude and longitude are required'
      });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = parseFloat(radius);
    const limitNum = parseInt(limit);

    if (isNaN(latNum) || isNaN(lonNum) || isNaN(radiusNum) || isNaN(limitNum)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid parameter format'
      });
    }

    // Get amenities with basic filters
    const result = await getNearbyAmenities(
      latNum,
      lonNum,
      radiusNum,
      categories,
      limitNum
    );

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Service Error',
        message: result.error || 'Failed to fetch amenities'
      });
    }

    // Apply advanced filters
    let filteredData = result.data;
    const appliedFilters = {};

    // Wheelchair accessibility filter
    if (wheelchair === 'true') {
      filteredData = filteredData.filter(amenity => amenity.wheelchair === true);
      appliedFilters.wheelchair = true;
    }

    // Shade availability filter
    if (has_shade === 'true') {
      filteredData = filteredData.filter(amenity => amenity.has_shade === true);
      appliedFilters.has_shade = true;
    }

    // Opening hours filter
    if (open_now === 'true') {
      const now = new Date();
      filteredData = filteredData.filter(amenity => {
        if (!amenity.opening_hours) return false;
        return amenity.opening_hours.toLowerCase().includes('24') || 
               amenity.opening_hours.toLowerCase().includes('always');
      });
      appliedFilters.open_now = true;
    }

    // Format as GeoJSON
    const geoJsonData = formatAsGeoJSON(filteredData, {
      search_radius: radiusNum,
      center: [lonNum, latNum],
      categories: categories,
      filters: appliedFilters
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.DATA_RETRIEVED,
      data: {
        ...geoJsonData,
        applied_filters: appliedFilters,
        total_found: filteredData.length,
        original_count: result.data.length
      }
    });

  } catch (error) {
    console.error('Error in filterAmenitiesController:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while filtering amenities'
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
  getPopularSearchTermsController,
  filterAmenitiesController
};
