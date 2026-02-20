import { getPool } from '../db/pool.js';
import type { Pool } from 'pg';

/** @deprecated Pass no arguments; the shared pool from `src/db/pool.ts` is used automatically. */
export function initPool(_connString?: string): Pool {
  return getPool();
}

/** No-op: pool lifecycle is managed by the shared singleton in `src/db/pool.ts`. */
export async function closePool() {
  // Pool lifecycle is managed by the shared singleton; no-op here.
}

export async function listTriggers() {
  const p = getPool();
  const res = await p.query(
    'SELECT id, name, description, source, enabled, created_at, updated_at FROM trigger_registry WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );
  return res.rows;
}

export async function getTriggerById(id: string) {
  const p = getPool();
  const res = await p.query('SELECT * FROM trigger_registry WHERE id = $1 AND deleted_at IS NULL', [id]);
  return res.rows[0] || null;
}

export async function createTrigger({ id, name, description, source, enabled = true }: any) {
  const p = getPool();
  const res = await p.query(
    `INSERT INTO trigger_registry(id, name, description, source, enabled) VALUES($1, $2, $3, $4::jsonb, $5) RETURNING *`,
    [id || null, name, description || null, JSON.stringify(source || {}), enabled]
  );
  return res.rows[0];
}

export async function updateTrigger(id: string, patch: any) {
  const p = getPool();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const k of Object.keys(patch)) {
    if (k === 'source') {
      fields.push(`source = $${idx}::jsonb`);
      values.push(JSON.stringify(patch[k]));
    } else {
      fields.push(`${k} = $${idx}`);
      values.push(patch[k]);
    }
    idx++;
  }
  values.push(id);
  const q = `UPDATE trigger_registry SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`;
  const res = await p.query(q, values);
  return res.rows[0] || null;
}

export async function softDeleteTrigger(id: string) {
  const p = getPool();
  const res = await p.query('UPDATE trigger_registry SET deleted_at = now() WHERE id = $1 RETURNING *', [id]);
  return res.rows[0] || null;
}

export default { initPool, closePool, listTriggers, getTriggerById, createTrigger, updateTrigger, softDeleteTrigger };
