# Auto-Flow: automation_master_roadmap.mb

This file is the repository-mapped Auto‑Flow of `automation_master_roadmap.mb` (v1.0). It links each roadmap stage to the corresponding repo artifacts and tracked TODOs.

Summary mapping:

- **Stage A — Trigger Registry + PDP**: `database/migrations/20260210_01_create_trigger_registry.sql`, `src/control/triggerRegistry.db.ts`, `src/pdp/rules.json`, `src/pdp/rulesLoader.ts`, TODO: `tasks/01-create-trigger-registry-db.md`.
- **Stage B — Orchestration + IAM tokens**: `src/orchestrator/*` (`temporal.ts`, `argo.ts`, `orchestratorService.ts`), `src/iam/iamService.ts`, `src/iam/kmsService.ts`.
- **Stage C — Simulation & Approval harness**: `scripts/run-simulation.js` (placeholder), `scripts/pdp-validate.js`, CI artifact: `policy-check-result.json`.
- **Stage D — Execute & Audit**: `src/audit/auditService.ts`, orchestrator `startTriggerById()` flow appends audit entries.
- **Stage E — Reconciliation & Repair**: scaffold `src/reconciler/reconciler.ts` (task created: `tasks/15-implement-reconciler-workflows.md`).
- **Stage F — Observability & Safety**: OpenTelemetry scaffolding (`src/opentelemetry/*`), `docs/runbooks/kill-switch.md` (runbook placeholder), CI safety tasks `tasks/19-ci-safety-gates.md`.

Immediate actionables (from roadmap "Next Steps"):

- Finalize Trigger Registry APIs and register initial triggers (owner: `platform/api`).
- Wire IAM KMS signer and add `IAM_KMS_SIGN_URL` to secrets (owner: `platform/security`).
- Enable CI secrets `DB_CONN`, `IAM_KMS_SIGN_URL` and run E2E CI (owner: `platform/ci`).

How to mark progress:

- Update the todo tracker (project TODO) and mark per-stage items done as features and tests are implemented.
- Use `npm run tooling:policy-check` and `npm run test:simulation` to produce artifacts that CI will upload.

Files created/updated by Auto-Flow scaffolding so far:
- `database/migrations/20260210_01_create_trigger_registry.sql`
- `src/control/triggerRegistry.db.ts`
- `scripts/migrate-trigger-registry.js`
- `src/orchestrator/orchestratorService.ts`
- `src/iam/iamService.ts`, `src/iam/kmsService.ts`
- `src/pdp/rules.json`, `src/pdp/rulesLoader.ts`
- `src/audit/auditService.ts`
- `scripts/pdp-validate.js`
- `scripts/query-trigger-registry.js` (debug & error-flow)
- CI: `.github/workflows/vitest-postgres.yml`, `.github/workflows/trigger-registry-ci.yml`

Next recommended step: choose the highest-priority stage to implement (Stage A is `in-progress`). Reply with which stage to advance (A–F) or say `run e2e` to prepare CI secrets and run the integration pipeline.
