import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

let kmsClient: KMSClient | null = null;

function getClient() {
  if (kmsClient) return kmsClient;
  kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  return kmsClient;
}

export async function signWithKms(keyId: string, message: Buffer) {
  const client = getClient();
  const cmd = new SignCommand({
    KeyId: keyId,
    Message: message,
    MessageType: 'RAW',
    SigningAlgorithm: process.env.KMS_SIGNING_ALGORITHM || 'RSASSA_PKCS1_V1_5_SHA_256'
  });
  const res = await client.send(cmd);
  if (!res.Signature) throw new Error('kms-sign-failed');
  return Buffer.from(res.Signature);
}

export async function verifyKms() {
  try {
    getClient();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
import crypto from 'crypto';
import https from 'https';

type AwsSignResponse = {
  Signature?: string;
  KeyId?: string;
};

async function httpPostJson(url: string, body: any) {
  const u = new URL(url);
  return new Promise<any>((resolve, reject) => {
    const req = https.request(
      u,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
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

export async function signWithAwsKms(kmsKeyId: string, payload: any): Promise<string> {
  // message digest (raw bytes)
  const message = JSON.stringify(payload);
  const digestBuffer = crypto.createHash('sha256').update(message).digest();

  // Try AWS SDK (v3) if available in runtime
  try {
    const kmsModule = await import('@aws-sdk/client-kms');
    const { KMSClient, SignCommand } = kmsModule;
    const client = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const cmd = new SignCommand({
      KeyId: kmsKeyId,
      Message: digestBuffer,
      MessageType: 'DIGEST',
      SigningAlgorithm: process.env.AWS_KMS_SIGNING_ALGORITHM || 'RSASSA_PKCS1_V1_5_SHA_256',
    } as any);
    const resp: any = await client.send(cmd);
    if (resp?.Signature) {
      return Buffer.from(resp.Signature).toString('base64');
    }
    throw new Error('KMS SDK did not return a signature');
  } catch (sdkErr) {
    // if SDK not available or failed, fallback to proxy (if configured)
    const proxyUrl = process.env.AWS_KMS_PROXY_URL;
    if (!proxyUrl) {
      throw sdkErr;
    }
    const resp: AwsSignResponse = await httpPostJson(proxyUrl, { KeyId: kmsKeyId, Message: digestBuffer.toString('base64') });
    if (!resp?.Signature) throw new Error('KMS proxy did not return a signature');
    return resp.Signature;
  }
}

export default { signWithAwsKms };
import crypto from 'crypto';
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

export async function signWithAwsKms(keyId: string, payload: any) {
  if (!keyId) throw new Error('AWS KMS KeyId required');
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) throw new Error('AWS region required in AWS_REGION or AWS_DEFAULT_REGION');

  const client = new KMSClient({ region });
  const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest();

  const cmd = new SignCommand({
    KeyId: keyId,
    Message: digest,
    MessageType: 'DIGEST',
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
  });

  const resp = await client.send(cmd);
  if (!resp.Signature) throw new Error('KMS signing failed');
  return Buffer.from(resp.Signature).toString('base64');
}
