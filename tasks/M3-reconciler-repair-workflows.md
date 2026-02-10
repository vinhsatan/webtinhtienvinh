# M3 — Reconciler + Repair Workflows + Runbooks

Owner: platform/finance, platform/orchestrator

Deliverables:
- Reconciler worker: `src/reconciler/reconciler.ts` (periodic jobs, discrepancy detection).
- Repair workflow templates and approval gating.
- Reconciliation runbooks in `docs/runbooks/reconciliation.md`.

Next steps:
- Scaffold reconciler and basic detection queries against trigger registry and ledger tables.
- Create repair workflow templates and PDP checks for critical repairs.

Acceptance criteria:
- Reconciler detects a seeded discrepancy and emits a repair task requiring approval.
