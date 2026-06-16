import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

export const db = new pg.Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// MED-05 Fix: Handle unexpected PostgreSQL pool errors
db.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error — connection may have been dropped');
});
