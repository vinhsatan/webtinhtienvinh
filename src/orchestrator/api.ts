import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { applyEnterpriseSecurity } from '../auth/enterprise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import * as orchestratorService from './orchestratorService';
const TRIGGER_BACKEND = process.env.TRIGGER_REGISTRY_BACKEND || 'file';
let triggerRegistry: any;
if (TRIGGER_BACKEND === 'db') {
  // prefer DB-backed registry
  // require at runtime to avoid pg dependency in file-backed mode
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  triggerRegistry = require('../control/triggerRegistry.db').default;
} else {
  // file-backed default
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  triggerRegistry = require('../control/triggerRegistry').default;
}
import { appendAudit } from '../audit/auditService';
import killSwitch from '../control/killSwitch';
import { requireKillSwitchAuth } from '../auth/rbac';
import metrics from '../opentelemetry/promMetrics';
import { initTelemetry } from '../opentelemetry/init';

const app = express();
app.use(bodyParser.json());

// Apply enterprise security if enabled via environment
try { applyEnterpriseSecurity(app); } catch (e) { /* best-effort */ }

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// metrics endpoint (optional)
if (process.env.ENABLE_METRICS === 'true') {
  app.get('/metrics', metrics.metricsHandler);
}

(async () => {
  // Initialize optional OpenTelemetry (best-effort)
  try {
    const otel = await initTelemetry();
    // graceful shutdown handler
    process.on('SIGTERM', async () => { await otel.shutdown(); process.exit(0); });
    process.on('SIGINT', async () => { await otel.shutdown(); process.exit(0); });
  } catch (e) {
    // ignore initialization errors
  }
})();

app.get('/triggers', async (_req, res) => {
  try {
    const list = await triggerRegistry.listTriggers();
    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/triggers', async (req, res) => {
  const payload = req.body;
  try {
    // Basic creation; validation should be performed by caller or a shared validator.
    const record = await triggerRegistry.createTrigger(payload);
    appendAudit({ action: 'trigger.create', triggerId: record.id, owner: record.owner });
    res.status(201).json(record);
  } catch (e: any) {
    res.status(400).json({ ok: false, error: String(e) });
  }
});

app.post('/triggers/:id/start', async (req, res) => {
  const id = req.params.id;
  const trigger = await triggerRegistry.getTriggerById(id);
  if (!trigger) return res.status(404).json({ error: 'trigger not found' });

  // payload forwarded to orchestrator
  const payload = req.body || {};
  payload.idempotency_key = payload.idempotency_key ?? `trigger-${id}-${Date.now()}`;

  try {
    const result = await orchestratorService.startTriggerById(id, {});
    appendAudit({ action: 'trigger.start', triggerId: id, result: typeof result === 'object' ? JSON.stringify(result) : String(result) });
    res.json({ ok: true, result });
  } catch (err: any) {
    appendAudit({ action: 'trigger.start.failed', triggerId: id, error: String(err) });
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Kill-switch endpoints
app.get('/kill-switch', requireKillSwitchAuth, async (_req, res) => {
  const status = await killSwitch.getStatus();
  res.json({ ok: true, status });
});

app.post('/kill-switch/global', requireKillSwitchAuth, async (req, res) => {
  const { on, by, reason } = req.body;
  try {
    await killSwitch.setGlobalKill(!!on, { by, reason });
    appendAudit({ action: 'kill-switch.global', on: !!on, by, reason });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/kill-switch/triggers/:id', requireKillSwitchAuth, async (req, res) => {
  const triggerId = req.params.id;
  const { on, by, reason } = req.body;
  try {
    await killSwitch.setTriggerKill(triggerId, !!on, { by, reason });
    appendAudit({ action: 'kill-switch.trigger', triggerId, on: !!on, by, reason });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ─── Auth helpers ────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';
const BCRYPT_ROUNDS = 10;

// In-memory user store — used when no DB_CONN is configured
const inMemoryUsers: Array<{ id: string; email: string; name: string; passwordHash: string }> = [];

function getPool() {
  const connStr = process.env.DB_CONN || '';
  if (!connStr) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require('pg');
    return new Pool({ connectionString: connStr });
  } catch (_) {
    return null;
  }
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email và mật khẩu là bắt buộc' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' });
  }

  try {
    const pool = getPool();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (pool) {
      // DB-backed registration
      const exists = await pool.query('SELECT id FROM auth_users WHERE email = $1', [email]);
      if (exists.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'Email đã được sử dụng' });
      }
      const result = await pool.query(
        `INSERT INTO auth_users (id, email, name, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW()) RETURNING id, email, name`,
        [email, name || '']
      );
      const user = result.rows[0];
      // Store hashed password in auth_accounts
      await pool.query(
        `INSERT INTO auth_accounts (id, "userId", type, provider, "providerAccountId", password)
         VALUES (gen_random_uuid()::text, $1, 'credentials', 'credentials', $1, $2)`,
        [user.id, passwordHash]
      );
      const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
    }

    // In-memory fallback
    if (inMemoryUsers.find((u) => u.email === email)) {
      return res.status(409).json({ success: false, error: 'Email đã được sử dụng' });
    }
    const id = crypto.randomUUID();
    inMemoryUsers.push({ id, email, name: name || '', passwordHash });
    const token = jwt.sign({ sub: id, email, name: name || '' }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, token, user: { id, email, name: name || '' } });
  } catch (e: any) {
    console.error('[Auth] Register error:', e);
    return res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo tài khoản' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email và mật khẩu là bắt buộc' });
  }

  try {
    const pool = getPool();

    if (pool) {
      const userResult = await pool.query('SELECT id, email, name FROM auth_users WHERE email = $1', [email]);
      if (userResult.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
      }
      const user = userResult.rows[0];
      const accountResult = await pool.query(
        `SELECT password FROM auth_accounts WHERE "userId" = $1 AND provider = 'credentials'`,
        [user.id]
      );
      if (accountResult.rows.length === 0 || !accountResult.rows[0].password) {
        return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
      }
      const valid = await bcrypt.compare(password, accountResult.rows[0].password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
      }
      const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
    }

    // In-memory fallback
    const user = inMemoryUsers.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
    }
    const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e: any) {
    console.error('[Auth] Login error:', e);
    return res.status(500).json({ success: false, error: 'Lỗi máy chủ khi đăng nhập' });
  }
});

