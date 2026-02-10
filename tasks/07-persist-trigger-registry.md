# Task: Persist Trigger Registry to DB (M1)

- Owner: platform/api
- Estimate: 1 week
- Priority: High

## Goal
Migrate the Trigger Registry from the current file-backed store to a Postgres-backed store with a migration path and minimal downtime.

## Acceptance Criteria
- `src/control/triggerRegistry.db.ts` implements CRUD against Postgres using `pg`.
- Migration script to create `automation_triggers` table and migrate existing `data/triggerRegistry.json` entries.
- `src/orchestrator/api.ts` can be toggled to use DB-backed registry via env flag `TRIGGER_REGISTRY_BACKEND=db`.
- Integration tests for DB-backed registry (uses test DB or Docker container in CI).

## Files to change
- `src/control/triggerRegistry.db.ts`
- `scripts/migrate-trigger-registry.js`
- `tasks/01-trigger-registry.md` (update to reference DB option)

## Next Steps
1. Implement DB-backed registry scaffold (this task creates a starter file).
2. Add migration script that reads `data/triggerRegistry.json` and inserts rows into Postgres.
3. Add CI job to run migrations against ephemeral test DB before integration tests.
