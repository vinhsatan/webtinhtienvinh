import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the pg Pool to avoid real DB connections
vi.mock('pg', () => {
  return {
    Pool: vi.fn().mockImplementation(() => ({
      query: vi.fn().mockResolvedValue({ rows: [] }),
      end: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

import * as trg from '../../src/control/triggerRegistry.db';

describe('triggerRegistry.db', () => {
  it('listTriggers should return array', async () => {
    const rows = await trg.listTriggers();
    expect(Array.isArray(rows)).toBe(true);
  });
});
