#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DRY = process.argv.includes('--dry-run');
const DATA_FILE = path.resolve(__dirname, '..', 'data', 'triggerRegistry.json');

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No file-backed registry found at', DATA_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  let records;
  try { records = JSON.parse(raw); } catch (e) { console.error('Invalid JSON', e); process.exit(1); }

  console.log(`Loaded ${records.length} records from file-backed registry`);

  if (DRY) {
    console.log('Dry-run mode: sample record:');
    console.log(records[0]);
    console.log('Preview OK. To perform the migration, unset --dry-run and set DB_CONN env var.');
    process.exit(0);
  }

  const conn = process.env.DB_CONN || process.env.DATABASE_URL;
  if (!conn) { console.error('DB_CONN or DATABASE_URL required to run migration'); process.exit(1); }

  const pool = new Pool({ connectionString: conn });
  try {
    for (const r of records) {
      const { id, name, description, source, enabled } = r;
      const q = `INSERT INTO trigger_registry(id, name, description, source, enabled, created_at, updated_at) VALUES($1,$2,$3,$4::jsonb,$5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, source = EXCLUDED.source, enabled = EXCLUDED.enabled, updated_at = now()`;
      await pool.query(q, [id || null, name, description || null, JSON.stringify(source || {}), enabled === undefined ? true : enabled, r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString()]);
    }
    console.log('Migration complete: inserted/updated', records.length, 'rows');
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
