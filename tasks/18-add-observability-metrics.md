# 18 — Add Observability & Metrics (OTel + Prometheus)

Goal: Provide traces and metrics for core automation flows (token issuance, PDP, workflow start, reconciliation).

Subtasks:
- Initialize OTel Node SDK (`src/opentelemetry/init.ts`) and configure exporters for dev/prod.
- Add Prometheus metrics counters/histograms (`src/opentelemetry/promMetrics.ts`) and expose `/metrics`.
- Instrument `src/orchestrator/orchestratorService.ts`, `src/iam/iamService.ts`, and `src/pdp/pdpService.ts` with spans and metrics.
- Add Grafana dashboard snippets and example queries in `docs/observability.md`.
- Add CI smoke test to hit `/metrics` and assert expected metric names exist.

Acceptance criteria:
- `/metrics` endpoint exposes essential metrics and OTel traces are emitted in dev/CI.
