// src/config/amenitiesDatabase.js
// Dedicated PG pool for amenities (comfort schema) hosted in seasonal_comfort_db

const { Pool } = require('pg');
const fs = require('fs');

// Prefer explicit AMEN_DB_* vars; fallback to generic DB_* vars
const host = process.env.AMEN_DB_HOST || process.env.DB_HOST;
const port = Number(process.env.AMEN_DB_PORT || process.env.DB_PORT || 5432);
const database = process.env.AMEN_DB_NAME || 'seasonal_comfort_db';
const user = process.env.AMEN_DB_USER || process.env.DB_USER;
const password = process.env.AMEN_DB_PASSWORD || process.env.DB_PASSWORD;

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


