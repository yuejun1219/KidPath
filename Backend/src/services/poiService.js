// src/services/poiService.js
// Points of Interest service for route-based searches

const { pool } = require('../config/database');
const turf = require('@turf/turf');

// Find POIs along a route
const findPOIsAlongRoute = async (routeGeometry, maxDistance = 0.1) => {
  try {
    const client = await pool.connect();
    
    try {
      // Convert route geometry to PostGIS format
      const routeWKT = `LINESTRING(${routeGeometry.coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`;
      
      const query = `
        SELECT 
          amenity_id,
          category,
          name,
          opening_hours,
          wheelchair,
          ST_AsGeoJSON(geom) as geometry,
          ST_Distance(geom, ST_GeomFromText($1, 4326)) as distance
        FROM comfort.amenities 
        WHERE ST_DWithin(
          geom, 
          ST_GeomFromText($1, 4326), 
          $2
        )
        ORDER BY distance
      `;
      
      const result = await client.query(query, [routeWKT, maxDistance]);
      
      return result.rows.map(row => ({
        amenity_id: row.amenity_id,
        category: row.category,
        name: row.name,
        opening_hours: row.opening_hours,
        wheelchair: row.wheelchair,
        geometry: JSON.parse(row.geometry),
        distance: Math.round(row.distance * 1000) // Convert to meters
      }));

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in findPOIsAlongRoute:', error);
    throw new Error(`Failed to find POIs along route: ${error.message}`);
  }
};

// Find comfort POIs along a route (playgrounds, fountains, etc.)
const findComfortPOIsAlongRoute = async (routeGeometry, maxDistance = 0.1) => {
  try {
    const client = await pool.connect();
    
    try {
      const routeWKT = `LINESTRING(${routeGeometry.coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`;
      
      const query = `
        SELECT 
          amenity_id,
          category,
          name,
          opening_hours,
          wheelchair,
          ST_AsGeoJSON(geom) as geometry,
          ST_Distance(geom, ST_GeomFromText($1, 4326)) as distance
        FROM comfort.amenities 
        WHERE ST_DWithin(
          geom, 
          ST_GeomFromText($1, 4326), 
          $2
        )
        AND category IN ('playground', 'fountain', 'toilet', 'library', 'community_centre', 'park')
        ORDER BY distance
      `;
      
      const result = await client.query(query, [routeWKT, maxDistance]);
      
      return result.rows.map(row => ({
        amenity_id: row.amenity_id,
        category: row.category,
        name: row.name,
        opening_hours: row.opening_hours,
        wheelchair: row.wheelchair,
        geometry: JSON.parse(row.geometry),
        distance: Math.round(row.distance * 1000) // Convert to meters
      }));

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in findComfortPOIsAlongRoute:', error);
    throw new Error(`Failed to find comfort POIs along route: ${error.message}`);
  }
};

// Find POIs within a bounding box
const findPOIsInBbox = async (minLng, minLat, maxLng, maxLat, categories = []) => {
  try {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          amenity_id,
          category,
          name,
          opening_hours,
          wheelchair,
          ST_AsGeoJSON(geom) as geometry
        FROM comfort.amenities 
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      `;
      
      const params = [minLng, minLat, maxLng, maxLat];
      
      if (categories.length > 0) {
        query += ` AND category = ANY($5)`;
        params.push(categories);
      }
      
      query += ` ORDER BY name`;
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        amenity_id: row.amenity_id,
        category: row.category,
        name: row.name,
        opening_hours: row.opening_hours,
        wheelchair: row.wheelchair,
        geometry: JSON.parse(row.geometry)
      }));

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in findPOIsInBbox:', error);
    throw new Error(`Failed to find POIs in bounding box: ${error.message}`);
  }
};

// Get POI categories
const getPOICategories = async () => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as count
        FROM comfort.amenities 
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `;
      
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count)
      }));

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getPOICategories:', error);
    throw new Error(`Failed to get POI categories: ${error.message}`);
  }
};

// Find nearby POIs for a specific point
const findNearbyPOIs = async (lat, lng, radius = 0.1, categories = []) => {
  try {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          amenity_id,
          category,
          name,
          opening_hours,
          wheelchair,
          ST_AsGeoJSON(geom) as geometry,
          ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance
        FROM comfort.amenities 
        WHERE ST_DWithin(
          geom, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326), 
          $3
        )
      `;
      
      const params = [lng, lat, radius];
      
      if (categories.length > 0) {
        query += ` AND category = ANY($4)`;
        params.push(categories);
      }
      
      query += ` ORDER BY distance`;
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        amenity_id: row.amenity_id,
        category: row.category,
        name: row.name,
        opening_hours: row.opening_hours,
        wheelchair: row.wheelchair,
        geometry: JSON.parse(row.geometry),
        distance: Math.round(row.distance * 1000) // Convert to meters
      }));

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in findNearbyPOIs:', error);
    throw new Error(`Failed to find nearby POIs: ${error.message}`);
  }
};

module.exports = {
  findPOIsAlongRoute,
  findComfortPOIsAlongRoute,
  findPOIsInBbox,
  getPOICategories,
  findNearbyPOIs
};
