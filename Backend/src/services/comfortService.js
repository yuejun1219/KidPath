// Comfort analysis service

const { pool } = require('../config/database');
const turf = require('@turf/turf');

// Get tree canopy coverage for a point
const getTreeCanopyCoverage = async (lat, lng, radius = 0.1) => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          ST_AsGeoJSON(geom) as geometry,
          ST_Area(geom) as area
        FROM tree_canopy 
        WHERE ST_DWithin(
          geom, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326), 
          $3
        )
      `;
      
      const result = await client.query(query, [lng, lat, radius]);
      
      if (result.rows.length === 0) {
        return {
          coverage_percentage: 0,
          total_area: 0,
          tree_count: 0
        };
      }

      // Calculate coverage percentage
      const point = turf.point([lng, lat]);
      const buffer = turf.buffer(point, radius, { units: 'kilometers' });
      const bufferArea = turf.area(buffer);
      
      let totalTreeArea = 0;
      result.rows.forEach(row => {
        const treeGeometry = JSON.parse(row.geometry);
        const treeArea = turf.area(treeGeometry);
        totalTreeArea += treeArea;
      });

      const coveragePercentage = Math.min(100, (totalTreeArea / bufferArea) * 100);

      return {
        coverage_percentage: Math.round(coveragePercentage * 100) / 100,
        total_area: Math.round(totalTreeArea * 100) / 100,
        tree_count: result.rows.length
      };

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in getTreeCanopyCoverage:', error);
    throw new Error(`Failed to get tree canopy coverage: ${error.message}`);
  }
};

// Calculate comfort score based on tree coverage and amenities
const calculateComfortScore = (treeCoverage, amenities) => {
  let score = 0;
  let factors = 0;

  // Tree coverage factor (0-1)
  const treeFactor = treeCoverage.coverage_percentage / 100;
  score += treeFactor * 0.6; // 60% weight for tree coverage
  factors += 0.6;

  // Amenities factor (0-1)
  const amenityFactor = Math.min(1, amenities.length / 5); // Max score at 5 amenities
  score += amenityFactor * 0.4; // 40% weight for amenities
  factors += 0.4;

  return factors > 0 ? score / factors : 0;
};

// Get comfort level description
const getComfortLevel = (score) => {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Moderate';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
};

module.exports = {
  getTreeCanopyCoverage,
  calculateComfortScore,
  getComfortLevel
};
