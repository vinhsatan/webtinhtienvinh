# Task: Orchestrator Connectors (Temporal + Argo) (M1)

- Owner: platform/orchestrator
- Estimate: 2 weeks
- Priority: High

## Goal
Complete connector implementations for Temporal and Argo, ensure token propagation and audit appenders.

## Acceptance Criteria
- `src/orchestrator/temporalConnector.ts` supports start/signal/query/terminate.
- `src/orchestrator/argoConnector.ts` supports submit/status/terminate.
- Connectors attach `Authorization: Bearer <token>` and append audit entries.
- Integration test that mocks connectors and validates token usage.

## Files to change
- `src/orchestrator/temporalConnector.ts`
- `src/orchestrator/argoConnector.ts`
- `tests/integration/orchestrator.connectors.test.ts`

## Next Steps
1. Tidy current connector code and add robust error handling.
2. Add retry and idempotency logic for submits.
3. Add metrics hooks (OTel) placeholders.
