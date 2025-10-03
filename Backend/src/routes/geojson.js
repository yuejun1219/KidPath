// Proxy route for S3 GeoJSON files to avoid CORS issues

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// S3 URLs
const S3_BASE_URL = 'https://kidpath-geojson.s3.ap-southeast-2.amazonaws.com';

// Cache for GeoJSON data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get GeoJSON data from S3 with caching
const getGeoJSONData = async (fileName) => {
  const cacheKey = fileName;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const response = await fetch(`${S3_BASE_URL}/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${fileName}:`, error);
    throw error;
  }
};

// GET /api/v1/geojson/parks
router.get('/parks', async (req, res) => {
  try {
    const data = await getGeoJSONData('parks.geojson');
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch parks data',
      message: error.message
    });
  }
});

// GET /api/v1/geojson/trees
router.get('/trees', async (req, res) => {
  try {
    const data = await getGeoJSONData('trees.geojson');
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch trees data',
      message: error.message
    });
  }
});

// GET /api/v1/geojson/all - Get all GeoJSON data
router.get('/all', async (req, res) => {
  try {
    const [parks, trees, grass] = await Promise.all([
      getGeoJSONData('parks.geojson'),
      getGeoJSONData('trees.geojson'),
      getGeoJSONData('grass.geojson')
    ]);
    
    res.json({
      parks,
      trees,
      grass
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch GeoJSON data',
      message: error.message
    });
  }
});

module.exports = router;
