import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PDP, IAM, and orchestration connectors
vi.mock('../../src/pdp/pdpService', () => ({ evaluatePolicy: vi.fn(async () => ({ allowed: true })) }));
vi.mock('../../src/iam/iamService', () => ({ issueExecutionToken: vi.fn(async () => 'mock-token') }));
vi.mock('../../src/orchestrator/temporalConnector', () => ({ startWorkflow: vi.fn(async () => ({ ok: true })) }));
vi.mock('../../src/orchestrator/argoConnector', () => ({ submitWorkflow: vi.fn(async () => ({ ok: true })) }));

import { handleTrigger } from '../../src/orchestrator/orchestratorService';
import * as iam from '../../src/iam/iamService';
import * as temporal from '../../src/orchestrator/temporalConnector';

describe('Orchestrator integration scaffold', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('starts a Temporal workflow when ORCHESTRATOR=temporal', async () => {
    process.env.ORCHESTRATOR = 'temporal';
    const trigger = { id: 't1', spec: { workflowType: 'GenericWorkflow', scope: ['default:execute'] } } as any;
    const payload = { idempotency_key: 'k-1' } as any;

    const res = await handleTrigger(trigger, payload);
    // temporal.startWorkflow was mocked to return an object
    expect((temporal as any).startWorkflow).toHaveBeenCalled();
    // token issuance should have been invoked
    const iamModule = await import('../../src/iam/iamService');
    expect(iamModule.issueExecutionToken).toHaveBeenCalled();
    expect(res).toBeDefined();
  });

  it('submits an Argo workflow when ORCHESTRATOR!=temporal', async () => {
    process.env.ORCHESTRATOR = 'argo';
    const trigger = { id: 't2', spec: { workflowType: 'GenericWorkflow', scope: ['default:execute'] } } as any;
    const payload = { idempotency_key: 'k-2' } as any;

    const res = await handleTrigger(trigger, payload);
    const argo = await import('../../src/orchestrator/argoConnector');
    expect(argo.submitWorkflow).toHaveBeenCalled();
    const iamModule = await import('../../src/iam/iamService');
    expect(iamModule.issueExecutionToken).toHaveBeenCalled();
    expect(res).toBeDefined();
  });
});
