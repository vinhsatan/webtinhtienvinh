import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execP = promisify(exec);

async function runSimulation() {
  try {
    const { stdout, stderr } = await execP('node ./scripts/run-simulation.js');
    return { ok: true, stdout, stderr };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

async function runDbQueryWithBadHost() {
  try {
    // set placeholder host to trigger DNS failure
    const cmd = `$env:DB_CONN = "postgres://user:pass@host:5432/db"; $env:PG_CONN = $env:DB_CONN; node scripts/query-trigger-registry.js`;
    // run under PowerShell to set env inline on Windows
    const { stdout, stderr } = await execP(`powershell -Command "${cmd}"`, { timeout: 10000 });
    return { ok: true, stdout, stderr };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

async function simulateKmsFailure() {
  try {
    // Simulate KMS signer failure
    throw new Error('Simulated KMS signing failure: KMS unreachable');
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  const out = { ts: new Date().toISOString(), scenarios: {} };

  out.scenarios['pdp_simulation'] = await runSimulation();
  out.scenarios['db_dns_failure'] = await runDbQueryWithBadHost();
  out.scenarios['kms_simulated_failure'] = await simulateKmsFailure();

  const outPath = path.join(process.cwd(), 'simulation', 'error-flow-report.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Error-flow report written to', outPath);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e)=>{ console.error('error-flow failed', e); process.exit(1); });
