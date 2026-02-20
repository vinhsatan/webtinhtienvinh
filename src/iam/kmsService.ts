import crypto from 'crypto';
import https from 'https';

let kmsClient: any = null;

async function getClient() {
  if (kmsClient) return kmsClient;
  const awsSdkModuleName = '@aws-sdk/client-kms';
  const { KMSClient } = await import(awsSdkModuleName as any);
  kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  return kmsClient;
}

export async function signWithKms(keyId: string, message: Buffer) {
  const awsSdkModuleName = '@aws-sdk/client-kms';
  const { SignCommand } = await import(awsSdkModuleName as any);
  const client = await getClient();
  const cmd = new SignCommand({
    KeyId: keyId,
    Message: message,
    MessageType: 'RAW',
    SigningAlgorithm: process.env.KMS_SIGNING_ALGORITHM || 'RSASSA_PKCS1_V1_5_SHA_256',
  } as any);
  const res: any = await client.send(cmd as any);
  if (!res?.Signature) throw new Error('kms-sign-failed');
  return Buffer.from(res.Signature);
}

export async function verifyKms() {
  try {
    await getClient();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

type AwsSignResponse = { Signature?: string; KeyId?: string };

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
  const message = JSON.stringify(payload);
  const digestBuffer = crypto.createHash('sha256').update(message).digest();

  try {
    const client = getClient();
    const cmd = new SignCommand({
      KeyId: kmsKeyId,
      Message: digestBuffer,
      MessageType: 'DIGEST',
      SigningAlgorithm: process.env.AWS_KMS_SIGNING_ALGORITHM || 'RSASSA_PKCS1_V1_5_SHA_256',
    } as any);
    const resp: any = await client.send(cmd as any);
    if (resp?.Signature) return Buffer.from(resp.Signature).toString('base64');
    throw new Error('KMS SDK did not return a signature');
  } catch (sdkErr) {
    const proxyUrl = process.env.AWS_KMS_PROXY_URL;
    if (!proxyUrl) throw sdkErr;
    const resp: AwsSignResponse = await httpPostJson(proxyUrl, { KeyId: kmsKeyId, Message: digestBuffer.toString('base64') });
    if (!resp?.Signature) throw new Error('KMS proxy did not return a signature');
    return resp.Signature as string;
  }
}

export default { signWithKms, signWithAwsKms, verifyKms };
