# M6 — Kill-switch, Quarantine, Incident Automation & Drills

Owner: platform/ops, platform/security

Deliverables:
- Global & per-workflow kill-switch endpoints and runbooks: `docs/runbooks/kill-switch.md`.
- Quarantine queue and manual review workflow.
- Incident drill playbooks and scheduled drills.

Next steps:
- Implement kill-switch API in orchestrator and test signaling to running workflows.
- Add quarantine queue consumer and review UI stubs.

Acceptance criteria:
- Kill-switch successfully halts new workflow starts and flags running instances for checkpointing.
