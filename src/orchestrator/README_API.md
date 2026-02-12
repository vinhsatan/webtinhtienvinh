Orchestrator API (scaffold)

This is a minimal Express-based API scaffold for the orchestrator. It exposes:

- `GET /health` — health check
- `GET /triggers` — list registered triggers (uses `src/control/triggerRegistry.ts`)
- `POST /triggers` — create a trigger (validates payload)
- `POST /triggers/:id/start` — start a trigger (calls `orchestratorService.handleTrigger`)

Notes
- The implementation is TypeScript and intended as a scaffold. To run in development, use `ts-node` or transpile to JavaScript.
- The API appends audit entries for create/start operations using `src/audit/auditService.ts`.
- Authentication, authorization, and rate-limiting are intentionally omitted in this scaffold and must be added for production.

Running locally (dev)
- Install dev dependency: `npm install -D ts-node` and `npm install express body-parser`
- Run: `ts-node src/orchestrator/api.ts`

Production
- Transpile TypeScript to JS and run via a process manager (PM2/systemd) behind a reverse proxy.
- Add TLS, auth, and request validation.
