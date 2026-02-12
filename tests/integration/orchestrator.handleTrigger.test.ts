import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies: pdp, iam, temporal, argo, killSwitch, audit
vi.mock('../../src/pdp/pdpService', () => ({ evaluatePolicy: vi.fn(async () => ({ allowed: true })) }));
vi.mock('../../src/iam/iamService', () => ({ issueExecutionToken: vi.fn(async () => 'local-token') }));
vi.mock('../../src/orchestrator/temporal', () => ({ startWorkflow: vi.fn(async () => ({ workflowId: 'wf-1' })), temporalHealth: vi.fn(async () => ({ ok: true })) }));
vi.mock('../../src/orchestrator/argo', () => ({ submitArgoWorkflow: vi.fn(async () => ({ name: 'argo-1' })), argoHealth: vi.fn(async () => ({ ok: true })) }));
vi.mock('../../src/control/killSwitch', () => ({ isGloballyKilled: vi.fn(async () => false), isTriggerKilled: vi.fn(async () => false) }));
vi.mock('../../src/audit/auditService', () => ({ appendAudit: vi.fn(() => undefined) }));

import { startTriggerById } from '../../src/orchestrator/orchestratorService';
import * as trgDB from '../../src/control/triggerRegistry.db';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('orchestrator handleTrigger integration (mocked external services)', () => {
  it('starts a temporal workflow when trigger is temporal', async () => {
    // stub DB record
    vi.spyOn(trgDB, 'getTriggerById').mockResolvedValueOnce({ id: 't1', source: { orchestrator: 'temporal', workflowName: 'MyWF' } });
    const res = await startTriggerById('t1', { foo: 'bar' });
    expect(res).toBeDefined();
    expect(res.backend).toBe('temporal');
  });

  it('submits argo workflow when orchestrator=argo', async () => {
    vi.spyOn(trgDB, 'getTriggerById').mockResolvedValueOnce({ id: 't2', source: { orchestrator: 'argo', workflowManifest: { spec: {} } } });
    const res = await startTriggerById('t2', { });
    expect(res).toBeDefined();
    expect(res.backend).toBe('argo');
  });
});
