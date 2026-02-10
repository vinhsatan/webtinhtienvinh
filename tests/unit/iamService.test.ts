import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the kmsService used by iamService
vi.mock('../../../src/iam/kmsService', () => ({
  signWithKms: vi.fn(async () => Buffer.from([1, 2, 3]))
}));

import { issueExecutionToken, verifyToken } from '../../../src/iam/iamService';

const ENV = { ...process.env };

beforeEach(() => {
  // ensure predictable environment
  delete process.env.IAM_KMS_SIGN_URL;
  delete process.env.AWS_KMS_KEY_ID;
  process.env.IAM_PRIVATE_KEY = 'test-secret';
});

afterEach(() => {
  process.env = { ...ENV };
});

describe('iamService', () => {
  it('issues local JWT when no KMS configured', async () => {
    delete process.env.AWS_KMS_KEY_ID;
    const token = await issueExecutionToken({ subject: 'user:1', scope: ['execute'] });
    const decoded = verifyToken(token as string);
    expect(decoded).toBeDefined();
    expect((decoded as any).sub).toBe('user:1');
  });

  it('returns envelope token when KMS signs', async () => {
    process.env.AWS_KMS_KEY_ID = 'fake-key';
    const token = await issueExecutionToken({ subject: 'svc:1', scope: ['execute'] });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(2);
    const parsed = verifyToken(token as string) as any;
    expect(parsed.envelope).toBe(true);
    expect(parsed.payload.sub).toBe('svc:1');
  });
});
