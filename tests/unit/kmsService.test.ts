import { describe, it, expect, vi } from 'vitest';

// Mock the AWS SDK KMS client so tests run offline
vi.mock('@aws-sdk/client-kms', () => {
  class KMSClient {
    send(_cmd: any) {
      return Promise.resolve({ Signature: Uint8Array.from([1, 2, 3, 4]) });
    }
  }
  const SignCommand = function () {} as any;
  return { KMSClient, SignCommand };
});

import { signWithKms } from '../../../src/iam/kmsService';

describe('kmsService', () => {
  it('signWithKms returns a Buffer signature', async () => {
    const sig = await signWithKms('test-key-id', Buffer.from('hello'));
    expect(sig).toBeInstanceOf(Buffer);
    expect(sig.length).toBeGreaterThan(0);
  });
});
