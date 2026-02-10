# Task: Observability (OTel + Prometheus) (M5)

- Owner: platform/ops
- Estimate: 1 week
- Priority: Medium

## Goal
Add OpenTelemetry instrumentation and Prometheus metrics for orchestrator, executors, and reconciler.

## Acceptance Criteria
- OTel SDK initialized in `src/index` or `src/app` with basic traces and metrics.
- Metrics exporter for Prometheus enabled (local / dev config).
- Dashboards/alerting templates committed under `docs/observability`.
- CI smoke test that verifies metrics endpoint responds.

## Files to change
- `src/opentelemetry/*` or `src/instrumentation.ts`
- `src/orchestrator/*` (add spans around start/submit)
- `docs/observability/` (dashboards + alerts)

## Next Steps
1. Add dependency `@opentelemetry/sdk-node` and `prom-client`.
2. Instrument critical paths: token issuance, PDP eval, workflow start, reconciliation.
3. Create Prometheus scrape config for local testing.
