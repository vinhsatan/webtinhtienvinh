import { Connection, WorkflowClient } from '@temporalio/client';

let client: WorkflowClient | null = null;

export async function initTemporal(connUrl?: string) {
  if (client) return client;
  const connection = await Connection.connect({ address: connUrl || process.env.TEMPORAL_ADDRESS || 'localhost:7233' });
  client = new WorkflowClient({ connection });
  return client;
}

export async function startWorkflow(workflowName: string, args: any[] = [], options: any = {}) {
  const c = await initTemporal();
  const handle = await c.start(workflowName, { args, taskQueue: options.taskQueue || 'default' });
  return { workflowId: handle.workflowId, runId: handle.runId };
}

export async function getWorkflowStatus(workflowId: string) {
  const c = await initTemporal();
  try {
    const handle = c.getHandle(workflowId);
    const state = await handle.describe();
    return state;
  } catch (e) {
    return { error: e.message };
  }
}

export async function stopWorkflow(workflowId: string, reason?: string) {
  const c = await initTemporal();
  const handle = c.getHandle(workflowId);
  await handle.cancel(new Error(reason || 'cancelled'));
  return { cancelled: true };
}

export async function temporalHealth() {
  try {
    await initTemporal();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
