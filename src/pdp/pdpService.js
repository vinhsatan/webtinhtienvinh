import fs from 'node:fs/promises';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const RULES_PATH = path.join(process.cwd(), 'src', 'pdp', 'rules.json');

export async function loadRules() {
  try {
    const raw = await fs.readFile(RULES_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function evaluatePolicy(trigger, payload) {
  // delegate to rulesLoader
  const { evaluateRules } = await import('./rulesLoader.js');
  const result = await evaluateRules(trigger, payload);
  return result;
}

export function signSimulationReport(report) {
  const secret = process.env.SIMULATION_SIGNING_KEY || 'dev-sim-secret';
  return jwt.sign(report, secret, { algorithm: 'HS256', expiresIn: '1h' });
}

export async function writeSignedReport(report, outPath = 'simulation/report.json') {
  const token = signSimulationReport(report);
  const wrapped = { report, signature: token };
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(wrapped, null, 2), 'utf8');
  return wrapped;
}

export default { loadRules, evaluatePolicy, signSimulationReport, writeSignedReport };
