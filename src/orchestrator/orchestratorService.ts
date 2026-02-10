import * as trgDB from '../control/triggerRegistry.db';
import * as temporalConnector from './temporal';
import * as argoConnector from './argo';
import { issueExecutionToken } from '../iam/iamService';
import { evaluatePolicy } from '../pdp/pdpService';
import { verifySignedReport } from '../pdp/pdpService';
import killSwitch from '../control/killSwitch';
import { appendAudit } from '../audit/auditService';

export async function getTriggerList() {
  return await trgDB.listTriggers();
}

export async function getTriggerById(id: string) {
  return await trgDB.getTriggerById(id);
}

export async function startTriggerById(triggerId: string, payload: any = {}) {
  const trigger = await trgDB.getTriggerById(triggerId);
  if (!trigger) throw new Error('trigger-not-found');
  return await handleTrigger(trigger, payload);
}

export async function orchestratorHealth() {
  const [t, a] = await Promise.all([temporalConnector.temporalHealth(), argoConnector.argoHealth()]);
  return { temporal: t, argo: a };
}

export async function handleTrigger(triggerRecord: any, payload: any) {
  const idempotencyKey = payload.idempotency_key || triggerRecord.id;

  // instrumentation (best-effort)
  let span: any = null;
  try {
    const otelApi = await import('@opentelemetry/api').catch(() => null);
    if (otelApi && otelApi.trace) {
      const tracer = otelApi.trace.getTracer('orchestrator');
      span = tracer.startSpan(`handleTrigger ${triggerRecord.id}`);
      try {
        span.setAttribute('trigger.id', String(triggerRecord.id));
        span.addEvent('handleTrigger.start');
      } catch (_) {}
    }
  } catch (_) {
    span = null;
  }

  try {
    // kill-switch checks
    if (await killSwitch.isGloballyKilled()) {
      if (span && typeof span.addEvent === 'function') span.addEvent('kill-switch.global');
      throw new Error('kill-switch:global-enabled');
    }
    if (await killSwitch.isTriggerKilled(triggerRecord.id)) {
      if (span && typeof span.addEvent === 'function') span.addEvent('kill-switch.trigger', { trigger: String(triggerRecord.id) });
      throw new Error(`kill-switch:trigger:${triggerRecord.id}`);
    }

    // PDP evaluation
    const pdp = await evaluatePolicy(triggerRecord, payload);
    if (!pdp?.allowed) {
      if (span && typeof span.addEvent === 'function') span.addEvent('pdp.denied', { reason: pdp?.reason ?? 'unknown' });
      throw new Error(`policy-denied:${pdp?.reason ?? 'unknown'}`);
    }

    // If PD P indicates simulation is required, or trigger declares high safety, require a signed simulation report
    const safety = triggerRecord.source?.safety_level || triggerRecord.spec?.safety_level || triggerRecord.safety_level;
    const requireSim = pdp.requireSimulation === true || String(safety).toLowerCase() === 'high';
    if (requireSim) {
      const vr = await verifySignedReport();
      if (!vr.ok) {
        if (span && typeof span.addEvent === 'function') span.addEvent('simulation.missing_or_invalid', { err: vr.error });
        throw new Error('simulation-required:missing-or-invalid');
      }
      // optional: ensure report corresponds to this trigger
      if (vr.report.trigger && vr.report.trigger.name !== triggerRecord.name) {
        if (span && typeof span.addEvent === 'function') span.addEvent('simulation.mismatch', { reportTrigger: vr.report.trigger.name, expected: triggerRecord.name });
        throw new Error('simulation-required:trigger-mismatch');
      }
      if (vr.report.evaluation && vr.report.evaluation.allowed === false) {
        if (span && typeof span.addEvent === 'function') span.addEvent('simulation.evaluation.denied');
        throw new Error('simulation-required:policy-failed');
      }
    }

    // issue token
    const token = await issueExecutionToken({ subject: `workflow:${triggerRecord.id}`, scope: triggerRecord.source?.scope ?? triggerRecord.spec?.scope ?? ['default:execute'], expiresIn: 300 });
    if (span && typeof span.addEvent === 'function') span.addEvent('token.issued');

    // choose orchestrator
    const orchestrator = (triggerRecord.source && triggerRecord.source.orchestrator) || process.env.ORCHESTRATOR || 'temporal';
    if (orchestrator === 'argo') {
      const manifest = triggerRecord.source?.workflowManifest || { metadata: { generateName: `trigger-${triggerRecord.id}-` }, spec: {} };
      const resp = await argoConnector.submitArgoWorkflow(manifest);
      appendAudit({ action: 'trigger.start', triggerId: triggerRecord.id, backend: 'argo', result: resp });
      if (span && typeof span.addEvent === 'function') span.addEvent('workflow.submitted', { engine: 'argo' });
      return { backend: 'argo', result: resp };
    }

    // default: temporal
    const wfName = triggerRecord.source?.workflowName || triggerRecord.spec?.workflowType || 'GenericWorkflow';
    const args = payload.args ? payload.args : [payload];
    const res = await temporalConnector.startWorkflow(wfName, args, { executionToken: token, idempotencyKey });
    appendAudit({ action: 'trigger.start', triggerId: triggerRecord.id, backend: 'temporal', result: res });
    if (span && typeof span.addEvent === 'function') span.addEvent('workflow.started', { engine: 'temporal' });
    return { backend: 'temporal', result: res };
  } finally {
    try { if (span && typeof span.end === 'function') span.end(); } catch (_) {}
  }
}
