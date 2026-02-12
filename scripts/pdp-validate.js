#!/usr/bin/env node
// Validate PDP rules schema and basic loader
import fs from 'fs';
import path from 'path';

const rulesPath = path.resolve(process.cwd(), 'src', 'pdp', 'rules.json');
const outPath = path.resolve(process.cwd(), 'policy-check-result.json');
const result = { ok: false, timestamp: new Date().toISOString(), errors: [] };
try {
  const raw = fs.readFileSync(rulesPath, 'utf8');
  const rules = JSON.parse(raw);
  if (!Array.isArray(rules)) {
    result.errors.push('rules.json must be an array');
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.error(result.errors[0]);
    process.exit(2);
  }
  // basic sanity checks
  for (const r of rules) {
    if (!r.id) { result.errors.push('rule missing id: ' + JSON.stringify(r)); }
    if (!r.effect) { result.errors.push('rule missing effect: ' + JSON.stringify(r)); }
  }
  if (result.errors.length > 0) {
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.error('PDP validation failed with errors');
    for (const e of result.errors) console.error(' -', e);
    process.exit(3);
  }
  result.ok = true;
  result.summary = { rulesCount: rules.length };
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('PDP rules validation OK');
  process.exit(0);
} catch (err) {
  result.errors.push(String(err));
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.error('Failed to validate PDP rules', err);
  process.exit(1);
}
