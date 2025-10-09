// src/services/poiService.js
// Points of Interest service for route-based searches

const { amenitiesPool } = require('../config/amenitiesDatabase');

// Find POIs along a route
const findPOIsAlongRoute = async (routeGeometry, maxDistance = 0.1) => {
  try {
    const client = await amenitiesPool.connect();
    
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
          $2 / 111000.0
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
    const client = await amenitiesPool.connect();
    
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
          $2 / 111000.0
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

module.exports = {
  findPOIsAlongRoute,
  findComfortPOIsAlongRoute
};
