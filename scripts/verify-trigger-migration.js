#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'triggerRegistry.json');

function canonicalize(obj) {
  if (obj === null || obj === undefined) return '';
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No file-backed registry found at', DATA_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  let records;
  try { records = JSON.parse(raw); } catch (e) { console.error('Invalid JSON', e); process.exit(1); }

  const srcChecks = records.map(r => ({ id: r.id || null, hash: sha256(canonicalize({ name: r.name, source: r.source, enabled: r.enabled })) }));

  const conn = process.env.DB_CONN || process.env.DATABASE_URL;
  if (!conn) { console.error('DB_CONN or DATABASE_URL required to run verification'); process.exit(1); }

  const pool = new Pool({ connectionString: conn });
  try {
    const res = await pool.query('SELECT id, name, source, enabled FROM trigger_registry WHERE deleted_at IS NULL');
    const tgt = res.rows.map(r => ({ id: r.id, hash: sha256(canonicalize({ name: r.name, source: r.source, enabled: r.enabled })) }));

    const tgtMap = new Map(tgt.map(t => [t.id, t.hash]));
    const mismatches = [];
    for (const s of srcChecks) {
      const tHash = tgtMap.get(s.id);
      if (!tHash) {
        mismatches.push({ id: s.id, issue: 'missing-in-target' });
      } else if (tHash !== s.hash) {
        mismatches.push({ id: s.id, issue: 'hash-mismatch', src: s.hash, tgt: tHash });
      }
    }

    const summary = { sourceCount: srcChecks.length, targetCount: tgt.length, mismatches };
    console.log('Verification result:', JSON.stringify(summary, null, 2));
    if (mismatches.length > 0) process.exit(2);
  } finally {
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
