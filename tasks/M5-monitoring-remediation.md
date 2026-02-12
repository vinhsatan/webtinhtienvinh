# M5 — Monitoring Automation & Remediation Playbooks

Owner: platform/ops

Deliverables:
- OpenTelemetry instrumentation across orchestrator and reconciler.
- Prometheus metrics and alert rules.
- Automated remediation playbooks for common failures.

Next steps:
- Add OTel init and basic spans/metrics in `src/opentelemetry` and instrument key flows.
- Define Prometheus metrics and create alert→runbook mappings.

Acceptance criteria:
- Alerts trigger runbooks and remediation jobs are executable from orchestrator.
