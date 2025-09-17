// src/services/amenitiesService.js
// Service layer for amenities data operations

// Use dedicated amenities pool (seasonal_comfort_db / comfort schema)
const { amenitiesPool } = require('../config/amenitiesDatabase');
const { 
  getNearbyAmenitiesQuery,
  getAmenitiesByBboxQuery,
  searchAmenitiesByNameQuery,
  getAmenityCategoriesQuery,
  getAmenityByIdQuery,
  getSearchSuggestionsQuery,
  getPopularSearchTermsQuery
} = require('../queries/amenities');

// Get nearby amenities using the DS team's function
const getNearbyAmenities = async (lat, lon, radius, categories, limit) => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      // Use default categories if none provided (as per DS documentation)
      const categoriesToUse = categories && categories.length > 0 
        ? categories 
        : ['playground','toilet','library','community_centre','park'];
      
      // Call the DS team's function: comfort.nearby_amenities(p_lat, p_lon, p_categories, p_radius_m, p_limit)
      const result = await client.query(getNearbyAmenitiesQuery, [
        lat,           // $1: latitude
        lon,           // $2: longitude  
        categoriesToUse, // $3: categories array (with defaults)
        radius,        // $4: radius in meters
        limit          // $5: limit
      ]);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getNearbyAmenities:', error);
    throw new Error(`Failed to fetch nearby amenities: ${error.message}`);
  }
};

// Get amenities by bounding box
const getAmenitiesByBbox = async (bbox, category, limit) => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      const { minLon, minLat, maxLon, maxLat } = bbox;
      
      // Build parameters for bbox query
      const params = [minLon, minLat, maxLon, maxLat, category ? [category] : null, limit];

      const result = await client.query(getAmenitiesByBboxQuery, params);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getAmenitiesByBbox:', error);
    throw new Error(`Failed to fetch amenities by bbox: ${error.message}`);
  }
};

// Search amenities by name
const searchAmenitiesByName = async (name, category, limit) => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      // Build parameters for search query
      const params = [name, category || null, limit];
      
      // Ensure category is properly typed
      if (params[1] === null) {
        params[1] = null;
      }

      const result = await client.query(searchAmenitiesByNameQuery, params);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in searchAmenitiesByName:', error);
    throw new Error(`Failed to search amenities by name: ${error.message}`);
  }
};

// Get available amenity categories
const getAmenityCategories = async () => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      const result = await client.query(getAmenityCategoriesQuery);
      
      return {
        success: true,
        data: result.rows.map(row => row.category),
        count: result.rows.length
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getAmenityCategories:', error);
    throw new Error(`Failed to fetch amenity categories: ${error.message}`);
  }
};

// Get amenity by ID
const getAmenityById = async (amenityId) => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      const result = await client.query(getAmenityByIdQuery, [amenityId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Amenity not found'
        };
      }

      return {
        success: true,
        data: result.rows[0],
        count: 1
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getAmenityById:', error);
    throw new Error(`Failed to fetch amenity by ID: ${error.message}`);
  }
};

// Format amenities data as GeoJSON FeatureCollection
const formatAsGeoJSON = (amenities, metadata = {}) => {
  const features = amenities.map(amenity => {
    // Parse geometry if it's a string
    let geometry;
    try {
      geometry = typeof amenity.geometry === 'string' 
        ? JSON.parse(amenity.geometry) 
        : amenity.geometry;
    } catch (error) {
      console.error('Error parsing geometry:', error);
      geometry = null;
    }

    return {
      type: 'Feature',
      properties: {
        amenity_id: amenity.amenity_id,
        category: amenity.category,
        name: amenity.name,
        distance_m: amenity.distance_m,
        opening_hours: amenity.opening_hours,
        wheelchair: amenity.wheelchair,
        address: amenity.address,
        similarity_score: amenity.similarity_score,
        // Additional properties for bbox queries
        lon: amenity.lon,
        lat: amenity.lat
      },
      geometry: geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features: features,
    metadata: {
      total_found: features.length,
      ...metadata
    }
  };
};

// Format bbox amenities with enhanced metadata
const formatBboxAsGeoJSON = (amenities, metadata = {}) => {
  if (amenities.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        total_found: 0,
        ...metadata
      }
    };
  }

  // Extract metadata from first row
  const firstRow = amenities[0];
  const categoryBreakdown = firstRow.category_breakdown || [];
  const totalInBbox = firstRow.total_in_bbox || 0;

  const features = amenities.map(amenity => {
    // Parse geometry if it's a string
    let geometry;
    try {
      geometry = typeof amenity.geometry === 'string' 
        ? JSON.parse(amenity.geometry) 
        : amenity.geometry;
    } catch (error) {
      console.error('Error parsing geometry:', error);
      geometry = null;
    }

    return {
      type: 'Feature',
      properties: {
        amenity_id: amenity.amenity_id,
        category: amenity.category,
        name: amenity.name,
        opening_hours: amenity.opening_hours,
        wheelchair: amenity.wheelchair,
        lon: amenity.lon,
        lat: amenity.lat
      },
      geometry: geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features: features,
    metadata: {
      total_found: features.length,
      total_in_bbox: totalInBbox,
      category_breakdown: categoryBreakdown,
      ...metadata
    }
  };
};

// Get search suggestions
const getSearchSuggestions = async (query, limit = 10) => {
  try {
    const client = await amenitiesPool.connect();
    
    try {
      const result = await client.query(getSearchSuggestionsQuery, [query, limit]);
      
      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getSearchSuggestions:', error);
    throw new Error(`Failed to fetch search suggestions: ${error.message}`);
  }
};

// Get popular search terms
const getPopularSearchTerms = async (limit = 20) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(getPopularSearchTermsQuery, [limit]);
      
      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getPopularSearchTerms:', error);
    throw new Error(`Failed to fetch popular search terms: ${error.message}`);
  }
};

// Format search results as GeoJSON with enhanced metadata
const formatSearchAsGeoJSON = (amenities, metadata = {}) => {
  if (amenities.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
      metadata: {
        total_found: 0,
        ...metadata
      }
    };
  }

  // Extract metadata from first row
  const firstRow = amenities[0];
  const categoryBreakdown = firstRow.category_breakdown || [];
  const totalMatches = firstRow.total_matches || 0;

  const features = amenities.map(amenity => {
    // Parse geometry if it's a string
    let geometry;
    try {
      geometry = typeof amenity.geometry === 'string' 
        ? JSON.parse(amenity.geometry) 
        : amenity.geometry;
    } catch (error) {
      console.error('Error parsing geometry:', error);
      geometry = null;
    }

    return {
      type: 'Feature',
      properties: {
        amenity_id: amenity.amenity_id,
        category: amenity.category,
        name: amenity.name,
        opening_hours: amenity.opening_hours,
        wheelchair: amenity.wheelchair,
        similarity_score: amenity.similarity_score,
        relevance_score: amenity.relevance_score,
        lon: amenity.lon,
        lat: amenity.lat
      },
      geometry: geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features: features,
    metadata: {
      total_found: features.length,
      total_matches: totalMatches,
      category_breakdown: categoryBreakdown,
      ...metadata
    }
  };
};

module.exports = {
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
};
