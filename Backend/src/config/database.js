// src/config/database.js
const { Pool } = require('pg');
const fs = require('fs');

const ssl =
  process.env.DB_SSL === 'true'
    ? (process.env.DB_CA_PATH
        ? { ca: fs.readFileSync(process.env.DB_CA_PATH, 'utf8') } // 优先用官方 CA
        : { rejectUnauthorized: false }                           // 没 CA 时临时退化（仅开发）
      )
    : undefined;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl,
  max: Number(process.env.PGPOOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
  connectionTimeoutMillis: Number(process.env.PGPOOL_CONN_TIMEOUT || 2000),
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
