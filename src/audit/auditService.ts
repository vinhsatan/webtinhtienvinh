import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const AUDIT_FILE = path.join(LOG_DIR, 'audit.log');

if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}
}

export function appendAudit(record: Record<string, any>) {
  const entry = { ts: new Date().toISOString(), ...record };
  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  } catch (err) {
    // best-effort logging
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log', err);
  }
}
