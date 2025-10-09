const { pool } = require('../config/database');  // ✅ 注意加花括号

async function findPlaygroundsByKeyword(keyword, limit = 5) {
  const query = `
    SELECT id, name, features
    FROM public.playgrounds
    WHERE features ILIKE $1
    LIMIT $2
  `;
  const result = await pool.query(query, [`%${keyword}%`, limit]);
  return result.rows;
}

module.exports = { findPlaygroundsByKeyword };
