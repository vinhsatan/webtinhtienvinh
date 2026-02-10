// Lightweight HTTP handlers for orchestrator operations.
// These are framework-agnostic helpers; adapt to Express/Hono/Router as needed.
import { startTriggerById, getTriggerList, orchestratorHealth } from './orchestratorService';

export async function handleStartTrigger(ctxOrReq, maybeRes) {
  // Supports both (req,res) and single `context` patterns.
  try {
    let triggerId, resFn;
    if (maybeRes) {
      triggerId = ctxOrReq.params.id;
      const result = await startTriggerById(triggerId);
      return maybeRes.status(200).json(result);
    } else {
      // assume context with `params` and `json` method
      triggerId = ctxOrReq.params && ctxOrReq.params.id;
      const result = await startTriggerById(triggerId);
      return ctxOrReq.json(result);
    }
  } catch (e) {
    if (maybeRes) return maybeRes.status(500).json({ error: e.message });
    return ctxOrReq.json({ error: e.message }, 500);
  }
}

export async function handleListTriggers(ctxOrReq, maybeRes) {
  const list = await getTriggerList();
  if (maybeRes) return maybeRes.status(200).json(list);
  return ctxOrReq.json(list);
}

export async function handleHealth(ctxOrReq, maybeRes) {
  const h = await orchestratorHealth();
  if (maybeRes) return maybeRes.status(200).json(h);
  return ctxOrReq.json(h);
}
