import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'triggerRegistry.json');

type TriggerRecord = {
  id: string;
  name: string;
  owner: string;
  type: 'cron' | 'event' | 'webhook' | 'manual';
  spec: Record<string, any>;
  idempotency_required: boolean;
  max_retries?: number;
  backoff_strategy?: string;
  rate_limit?: { qps?: number; burst?: number };
  data_scope?: string;
  safety_level?: 'low' | 'medium' | 'high';
  simulation_required?: boolean;
  created_at: string;
  disabled?: boolean;
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]), 'utf8');
}

function readAll(): TriggerRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(raw) as TriggerRecord[];
  } catch (err) {
    return [];
  }
}

function writeAll(list: TriggerRecord[]) {
  ensureDataFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
}

export function listTriggers(): TriggerRecord[] {
  return readAll();
}

export function getTrigger(id: string): TriggerRecord | null {
  const all = readAll();
  return all.find((t) => t.id === id) ?? null;
}

export function createTrigger(payload: Partial<TriggerRecord>): TriggerRecord {
  const all = readAll();
  const now = new Date().toISOString();
  const record: TriggerRecord = {
    id: payload.id ?? uuidv4(),
    name: payload.name ?? `trigger-${Date.now()}`,
    owner: payload.owner ?? 'unknown',
    type: (payload.type as any) ?? 'manual',
    spec: payload.spec ?? {},
    idempotency_required: payload.idempotency_required ?? true,
    max_retries: payload.max_retries ?? 5,
    backoff_strategy: payload.backoff_strategy ?? 'exponential',
    rate_limit: payload.rate_limit ?? { qps: 10, burst: 50 },
    data_scope: payload.data_scope ?? 'general',
    safety_level: payload.safety_level ?? 'low',
    simulation_required: payload.simulation_required ?? false,
    created_at: now,
    disabled: payload.disabled ?? false,
  };
  all.push(record);
  writeAll(all);
  return record;
}

export function updateTrigger(id: string, patch: Partial<TriggerRecord>): TriggerRecord | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const existing = all[idx];
  const updated = { ...existing, ...patch };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteTrigger(id: string): boolean {
  const all = readAll();
  const newList = all.filter((t) => t.id !== id);
  if (newList.length === all.length) return false;
  writeAll(newList);
  return true;
}

export function validateTrigger(payload: Partial<TriggerRecord>): { ok: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (!payload.name) errors.push('name required');
  if (!payload.owner) errors.push('owner required');
  if (!payload.type) errors.push('type required');
  if (!['cron', 'event', 'webhook', 'manual'].includes(String(payload.type))) errors.push('type invalid');
  if (payload.safety_level && !['low', 'medium', 'high'].includes(String(payload.safety_level))) errors.push('safety_level invalid');
  return { ok: errors.length === 0, errors: errors.length ? errors : undefined };
}

export default {
  listTriggers,
  getTrigger,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  validateTrigger,
};
