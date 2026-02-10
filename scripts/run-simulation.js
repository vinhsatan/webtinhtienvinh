import fs from 'node:fs/promises';
import path from 'node:path';
import { evaluatePolicy, writeSignedReport } from '../src/pdp/pdpService.js';

async function main() {
  const triggerFile = process.argv[2] || 'simulation/trigger.json';
  const payloadFile = process.argv[3] || 'simulation/payload.json';

  try {
    const trigRaw = await fs.readFile(triggerFile, 'utf8');
    const payloadRaw = await fs.readFile(payloadFile, 'utf8');
    const trigger = JSON.parse(trigRaw);
    const payload = JSON.parse(payloadRaw);

    const evalRes = await evaluatePolicy(trigger, payload);
    const report = {
      ts: new Date().toISOString(),
      trigger,
      payload,
      evaluation: evalRes,
    };

    const signed = await writeSignedReport(report, 'simulation/report.json');
    console.log('Simulation complete. Report written to simulation/report.json');
    console.log(JSON.stringify(signed, null, 2));
  } catch (e) {
    console.error('Simulation failed:', e.message || e);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

