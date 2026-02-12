# M2 — PDP rules engine, Simulation Sandbox, Audit Store

Owner: platform/security, platform/ops

Deliverables:
- PDP rules: `src/pdp/rules.json`, `src/pdp/rulesLoader.ts`, `src/pdp/pdpService.ts`.
- Simulation harness: `scripts/run-simulation.js` (produce `simulation/report.json`).
- Audit store (append-only): `src/audit/auditService.ts` and WORM design doc.

Next steps:
- Implement simulation runner that accepts trigger + payload and writes signed report.
- Wire PDP evaluation into orchestrator flow.
- Add tests for rules and simulation artifacts.

Acceptance criteria:
- `npm run tooling:policy-check` validates rules; simulation produces signed artifact.
