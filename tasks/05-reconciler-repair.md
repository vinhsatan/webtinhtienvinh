# Task: Reconciler & Repair Workflows (M3)

- Owner: platform/finance
- Estimate: 2 weeks
- Priority: High

## Goal
Implement periodic reconciler and repair workflow templates with 2-party approval for critical fixes.

## Acceptance Criteria
- `src/reconciler/reconciler.ts` runs and emits repair tasks.
- Repair templates exist in `src/reconciler/repairs/*` and are executable via orchestrator.
- 2-party approval flow implemented (PDP + approval token) for high-severity repairs.

## Files to change
- `src/reconciler/*`
- `src/orchestrator/*` for repair workflow submission
- `tests/integration/reconciler.integration.test.ts`

## Next Steps
1. Add reconciler cron job and CI smoke test (needs `DB_CONN`).
2. Implement approve/execute CLI and API flows.
