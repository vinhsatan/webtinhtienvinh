Orchestrator Connectors

This folder contains minimal example connectors to Temporal and Argo Workflows.

Prerequisites
- Temporal: @temporalio/client installed and Temporal service reachable via `TEMPORAL_ADDRESS`.
- Argo: Argo Server reachable via `ARGO_SERVER` and API credentials configured if required.

Files
- `temporalConnector.ts` — start, signal, query and terminate Temporal workflows.
- `argoConnector.ts` — submit, query, and terminate Argo workflows via HTTP API.

Notes
- These are example connectors for wiring the orchestration layer. They do not implement IAM token exchange, policy checks, or audit logging — those should be implemented in the orchestration service that uses these connectors.
- Ensure workflows are defined and registered on the worker side (Temporal) or proper templates exist (Argo).

Next steps
- Integrate these connectors into your orchestrator service.
- Add token issuance and PDP checks before calling `start`/`submit`.
- Add audit append for every call with inputs and returned IDs.
