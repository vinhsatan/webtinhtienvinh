import { test, expect } from 'vitest';
import { initPool } from '../../../src/control/triggerRegistry.db';

test('initPool throws when DB_CONN not provided', () => {
  const orig = process.env.DB_CONN;
  delete process.env.DB_CONN;
  try {
    expect(() => initPool()).toThrow();
  } finally {
    if (orig) process.env.DB_CONN = orig;
  }
});
