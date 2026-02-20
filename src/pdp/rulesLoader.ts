import fs from 'node:fs/promises';
import path from 'node:path';

const RULES_PATH = path.resolve(process.cwd(), 'src', 'pdp', 'rules.json');

function matchValue(pattern: any, value: any) {
  if (pattern == null) return true;
  if (typeof pattern === 'string') {
    if (pattern.startsWith('re:')) {
      const re = new RegExp(pattern.slice(3));
      return re.test(String(value ?? ''));
    }
    if (pattern === '*') return true;
    return String(value) === pattern;
  }
  if (pattern instanceof RegExp) return pattern.test(String(value ?? ''));
  return pattern === value;
}

export async function loadRules(): Promise<any[]> {
  try {
    const raw = await fs.readFile(RULES_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function matchWhenDot(when: Record<string, any>, trigger: any, payload: any) {
  // dot-path matcher: keys refer to properties on trigger or payload
  for (const key of Object.keys(when)) {
    const parts = key.split('.');
    // try trigger first
    let v: any = trigger;
    for (const p of parts) {
      if (v == null) break;
      v = v[p];
    }
    if (v === undefined) {
      // try payload as fallback
      v = payload;
      for (const p of parts) {
        if (v == null) break;
        v = v[p];
      }
    }
    if (!matchValue(when[key], v)) return false;
  }
  return true;
}

export function matchesWhen(when: any, trigger: any, payload: any) {
  if (!when) return false;
  // prefer explicit fields if present
  if (when.name && !matchValue(when.name, trigger?.name)) return false;
  if (when['source.type'] && !matchValue(when['source.type'], trigger?.source?.type ?? trigger?.spec?.source?.type)) return false;
  if (when.safety_level && !matchValue(when.safety_level, trigger?.source?.safety_level ?? trigger?.safety_level ?? trigger?.spec?.safety_level)) return false;
  if (when.owner && !matchValue(when.owner, trigger?.source?.owner ?? trigger?.owner)) return false;
  // if when has other keys, apply dot-path matching
  const otherKeys = Object.keys(when).filter(k => !['name', 'source.type', 'safety_level', 'owner'].includes(k));
  if (otherKeys.length > 0) {
    const subset: Record<string, any> = {};
    for (const k of otherKeys) subset[k] = when[k];
    if (!matchWhenDot(subset, trigger, payload)) return false;
  }
  return true;
}

export async function evaluateRules(trigger: any, payload: any) {
  const rules = await loadRules();
  for (const r of rules) {
    const when = r.when || {};
    if (Object.keys(when).length && !matchesWhen(when, trigger, payload)) continue;

    // explicit allow (but preserve flags like require_simulation)
    if (r.effect === 'allow') {
      const out: any = { allowed: true, rule: r.id };
      if (r.require_simulation) out.requireSimulation = true;
      return out;
    }

    // deny-if-missing: ensure required fields exist in payload (dot-path)
    if (r.effect === 'deny-if-missing') {
      const required: string[] = r.require || [];
      for (const req of required) {
        const parts = req.split('.');
        let v: any = payload;
        for (const p of parts) {
          if (v == null) break;
          v = v[p];
        }
        if (!v) return { allowed: false, reason: `${r.id}:missing:${req}`, rule: r.id };
      }
      return { allowed: true, rule: r.id };
    }

    // default effect handling: deny vs allow
    const out: any = { allowed: r.effect !== 'deny', reason: r.description || r.id || 'rule-match' };
    if (r.require_simulation) out.requireSimulation = true;
    return out;
  }
  return { allowed: true, rule: 'default' };
}

export default { loadRules, matchesWhen, evaluateRules };
