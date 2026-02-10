#!/usr/bin/env node
// CommonJS CI lockfile checker for package.json vs package-lock.json
// Exits 0 if OK, 1 if mismatches found. Run with `--fix` to print suggested remediation.

const fs = require('fs');
const path = require('path');

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');
const pkg = readJSON(pkgPath);
const lock = readJSON(lockPath);

if (!pkg) {
  console.error('package.json not found or invalid');
  process.exit(2);
}
if (!lock) {
  console.error('package-lock.json not found or invalid');
  process.exit(2);
}

function normalizeRange(r) {
  if (!r) return '';
  return r.replace(/^[\^~>=< ]+/, '');
}

function compareDeps(depMap) {
  const mismatches = [];
  for (const [name, range] of Object.entries(depMap || {})) {
    const expected = normalizeRange(range);
    const lockEntry = (lock.dependencies && lock.dependencies[name]) || null;
    const locked = lockEntry && lockEntry.version;
    if (!locked) {
      mismatches.push({ name, reason: 'missing-in-lockfile', expectedRange: range });
      continue;
    }
    if (!expected || expected.startsWith('git+') || expected.includes(':')) continue;
    if (locked === expected) continue;
    const pkgSpec = String(range || '');
    if ((pkgSpec.startsWith('^') || pkgSpec.startsWith('~')) && locked.startsWith(expected.split('.')[0] + '.')) {
      continue;
    }
    mismatches.push({ name, expectedRange: range, lockedVersion: locked });
  }
  return mismatches;
}

const depMismatches = compareDeps(pkg.dependencies || {});
const devMismatches = compareDeps(pkg.devDependencies || {});
const all = depMismatches.concat(devMismatches);

if (all.length === 0) {
  console.log('LOCKFILE_CHECK: OK — package-lock.json matches package.json (heuristic)');
  process.exit(0);
}

console.error('LOCKFILE_CHECK: MISMATCHES FOUND');
console.error(JSON.stringify(all, null, 2));

if (process.argv.includes('--fix')) {
  console.error('\nSuggested remediation: regenerate lockfile and commit.');
  console.error('Run:');
  console.error('  npm install --package-lock-only');
  console.error('Then inspect changes and commit the updated package-lock.json');
}

process.exit(1);
