const { pool } = require("../config/database");
const {
  getPlaygroundsWithShadeQuery,
  getPlaygroundByIdQuery,
  getNearestPlaygroundsQuery,
  getStatisticsQuery,
  getShadeDistributionQuery,
  BUFFER_RADIUS,
} = require("../queries/spatial");
const { SEASONS, ORDER_BY_SEASON } = require("../utils/constants");

class PlaygroundService {
  // get playgrounds by season with shade coverage
  async getPlaygroundsBySeason(season = SEASONS.SUMMER) {
    try {
      console.log('🔍 [DEBUG] PlaygroundService.getPlaygroundsBySeason called with season:', season);
      console.log('🔍 [DEBUG] Using pool from database.js');
      
      const orderBy = ORDER_BY_SEASON[season] || ORDER_BY_SEASON[SEASONS.SUMMER];
      const finalQuery = `${getPlaygroundsWithShadeQuery} ${orderBy}`;
      
      console.log(`fetch ${season} playground data...`);
      console.log('🔍 [DEBUG] About to execute query with pool...');
      const result = await pool.query(finalQuery, [BUFFER_RADIUS]);
      console.log('🔍 [DEBUG] Query executed successfully, rows returned:', result.rows.length);
      
      return result.rows;
    } catch (error) {
      console.error('🔍 [DEBUG] PlaygroundService.getPlaygroundsBySeason error details:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error severity:', error.severity);
      console.error('Full error object:', error);
      console.error('PlaygroundService.getPlaygroundsBySeason error:', error);
      throw new Error(`get ${season} playground data failed: ${error.message}`);
    }
  }


  // get single playground details by id
  async getPlaygroundById(playgroundId) {
    try {
      const result = await pool.query(getPlaygroundByIdQuery, [
        playgroundId,
        BUFFER_RADIUS,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("PlaygroundService.getPlaygroundById error:", error);
      throw new Error(`get playground's detail failed: ${error.message}`);
    }
  }

  // get nearest playgrounds by coordinates
  async getNearestPlaygrounds(longitude, latitude, limit = 5) {
    try {
      const result = await pool.query(getNearestPlaygroundsQuery, [
        limit,
        longitude,
        latitude,
      ]);
      return result.rows;
    } catch (error) {
      console.error("PlaygroundService.getNearestPlaygrounds error:", error);
      throw new Error(`get nearest playground failed: ${error.message}`);
    }
  }

  // get playground overall statistics
  async getStatistics() {
    try {
      const result = await pool.query(getStatisticsQuery);
      return result.rows[0];
    } catch (error) {
      console.error("PlaygroundService.getStatistics error:", error);
      throw new Error(`failed to get overall statistics: ${error.message}`);
    }
  }

  // get tree shade distribution statistics
  async getShadeDistribution() {
    try {
      const result = await pool.query(getShadeDistributionQuery, [
        BUFFER_RADIUS,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("PlaygroundService.getShadeDistribution error:", error);
      throw new Error(
        `get tree shade distribution statistics failed: ${error.message}`
      );
    }
  }
}

module.exports = new PlaygroundService();
