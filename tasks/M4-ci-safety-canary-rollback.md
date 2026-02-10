# M4 — CI Safety Gates, Canary, Rollback Automation

Owner: platform/ci, platform/security, platform/ops

Deliverables:
- GitHub Actions safety pipeline: `automation-safety.yml` (policy checks + simulation + artifact upload).
- Canary promotion job and rollback automation.

Next steps:
- Add workflow steps to run `npm run tooling:policy-check` and upload `policy-check-result.json`.
- Implement canary promotion with automated health checks and rollback hooks.

Acceptance criteria:
- PRs failing policy checks are blocked from merge; canary job auto-promotes on green.
