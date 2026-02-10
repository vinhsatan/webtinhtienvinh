import { describe, it, expect } from 'vitest';
import { evaluateRules } from '../../src/pdp/rulesLoader';

describe('PDP rulesLoader', () => {
  it('should require simulation for high safety triggers', async () => {
    const trigger = { id: 't1', name: 'some.trigger', source: { safety_level: 'high' } };
    const res = await evaluateRules(trigger, {});
    expect(res.requireSimulation).toBe(true);
    expect(res.allowed).toBe(true);
  });
});
