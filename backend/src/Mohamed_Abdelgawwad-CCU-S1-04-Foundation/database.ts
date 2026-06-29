import dns from 'node:dns';
import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

// Prefer IPv4 addresses when resolving DNS.
// This helps avoid IPv6 routing issues on some cloud providers.
dns.setDefaultResultOrder('ipv4first');

function buildSslConfig() {
  const rejectUnauthorized = env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

  return {
    rejectUnauthorized,
  };
}

const poolConfig: pg.PoolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (env.DATABASE_URL) {
  // Production / cloud (Supabase, Render, Neon, etc.)
  poolConfig.connectionString = env.DATABASE_URL;
  poolConfig.ssl = buildSslConfig();
} else {
  // Local development
  poolConfig.host = env.DATABASE_HOST;
  poolConfig.port = env.DATABASE_PORT;
  poolConfig.user = env.DATABASE_USER;
  poolConfig.password = env.DATABASE_PASSWORD;
  poolConfig.database = env.DATABASE_NAME;
  poolConfig.ssl = env.NODE_ENV === 'production'
    ? buildSslConfig()
    : false;
}

export const db = new pg.Pool(poolConfig);

// Log unexpected pool errors
db.on('error', (err) => {
  logger.error(
    { err },
    'Unexpected PostgreSQL pool error — connection may have been dropped'
  );
});