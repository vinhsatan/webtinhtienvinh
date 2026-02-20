import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { applyEnterpriseSecurity } from '../auth/enterprise';

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
