# Task: CI Safety Gates & Lockfile Fix (M4)

- Owner: platform/ci
- Estimate: 1 week
- Priority: High

## Goal
Ensure CI runs simulation + policy checks; add a job to detect and repair lockfile/dependency mismatches.

## Acceptance Criteria
- `.github/workflows/automation-safety.yml` runs `npm run test:simulation` and `npm run tooling:policy-check` and uploads artifacts.
- New CI job `repair-lockfile` checks `package-lock.json` vs `package.json` and fails PR with remediation instructions or opens a fix-PR.
- Local `npm ci` runs in dev/CI without lockfile errors after fixes.

## Files to change
- `.github/workflows/automation-safety.yml`
- `.github/workflows/integration-tests.yml`
- `scripts/ci-fix-lockfile.js`

## Next Steps
1. Implement `scripts/ci-fix-lockfile.js` to detect and propose changes.
2. Add GitHub Action step to open a fix-PR when mismatch detected.
3. Re-run CI to validate lockfile fixes.
