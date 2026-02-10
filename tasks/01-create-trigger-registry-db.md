# 01 — Create Trigger Registry DB

Goal: replace the file-backed trigger registry with a production Postgres-backed service and migration path.

Subtasks:
- Define DB schema (triggers table, indexes, soft-delete, audit fields).
- Add SQL migration file under `database/migrations/`.
- Implement `src/control/triggerRegistry.db.ts` DB access layer.
- Create seed + sample data and a `scripts/migrate-trigger-registry.js` runner.
- Add unit and integration tests (requires `DB_CONN`).

Acceptance criteria:
- `npm run migrate` applies migrations and `listTriggers()` works against Postgres.
- Migration script can import existing `data/triggerRegistry.json` records.
