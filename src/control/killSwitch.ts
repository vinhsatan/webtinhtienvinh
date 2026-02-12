import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'killSwitch.json');

export type KillState = {
  global?: boolean;
  triggers?: Record<string, { killed: boolean; reason?: string; by?: string; at?: string }>;
};

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function readState(): Promise<KillState> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw) as KillState;
  } catch (_e) {
    return { global: false, triggers: {} };
  }
}

async function writeState(s: KillState) {
  await ensureDataDir();
  await fs.writeFile(FILE, JSON.stringify(s, null, 2), 'utf8');
}

export async function isGloballyKilled(): Promise<boolean> {
  const s = await readState();
  return !!s.global;
}

export async function isTriggerKilled(triggerId: string): Promise<boolean> {
  const s = await readState();
  return !!(s.triggers && s.triggers[triggerId] && s.triggers[triggerId].killed);
}

export async function setGlobalKill(on: boolean, opts?: { by?: string; reason?: string }) {
  const s = await readState();
  s.global = !!on;
  await writeState(s);
  await appendAuditEntry('global', on, opts);
}

export async function setTriggerKill(triggerId: string, on: boolean, opts?: { by?: string; reason?: string }) {
  const s = await readState();
  s.triggers = s.triggers || {};
  s.triggers[triggerId] = { killed: !!on, reason: opts?.reason, by: opts?.by, at: new Date().toISOString() };
  await writeState(s);
  await appendAuditEntry(triggerId, on, opts);
}

async function appendAuditEntry(target: string, on: boolean, opts?: { by?: string; reason?: string }) {
  try {
    const auditPath = path.join(process.cwd(), 'logs', 'audit.log');
    const entry = { target, on, by: opts?.by || 'system', reason: opts?.reason || '', at: new Date().toISOString() };
    await fs.mkdir(path.dirname(auditPath), { recursive: true });
    await fs.appendFile(auditPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    // best-effort
    // eslint-disable-next-line no-console
    console.warn('killSwitch audit append failed', e);
  }
}

export async function getStatus(): Promise<KillState> {
  return readState();
}

export default { isGloballyKilled, isTriggerKilled, setGlobalKill, setTriggerKill, getStatus };
