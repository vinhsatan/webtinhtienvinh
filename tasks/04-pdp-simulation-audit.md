# Task: PDP, Simulation Harness & Audit (M2)

- Owner: platform/security
- Estimate: 1 week
- Priority: High

## Goal
Finalize PDP rules loader, simulation harness, and append-only audit store.

## Acceptance Criteria
- `src/pdp/rulesLoader.ts` and `src/pdp/rules.json` validated via `npm run tooling:policy-check`.
- `scripts/run-simulation.js` produces signed `simulation/report.json` and CI uploads artifact.
- `src/audit/auditService.ts` uses append-only pattern and log rotation policy.

## Files to change
- `src/pdp/*`
- `scripts/run-simulation.js`
- `src/audit/auditService.ts`

## Next Steps
1. Add more simulation scenarios for critical workflows.
2. Ensure simulation output is signed by IAM path.
3. Add CI workflow steps to gate PRs with simulation artifact.
