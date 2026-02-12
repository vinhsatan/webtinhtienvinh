# Task: PR Gating & Merge Workflow Validation (M4)

- Owner: platform/ci
- Estimate: 3 days
- Priority: High

## Goal
Ensure PRs modifying automation artifacts are gated by simulation, policy checks, and lockfile validation before merge.

## Acceptance Criteria
- `.github/workflows/automation-safety.yml` enforces `test:simulation` and `tooling:policy-check`.
- `repair-lockfile` job opens a fix-PR when mismatch detected or provides remediation instructions.
- Protected branches require safety checks to pass.

## Files to change
- `.github/workflows/automation-safety.yml`
- `.github/workflows/integration-tests.yml`
- `scripts/ci-fix-lockfile.js`

## Next Steps
1. Update repo branch protection settings (manual step).
2. Implement lockfile fixer and integrate with workflow.
3. Run a PR test to validate gating.
