import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Actively test the connection when the server starts
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ [PostGIS] Database Connection Failed:', err.message);
    console.error('Please check your .env credentials and ensure PostgreSQL is running.');
  } else {
    console.log('✅ [PostGIS] Connected to spatial database pool successfully');
  }
});

pool.on('error', (err) => {
  console.error('[PostGIS] Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);