// POST /api/auth/verify-password
app.post('/api/auth/verify-password', async (req, res) => {
  const authHeader = String(req.headers.authorization || '');
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
  }
  let decoded: any;
  try {
    decoded = jwt.verify(parts[1], JWT_SECRET) as any;
  } catch (_) {
    return res.status(401).json({ success: false, error: 'Token không hợp lệ' });
  }

  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ success: false, error: 'Mật khẩu là bắt buộc' });
  }

  try {
    const pool = getPool();
    if (pool) {
      const accountResult = await pool.query(
        `SELECT password FROM auth_accounts WHERE "userId" = $1 AND provider = 'credentials'`,
        [decoded.sub]
      );
      if (accountResult.rows.length === 0 || !accountResult.rows[0].password) {
        return res.status(401).json({ success: false, error: 'Mật khẩu không đúng' });
      }
      const valid = await bcrypt.compare(password, accountResult.rows[0].password);
      if (!valid) return res.status(401).json({ success: false, error: 'Mật khẩu không đúng' });
      return res.json({ success: true });
    }

    // In-memory fallback
    const user = inMemoryUsers.find((u) => u.id === decoded.sub || u.email === decoded.email);
    if (!user) return res.status(401).json({ success: false, error: 'Mật khẩu không đúng' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Mật khẩu không đúng' });
    return res.json({ success: true });
  } catch (e: any) {
    console.error('[Auth] Verify password error:', e);
    return res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// Telegram notification proxy — keeps bot token server-side only
app.post('/api/telegram/notify', async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return res.status(503).json({ ok: false, error: 'Telegram not configured' });
  }
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ ok: false, error: 'message is required' });
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const data = await response.json() as { ok: boolean };
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default app;
// api.ts is library-only: runtime must be provided by a single entrypoint (src/server/index.ts)

// Serve built client (if present) and fallback to index.html for SPA routes.
try {
  const clientRoot = path.join(process.cwd(), 'build', 'client');
  app.use(express.static(clientRoot));

  app.get('*', (req, res, next) => {
    // Let existing API routes respond first
    if (req.path.startsWith('/api') || req.path.startsWith('/triggers') || req.path.startsWith('/kill-switch') || req.path.startsWith('/metrics') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientRoot, 'index.html'), (err) => {
      if (err) next();
    });
  });
} catch (e) {
  // Best-effort: if build/client is not present or sendFile fails, do nothing.
}
