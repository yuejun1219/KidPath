// src/utils/validation.js
// Validation utility functions for amenities API

const { VALIDATION_RULES } = require('./constants');

// Validate coordinate range
const validateCoordinateRange = (lat, lon) => {
  const errors = [];
  
  if (lat === undefined || lat === null || lat === '') {
    errors.push('Latitude is required');
  } else if (isNaN(Number(lat))) {
    errors.push('Latitude must be a number');
  } else if (Number(lat) < VALIDATION_RULES.COORDINATES.LATITUDE.MIN || 
             Number(lat) > VALIDATION_RULES.COORDINATES.LATITUDE.MAX) {
    errors.push(`Latitude must be between ${VALIDATION_RULES.COORDINATES.LATITUDE.MIN} and ${VALIDATION_RULES.COORDINATES.LATITUDE.MAX}`);
  }
  
  if (lon === undefined || lon === null || lon === '') {
    errors.push('Longitude is required');
  } else if (isNaN(Number(lon))) {
    errors.push('Longitude must be a number');
  } else if (Number(lon) < VALIDATION_RULES.COORDINATES.LONGITUDE.MIN || 
             Number(lon) > VALIDATION_RULES.COORDINATES.LONGITUDE.MAX) {
    errors.push(`Longitude must be between ${VALIDATION_RULES.COORDINATES.LONGITUDE.MIN} and ${VALIDATION_RULES.COORDINATES.LONGITUDE.MAX}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate radius
const validateRadius = (radius) => {
  const errors = [];
  
  if (radius === undefined || radius === null || radius === '') {
    return { isValid: true, value: 1500 }; // default radius
  }
  
  const radiusNum = Number(radius);
  if (isNaN(radiusNum)) {
    errors.push('Radius must be a number');
  } else if (radiusNum < 1 || radiusNum > 5000) {
    errors.push('Radius must be between 1 and 5000 meters');
  }
  
  return {
    isValid: errors.length === 0,
    value: radiusNum,
    errors
  };
};

// Validate limit
const validateLimit = (limit) => {
  const errors = [];
  
  if (limit === undefined || limit === null || limit === '') {
    return { isValid: true, value: 50 }; // default limit
  }
  
  const limitNum = Number(limit);
  if (isNaN(limitNum)) {
    errors.push('Limit must be a number');
  } else if (limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be between 1 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    value: limitNum,
    errors
  };
};

// Validate categories array
const validateCategories = (cats) => {
  const errors = [];
  
  if (!cats || cats === '') {
    return { isValid: true, value: [] }; // no categories filter
  }
  
  // Split comma-separated categories
  const categories = cats.split(',').map(cat => cat.trim()).filter(cat => cat);
  
  if (categories.length === 0) {
    return { isValid: true, value: [] };
  }
  
  // Validate each category (based on DS documentation)
  const validCategories = ['playground', 'toilet', 'library', 'community_centre', 'park'];
  const invalidCategories = categories.filter(cat => !validCategories.includes(cat.toLowerCase()));
  
  if (invalidCategories.length > 0) {
    errors.push(`Invalid categories: ${invalidCategories.join(', ')}. Valid categories: ${validCategories.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    value: categories.map(cat => cat.toLowerCase()),
    errors
  };
};

// Validate bounding box format with enhanced checks
const validateBoundingBox = (bbox) => {
  const errors = [];
  
  if (!bbox || bbox === '') {
    errors.push('Bounding box is required');
    return { isValid: false, errors };
  }
  
  const parts = bbox.split(',');
  if (parts.length !== 4) {
    errors.push('Bounding box must have 4 coordinates: minLon,minLat,maxLon,maxLat');
    return { isValid: false, errors };
  }
  
  const [minLon, minLat, maxLon, maxLat] = parts.map(coord => Number(coord.trim()));
  
  if (isNaN(minLon) || isNaN(minLat) || isNaN(maxLon) || isNaN(maxLat)) {
    errors.push('All bounding box coordinates must be numbers');
    return { isValid: false, errors };
  }
  
  // Check coordinate ranges
  if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
    errors.push('Longitude values must be between -180 and 180');
  }
  
  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
    errors.push('Latitude values must be between -90 and 90');
  }
  
  if (minLon >= maxLon) {
    errors.push('minLon must be less than maxLon');
  }
  
  if (minLat >= maxLat) {
    errors.push('minLat must be less than maxLat');
  }
  
  // Check bounding box size (prevent extremely large or small boxes)
  const lonDiff = maxLon - minLon;
  const latDiff = maxLat - minLat;
  
  if (lonDiff > 10 || latDiff > 10) {
    errors.push('Bounding box is too large. Maximum size is 10 degrees in any direction');
  }
  
  if (lonDiff < 0.001 || latDiff < 0.001) {
    errors.push('Bounding box is too small. Minimum size is 0.001 degrees in any direction');
  }
  
  // Check if bbox is reasonable for Melbourne area (rough bounds)
  const melbourneBounds = {
    minLon: 144.5, maxLon: 146.0,
    minLat: -38.5, maxLat: -37.0
  };
  
  if (minLon < melbourneBounds.minLon || maxLon > melbourneBounds.maxLon ||
      minLat < melbourneBounds.minLat || maxLat > melbourneBounds.maxLat) {
    console.warn('Bounding box extends beyond Melbourne metropolitan area');
  }
  
  return {
    isValid: errors.length === 0,
    value: { minLon, minLat, maxLon, maxLat },
    errors
  };
};

// Validate search name
const validateSearchName = (name) => {
  const errors = [];
  
  if (!name || name.trim() === '') {
    errors.push('Search name is required');
  } else if (name.trim().length < 2) {
    errors.push('Search name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Search name must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    value: name.trim(),
    errors
  };
};

module.exports = {
  validateCoordinateRange,
  validateRadius,
  validateLimit,
  validateCategories,
  validateBoundingBox,
  validateSearchName
};
