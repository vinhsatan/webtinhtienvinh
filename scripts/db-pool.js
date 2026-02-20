// Shared Postgres pool helper for standalone Node scripts.
// Reads DATABASE_URL (fallback DB_CONN) and reuses a single Pool instance.
import pkg from 'pg';
const { Pool } = pkg;

let _pool = null;

export function getPool() {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL || process.env.DB_CONN;
    if (!connectionString) {
      console.error('DATABASE_URL (or DB_CONN) environment variable is not set');
      process.exit(2);
    }
    const isProd = process.env.NODE_ENV === 'production';
    _pool = new Pool({
      connectionString,
      ssl: isProd ? { rejectUnauthorized: false } : undefined,
      max: parseInt(process.env.DB_POOL_MAX || '', 10) || 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return _pool;
}

export async function endPool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
