import fetch from 'node-fetch';

const ARGO_SERVER = process.env.ARGO_SERVER || 'http://localhost:2746';

export async function submitArgoWorkflow(manifest: any) {
  const url = `${ARGO_SERVER}/api/v1/workflows/default`;
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(manifest), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Argo submit failed: ${res.statusText}`);
  return res.json();
}

export async function getArgoWorkflow(name: string) {
  const url = `${ARGO_SERVER}/api/v1/workflows/default/${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Argo lookup failed: ${res.statusText}`);
  return res.json();
}

export async function argoHealth() {
  try {
    const res = await fetch(`${ARGO_SERVER}/api/v1/info`);
    return { ok: res.ok };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
