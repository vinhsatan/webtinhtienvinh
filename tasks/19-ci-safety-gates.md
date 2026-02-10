# 19 — CI Safety Gates & Policy Artifacts

Goal: ensure PRs pass policy and simulation checks before allowing merges; upload policy artifacts for audit.

Subtasks:
- Add a CI step to run `npm run tooling:policy-check` and upload `policy-check-result.json` as a workflow artifact.
- Add simulation harness CI step to run core scenarios and save `simulation/report.json`.
- Add a policy gate job that blocks merges when `policy-check-result.json.ok` is false.
- Ensure lockfile check runs early and the `repair-lockfile` auto-PR job triggers if mismatched.

Acceptance criteria:
- Policy check artifacts are available on PR runs and a failing policy prevents merge.
