// src/config/database.js
const { Pool } = require('pg');
const fs = require('fs');

const ssl =
  process.env.DB_SSL === 'true'
    ? (process.env.DB_CA_PATH
        ? { ca: fs.readFileSync(process.env.DB_CA_PATH, 'utf8') } 
        : { rejectUnauthorized: false }                  
      )
    : undefined;

// Debug: Log environment variables
console.log('🔍 [DEBUG] Database config environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '❌未设置');
console.log('DB_SSL:', process.env.DB_SSL);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'seasonal_comfort_db', // Use environment variable
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Use SSL as required by RDS
  max: Number(process.env.PGPOOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
  connectionTimeoutMillis: Number(process.env.PGPOOL_CONN_TIMEOUT || 2000),
});

console.log('🔍 [DEBUG] Pool created with config:', {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'seasonal_comfort_db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '***已设置***' : '❌未设置',
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[pg] idle client error:', err);
  process.exit(1);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT PostGIS_Version()');
    console.log('PostGIS:', rows[0].postgis_version);
    client.release();
    return true;
  } catch (e) {
    console.error('DB connect fail:', e.message);
    return false;
  }
};

const closePool = async () => { await pool.end(); };

module.exports = { pool, testConnection, closePool };
