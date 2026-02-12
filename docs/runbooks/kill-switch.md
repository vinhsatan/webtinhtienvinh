# Kill-Switch Runbook

Overview
- The kill-switch quiesces automated workflows and signals running workflows to checkpoint and enter safe-stop.

When to use
- Detected financial imbalance
- Unbounded resource consumption
- Security incident impacting automation

How to trigger
- API: `GET /kill-switch` — view status
- API: `POST /kill-switch/global` — body: `{ on: boolean, by?: string, reason?: string }`
- API: `POST /kill-switch/triggers/:id` — body: `{ on: boolean, by?: string, reason?: string }`
- Orchestrator UI: "Global Kill"

Immediate effects
- Stop new workflow starts (enforced by orchestrator pre-check)
- Signal running workflows via orchestrator (Temporal signals / Argo terminate)
- Move failing/risky workflows to quarantine queue

Post-action
- Create incident ticket and assign owners
- Run reconciliation job for affected tenants
- After remediation, perform staged re-enable with canary

Audit
- All kill actions must be recorded in Audit Store with operator id and justification.

Notes
- Ensure RBAC protects kill endpoints; require MFA for global toggles in production.
- If API is unreachable, toggle the DB-backed flag or use cloud console as OOB fallback.
