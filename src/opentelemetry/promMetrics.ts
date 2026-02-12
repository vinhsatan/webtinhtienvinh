import client from 'prom-client';

// Collect default metrics
client.collectDefaultMetrics({ timeout: 5000 });

const register = client.register;

export async function metricsHandler(_req: any, res: any) {
  try {
    res.setHeader('Content-Type', register.contentType || 'text/plain; version=0.0.4');
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err));
  }
}

export function getRegister() {
  return register;
}

export default { metricsHandler, getRegister };
