import { Pool } from 'pg';

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL || process.env.DB_CONN;
  if (!connectionString) {
    throw new Error('DATABASE_URL (or DB_CONN) environment variable is required');
  }
  const isProd = process.env.NODE_ENV === 'production';
  return new Pool({
    connectionString,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
    max: parseInt(process.env.DB_POOL_MAX || '', 10) || 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getPool(): Pool {
  if (!globalThis.dbPool) {
    globalThis.dbPool = createPool();
  }
  return globalThis.dbPool;
}

export default getPool;
