# Task: Trigger Registry (M1)

- Owner: platform/api
- Estimate: 1 week
- Priority: High

## Goal
Implement the Trigger Registry API and storage, register initial triggers with owner, SLA, and safety_level.

## Acceptance Criteria
- `src/control/triggerRegistry.ts` supports CRUD and validation.
- REST API endpoints exist under `src/orchestrator/api.ts` to create/list triggers.
- `data/triggerRegistry.json` created as initial backing store (migratable to DB).
- Unit tests for validation and idempotency.

## Files to change
- `src/control/triggerRegistry.ts`
- `src/orchestrator/api.ts`
- `tests/unit/triggerRegistry.test.ts`

## Next Steps
1. Implement in-memory then file-backed API.
2. Add schema validation and safety_level enums.
3. Add CI job to run trigger-related tests.
