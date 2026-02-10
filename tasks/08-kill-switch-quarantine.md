# Task: Kill-switch & Quarantine (M6)

- Owner: platform/ops
- Estimate: 1 week
- Priority: High

## Goal
Implement global and per-workflow kill-switch mechanisms, quarantine queue, and recovery flows.

## Acceptance Criteria
- Global kill-switch API that prevents new workflow starts and signals running workflows.
- Per-workflow quarantine queue for flagged executions pending manual review.
- `docs/runbooks/kill-switch.md` updated with procedures and authorization steps.
- Integration test that verifies kill-switch blocks starts and signals executors.

## Files to change
- `src/control/killSwitch.ts`
- `src/orchestrator/*` (honor kill-switch before start)
- `docs/runbooks/kill-switch.md`

## Next Steps
1. Implement a feature-flag-backed kill-switch (env + DB flag).
2. Add audit entries when kill-switch is toggled.
3. Provide CLI/admin UI to toggle with proper RBAC.
