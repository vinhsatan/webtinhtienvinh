# M1 — Trigger Registry + Orchestrator connectors + IAM stub

Owner: platform/api, platform/orchestrator, platform/security

Deliverables:
- Trigger Registry schema and API: `database/migrations/20260210_01_create_trigger_registry.sql`, `src/control/triggerRegistry.db.ts`, `src/control/triggerRegistry.api.ts` (stub).
- Orchestrator connectors: `src/orchestrator/temporal.ts`, `src/orchestrator/argo.ts`, `src/orchestrator/orchestratorService.ts`.
- IAM signing stub: `src/iam/iamService.ts`, `src/iam/kmsService.ts` (KMS optional).

Next steps:
- Finalize `trigger_registry` CRUD API and register sample triggers.
- Add unit tests for DB layer and connector stubs.
- Add CI job to run migration dry-run and connector smoke tests.

Acceptance criteria:
- API endpoints implemented and tested locally against ephemeral Postgres.
- `issueExecutionToken()` returns a test token in dev mode.
