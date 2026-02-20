#!/usr/bin/env node
// Simple idempotent SQL migration runner.
// Applies .sql files from database/migrations/ in filename order,
// tracking applied migrations in a schema_migrations table.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, endPool } from './db-pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'database', 'migrations');

async function main() {
  const pool = getPool();

  // Ensure tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Read and sort migration files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found in', MIGRATIONS_DIR);
    await endPool();
    return;
  }

  // Fetch already-applied migrations
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map(r => r.filename));

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`  apply ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    ran++;
  }

  if (ran === 0) {
    console.log('All migrations already applied. Nothing to do.');
  } else {
    console.log(`Applied ${ran} migration(s).`);
  }

  await endPool();
}

main().catch(err => {
  console.error('Migration failed:', err.stack || err.message || err);
  process.exit(1);
});
