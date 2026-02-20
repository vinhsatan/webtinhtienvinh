// Minimal IAM token issuance stub (Node/TypeScript)
// Prereqs: npm install jsonwebtoken
// NOTE: This is a template — integrate with your KMS/Secrets and real identity provider.

import jwt from 'jsonwebtoken';
import { signWithKms } from './kmsService';

function getPrivateKey() {
  return process.env.IAM_PRIVATE_KEY || 'dev-key-change-me';
}
function getKmsSignUrl() {
  return process.env.IAM_KMS_SIGN_URL;
}
function getAwsKmsKeyId() {
  return process.env.AWS_KMS_KEY_ID;
}

export type TokenRequest = {
  subject: string;
  scope: string[];
  expiresIn?: number; // seconds
  metadata?: Record<string, any>;
};

async function postJson(url: string, body: any) {
  const u = new URL(url);
  const lib = u.protocol === 'https:' ? await import('https') : await import('http');
  return new Promise<any>((resolve, reject) => {
    const req = (lib as any).request(
      u,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res: any) => {
        let data = '';
        res.on('data', (c: any) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

export async function issueExecutionToken(req: TokenRequest) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: req.subject,
    scope: req.scope,
    iat: now,
    exp: now + (req.expiresIn ?? 300),
    meta: req.metadata ?? {},
  };

  // Prefer external signer endpoint if configured
  const KMS_SIGN_URL = getKmsSignUrl();
  if (KMS_SIGN_URL) {
    try {
      const resp = await postJson(KMS_SIGN_URL, { payload });
      if (resp?.token) return resp.token;
    } catch (err) {
      console.warn('KMS signing via URL failed, falling back to other methods', err);
    }
  }

  // If AWS KMS key is configured, use it to sign the payload and return an envelope token
  const AWS_KMS_KEY_ID = getAwsKmsKeyId();
  if (AWS_KMS_KEY_ID) {
    try {
      const message = Buffer.from(JSON.stringify(payload));
      const signatureBuf = await signWithKms(AWS_KMS_KEY_ID, message);
      const signature = signatureBuf.toString('base64');
      const token = `${Buffer.from(JSON.stringify(payload)).toString('base64')}.${signature}`;
      return token;
    } catch (err) {
      console.warn('AWS KMS signing failed, falling back to local sign', err);
    }
  }

  // Fallback to local JWT signing (dev only)
  return jwt.sign(payload, getPrivateKey(), { algorithm: 'HS256' });
}

export function verifyToken(token: string) {
  // Try local JWT verification first
  try {
    return jwt.verify(token, getPrivateKey()) as any;
  } catch (_err) {
    // If token is envelope from KMS (base64.payload.signature), we cannot verify locally without public key; return raw envelope
    if (token && token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 2) {
        try {
          const payload = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
          return { envelope: true, payload, signature: parts[1] } as any;
        } catch (_e) {}
      }
    }
  }
  return null;
}

// Example usage:
// const token = await issueExecutionToken({ subject: 'workflow:execute', scope: ['wallet:update'] });
// pass `token` to orchestrator/executor calls.
