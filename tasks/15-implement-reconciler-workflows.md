# 15 — Implement Reconciler Workflows

Goal: detect, report, and repair data drift between source systems and the canonical ledger.

Subtasks:
- Scaffold a reconciler worker (`src/reconciler/reconciler.ts`) that runs periodically or via orchestrator.
- Implement detection queries for key entities (balances, transactions, ledgers) with tolerance thresholds.
- Implement a repair action library that can propose fixes (recreate missing rows, fix amounts) and generate human-review PRs.
- Add two-phase approval for high-risk repairs (PDP + operator sign-off).
- Add reconciliation audit chain entries (append-only, include checksum links).
- Add unit and integration tests using a sample Postgres fixture.

Acceptance criteria:
- `npm run reconcile` runs a dry reconciliation and emits a JSON report.
- Reconciler can be scheduled in CI/orchestrator and produces a reproducible report for each run.
