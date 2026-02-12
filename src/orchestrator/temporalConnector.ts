/*
Temporal Connector (Node/TypeScript)
Prereqs: `npm install @temporalio/client`
Environment: TEMPORAL_ADDRESS

This is a minimal example showing how to start, signal, query, and terminate workflows.
Workflows must be implemented and registered on workers separately.
*/

import { Connection, WorkflowClient } from '@temporalio/client';
import { appendAudit } from '../audit/auditService';

const connection = new Connection({ address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233' });
const client = new WorkflowClient(connection.service);

type StartOptions = {
  executionToken?: string;
  metadata?: Record<string, any>;
};

export async function startWorkflow(workflowType: string, workflowId: string, args: any[] = [], options?: StartOptions) {
  // attach execution token to args for workflow to verify/propagate
  const argsWithToken = args.slice();
  if (options?.executionToken) argsWithToken.push({ executionToken: options.executionToken });
  const wf = await client.start(workflowType, {
    taskQueue: 'default',
    workflowId,
    args: argsWithToken,
  });
  appendAudit({ action: 'temporal.start', workflowType, workflowId, metadata: options?.metadata ?? null });
  return wf;
}

export async function signalWorkflow(workflowId: string, signalName: string, signalArgs: any[] = [], options?: { executionToken?: string }) {
  const handle = client.getHandle(workflowId);
  if (options?.executionToken) signalArgs.push({ executionToken: options.executionToken });
  const resp = await handle.signal(signalName, ...signalArgs);
  appendAudit({ action: 'temporal.signal', workflowId, signalName });
  return resp;
}

export async function queryWorkflow(workflowId: string, queryType: string, ...args: any[]) {
  const handle = client.getHandle(workflowId);
  return handle.query(queryType, ...args);
}

export async function terminateWorkflow(workflowId: string, reason = 'terminated-by-orchestrator') {
  const handle = client.getHandle(workflowId);
  const resp = await handle.terminate(reason);
  appendAudit({ action: 'temporal.terminate', workflowId, reason });
  return resp;
}

export async function getStatus(workflowId: string) {
  const handle = client.getHandle(workflowId);
  try {
    const result = await handle.result();
    return { status: 'completed', result };
  } catch (err: any) {
    const desc = await client.service.getWorkflowExecutionHistory({
      namespace: 'default',
      execution: { workflowId }
    }).catch(() => null);
    return { status: 'running', desc };
  }
}
