// src/config/amenitiesDatabase.js
// Dedicated PG pool for amenities (comfort schema) hosted in seasonal_comfort_db

const { Pool } = require('pg');
const fs = require('fs');

// Debug: Log environment variables
console.log('🔍 [DEBUG] Amenities database config environment variables:');
console.log('AMEN_DB_HOST:', process.env.AMEN_DB_HOST);
console.log('AMEN_DB_PORT:', process.env.AMEN_DB_PORT);
console.log('AMEN_DB_NAME:', process.env.AMEN_DB_NAME);
console.log('AMEN_DB_USER:', process.env.AMEN_DB_USER);
console.log('AMEN_DB_PASSWORD:', process.env.AMEN_DB_PASSWORD ? '***已设置***' : '❌未设置');
console.log('AMEN_DB_SSL:', process.env.AMEN_DB_SSL);
console.log('DB_HOST (fallback):', process.env.DB_HOST);
console.log('DB_PASSWORD (fallback):', process.env.DB_PASSWORD ? '***已设置***' : '❌未设置');

// Prefer explicit AMEN_DB_* vars; fallback to generic DB_* vars
const host = process.env.AMEN_DB_HOST || process.env.DB_HOST;
const port = Number(process.env.AMEN_DB_PORT || process.env.DB_PORT || 5432);
const database = process.env.AMEN_DB_NAME || 'seasonal_comfort_db';
const user = process.env.AMEN_DB_USER || process.env.DB_USER;
const password = process.env.AMEN_DB_PASSWORD || process.env.DB_PASSWORD;

console.log('🔍 [DEBUG] Final amenities config values:');
console.log('host:', host);
console.log('port:', port);
console.log('database:', database);
console.log('user:', user);
console.log('password:', password ? '***已设置***' : '❌未设置');

// SSL config (RDS)
const sslEnabled = (process.env.AMEN_DB_SSL ?? process.env.DB_SSL) === 'true';
let ssl;
if (sslEnabled) {
  const caPath = process.env.DB_CA_PATH; // reuse same CA var
  ssl = caPath ? { ca: fs.readFileSync(caPath, 'utf8') } : { rejectUnauthorized: false };
}

const amenitiesPool = new Pool({
  host,
  port,
  database,
  user,
  password,
  ssl,
  max: Number(process.env.PGPOOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
  connectionTimeoutMillis: Number(process.env.PGPOOL_CONN_TIMEOUT || 2000),
});

amenitiesPool.on('error', (err) => {
  console.error('[pg amenities] idle client error:', err);
  process.exit(1);
});

const testAmenitiesConnection = async () => {
  try {
    const client = await amenitiesPool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('[pg amenities] connection failed:', e.message);
    return false;
  }
};

const closeAmenitiesPool = async () => {
  try {
    await amenitiesPool.end();
  } catch (e) {
    console.error('[pg amenities] close failed:', e.message);
  }
};

module.exports = { amenitiesPool, testAmenitiesConnection, closeAmenitiesPool };


