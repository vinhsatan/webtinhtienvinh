import fs from 'node:fs/promises';
import path from 'node:path';

const RULES_PATH = path.join(process.cwd(), 'src', 'pdp', 'rules.json');

function matchValue(pattern: any, value: any) {
  if (pattern == null) return true;
  if (typeof pattern === 'string') {
    if (pattern.startsWith('re:')) {
      const re = new RegExp(pattern.slice(3));
      return re.test(String(value || ''));
    }
    if (pattern === '*') return true;
    return String(value) === pattern;
  }
  if (pattern instanceof RegExp) return pattern.test(String(value || ''));
  return pattern === value;
}

export async function loadRules() {
  try {
    const raw = await fs.readFile(RULES_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function matchesWhen(when: any, trigger: any, payload: any) {
  if (!when) return false;
  // support matching on name, source.type, safety_level, owner
  if (when.name && !matchValue(when.name, trigger.name)) return false;
  if (when['source.type'] && !matchValue(when['source.type'], trigger.source?.type || trigger.spec?.source?.type)) return false;
  if (when.safety_level && !matchValue(when.safety_level, trigger.source?.safety_level || trigger.safety_level || trigger.spec?.safety_level)) return false;
  if (when.owner && !matchValue(when.owner, trigger.source?.owner || trigger.owner)) return false;
  return true;
}

export async function evaluateRules(trigger: any, payload: any) {
  const rules = await loadRules();
  // Evaluate in order; first matching rule decides
  for (const r of rules) {
    if (matchesWhen(r.when, trigger, payload)) {
      const out: any = { allowed: r.effect !== 'deny', reason: r.description || r.id || 'rule-match' };
      if (r.require_simulation) out.requireSimulation = true;
      return out;
    }
  }
  return { allowed: true };
}

export default { loadRules, matchesWhen, evaluateRules };
import fs from 'fs';
import path from 'path';

const RULES_PATH = path.resolve(process.cwd(), 'src', 'pdp', 'rules.json');

export function loadRules() {
  try {
    const raw = fs.readFileSync(RULES_PATH, 'utf8');
    const rules = JSON.parse(raw);
    return rules;
  } catch (err) {
    return [];
  }
}

function matchWhen(when: Record<string, any>, trigger: any) {
  // simple dot-path matcher for trigger properties
  for (const key of Object.keys(when)) {
    const parts = key.split('.');
    let v: any = { trigger };
    for (const p of parts) {
      if (v == null) return false;
      v = v[p];
    }
    if (v !== when[key]) return false;
  }
  return true;
}

export function evaluateRules(trigger: any, payload: any) {
  const rules = loadRules();
  for (const r of rules) {
    const when = r.when || {};
    if (Object.keys(when).length && !matchWhen(when, trigger)) continue;

    if (r.effect === 'allow') return { allowed: true, rule: r.id };

    if (r.effect === 'deny-if-missing') {
      const required = r.require || [];
      for (const req of required) {
        // support simple dot access like payload.simulation_passed
        const parts = req.split('.');
        let v: any = { payload };
        for (const p of parts) {
          if (v == null) break;
          v = v[p];
        }
        if (!v) return { allowed: false, reason: `${r.id}:missing:${req}`, rule: r.id };
      }
      // required satisfied
      return { allowed: true, rule: r.id };
    }
  }

  return { allowed: true, rule: 'default' };
}
