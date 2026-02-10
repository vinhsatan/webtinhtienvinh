import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { evaluateRules, loadRules as loadRulesFromLoader } from './rulesLoader';

export async function loadRules() {
  return await loadRulesFromLoader();
}

export async function evaluatePolicy(trigger: any, payload: any) {
  const result = await evaluateRules(trigger, payload);
  return result;
}

export function signSimulationReport(report: object) {
  const secret = process.env.SIMULATION_SIGNING_KEY || 'dev-sim-secret';
  return jwt.sign(report, secret, { algorithm: 'HS256', expiresIn: '1h' });
}

export async function writeSignedReport(report: object, outPath = 'simulation/report.json') {
  const token = signSimulationReport(report);
  const wrapped = { report, signature: token };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(wrapped, null, 2), 'utf8');
  return wrapped;
}

export async function verifySignedReport(reportPath = 'simulation/report.json') {
  try {
    const raw = await fs.readFile(reportPath, 'utf8');
    const parsed = JSON.parse(raw);
    const token = parsed.signature;
    const secret = process.env.SIMULATION_SIGNING_KEY || 'dev-sim-secret';
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!parsed.report) throw new Error('missing-report-payload');
    return { ok: true, decoded, report: parsed.report };
  } catch (e) {
    return { ok: false, error: e && (e.message || String(e)) };
  }
}

export default { loadRules, evaluatePolicy, signSimulationReport, writeSignedReport, verifySignedReport };
