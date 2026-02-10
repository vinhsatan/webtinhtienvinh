import { describe, it, expect } from 'vitest';

import { temporalHealth } from '../../src/orchestrator/temporal';
import { argoHealth } from '../../src/orchestrator/argo';

describe('orchestrator connectors (unit)', () => {
  it('temporalHealth returns object (may be false in local)', async () => {
    const res = await temporalHealth();
    expect(res).toBeDefined();
    expect(typeof res.ok).toBe('boolean');
  });

  it('argoHealth returns object (may be false in local)', async () => {
    const res = await argoHealth();
    expect(res).toBeDefined();
    expect(typeof res.ok).toBe('boolean');
  });
});
