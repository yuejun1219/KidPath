// src/middleware/validation.js
// Validation middleware for amenities API

const { HTTP_STATUS } = require('../utils/constants');
const { 
  validateCoordinateRange, 
  validateRadius, 
  validateLimit, 
  validateCategories,
  validateBoundingBox,
  validateSearchName
} = require('../utils/validation');

// Validate nearby amenities parameters
const validateNearbyAmenities = (req, res, next) => {
  const { lat, lon, radius, limit, cats } = req.query;
  const errors = [];

  // Validate coordinates
  const coordValidation = validateCoordinateRange(lat, lon);
  if (!coordValidation.isValid) {
    errors.push(...coordValidation.errors);
  }

  // Validate radius
  const radiusValidation = validateRadius(radius);
  if (!radiusValidation.isValid) {
    errors.push(...radiusValidation.errors);
  } else {
    req.validatedRadius = radiusValidation.value;
  }

  // Validate limit
  const limitValidation = validateLimit(limit);
  if (!limitValidation.isValid) {
    errors.push(...limitValidation.errors);
  } else {
    req.validatedLimit = limitValidation.value;
  }

  // Validate categories
  const categoriesValidation = validateCategories(cats);
  if (!categoriesValidation.isValid) {
    errors.push(...categoriesValidation.errors);
  } else {
    req.validatedCategories = categoriesValidation.value;
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: errors
    });
  }

  // Store validated values for controller use
  req.validatedLat = Number(lat);
  req.validatedLon = Number(lon);

  next();
};

// Validate bbox amenities parameters
const validateBboxAmenities = (req, res, next) => {
  const { bbox, category, limit } = req.query;
  const errors = [];

  // Validate bounding box
  const bboxValidation = validateBoundingBox(bbox);
  if (!bboxValidation.isValid) {
    errors.push(...bboxValidation.errors);
  } else {
    req.validatedBbox = bboxValidation.value;
  }

  // Validate category (optional)
  if (category) {
    const categoryValidation = validateCategories(category);
    if (!categoryValidation.isValid) {
      errors.push(...categoryValidation.errors);
    } else {
      req.validatedCategory = categoryValidation.value[0]; // single category for bbox
    }
  }

  // Validate limit
  const limitValidation = validateLimit(limit);
  if (!limitValidation.isValid) {
    errors.push(...limitValidation.errors);
  } else {
    req.validatedLimit = limitValidation.value;
  }

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: errors
    });
  }

  next();
};

// Validate search amenities parameters
const validateSearchAmenities = (req, res, next) => {
  const { name, category, limit } = req.query;
  const errors = [];

  // Validate search name
  const nameValidation = validateSearchName(name);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  } else {
    req.validatedSearchName = nameValidation.value;
  }

  // Validate category (optional)
  if (category) {
    const categoryValidation = validateCategories(category);
    if (!categoryValidation.isValid) {
      errors.push(...categoryValidation.errors);
    } else {
      req.validatedCategory = categoryValidation.value[0]; // single category for search
    }
  }

  // Validate limit (default to 15 for search)
  const limitValidation = validateLimit(limit || 15);
  if (!limitValidation.isValid) {
    errors.push(...limitValidation.errors);
  } else {
    req.validatedLimit = limitValidation.value;
  }

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: errors
    });
  }

  next();
};

// Validate route planning parameters
const validateRoutePlanning = (req, res, next) => {
  const { startLng, startLat, endLng, endLat } = req.query;
  
  if (!startLng || !startLat || !endLng || !endLat) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Start and end coordinates are required'
    });
  }
  
  next();
};

// Validate coordinates
const validateCoordinates = (req, res, next) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Latitude and longitude are required'
    });
  }
  
  next();
};

// Validate route segment
const validateRouteSegment = (req, res, next) => {
  const { startLat, startLng, endLat, endLng } = req.query;
  
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Start and end coordinates are required'
    });
  }
  
  next();
};

// Validate bounding box
const validateBbox = (req, res, next) => {
  const { bbox } = req.query;
  
  if (!bbox) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Bounding box is required'
    });
  }
  
  next();
};

module.exports = {
  validateNearbyAmenities,
  validateBboxAmenities,
  validateSearchAmenities,
  validateRoutePlanning,
  validateCoordinates,
  validateRouteSegment,
  validateBbox
};
