const { Pool } = require('pg');
const logger = require('../utils/logger');

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  min: parseInt(process.env.PG_POOL_MIN) || 2,
  max: parseInt(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  logger.info('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  logger.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction
};