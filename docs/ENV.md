# Environment variables

This file documents environment variables used by the automation control plane.

## Core

- `DATABASE_URL` **(primary)**: Postgres connection string used by the app, reconciler, scripts, and DB-backed Trigger Registry. Example: `postgres://user:pass@localhost:5432/webdb`.
- `DB_CONN` *(backward-compatible fallback)*: Deprecated alias for `DATABASE_URL`. Prefer `DATABASE_URL` in new deployments.
- `DB_POOL_MAX` *(optional)*: Maximum connections in the shared Postgres pool. Defaults to `10`.
- `TRIGGER_REGISTRY_BACKEND`: `db` (default in production) or `file` to select the DB-backed or file-backed Trigger Registry implementation.

## IAM / KMS

- `IAM_PRIVATE_KEY`: dev JWT private key (HMAC or RSA) used for local signing fallback.
- `IAM_KMS_SIGN_URL`: optional external signer HTTP endpoint that returns `{ token }` for payloads.
- `AWS_KMS_KEY_ID`: optional AWS KMS key id used with `@aws-sdk/client-kms`.
- `AWS_KMS_PROXY_URL`: optional HTTP proxy for KMS signing when AWS SDK is not used.
- `AWS_REGION`: AWS region for KMS SDK (e.g. `us-east-1`).

## Security / RBAC

- `ADMIN_OPERATORS`: comma-separated list of operator IDs allowed to use `X-Operator` header for kill-switch actions in non-production workflows.

## Observability

- `ENABLE_METRICS`: `true` to enable `/metrics` endpoint (Prometheus).
- `ENABLE_OTEL`: `true` to enable OpenTelemetry SDK initialization (Node SDK).
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP HTTP exporter endpoint.

## CI / Safety

- `GITHUB_TOKEN`: provided by GitHub Actions for PR automation.
- `DATABASE_URL` (in CI): set as a secret for integration tests that require a database. `DB_CONN` is accepted as a fallback.
- `IAM_KMS_SIGN_URL` (in CI): set as a secret to use a staging signer for token tests.

## Notes

- In production, prefer `AWS_KMS_KEY_ID` + proper AWS credentials (IAM role) rather than `IAM_PRIVATE_KEY`.
- The DB-backed Trigger Registry is the default in production. Run `node scripts/migrate.js` after provisioning the database to apply all pending migrations.

## Running Migrations

Migrations live in `database/migrations/` as `.sql` files named with a sortable timestamp prefix.

To apply all pending migrations:

```bash
DATABASE_URL=postgres://user:pass@host:5432/db node scripts/migrate.js
```

The runner is idempotent - already-applied migrations are skipped. Applied filenames are recorded in the `schema_migrations` table.

## Environment & Secrets

This section explains GitHub Secrets used by CI workflows and local runs.

### Required secrets/environment variables

- `DATABASE_URL` (secret): Postgres connection string. Example: `postgres://user:pass@host:5432/db`. `DB_CONN` is accepted as a backward-compatible fallback.
- `IAM_KMS_SIGN_URL` (optional secret): URL of external KMS signing service.
- `IAM_PRIVATE_KEY` (dev-only): Private signing key for local development only. Do NOT commit real keys.
- `TEMPORAL_ADDRESS`: Temporal service address (e.g., `localhost:7233`).
- `ARGO_SERVER` / `ARGO_NAMESPACE`: Argo server URL and namespace for Argo connector.
- `ORCHESTRATOR`: `temporal` or `argo` to choose connector in orchestrator service.

### GitHub Actions

The integration test workflow expects `DATABASE_URL` (or `DB_CONN`) and optionally `IAM_KMS_SIGN_URL` to be configured as Repository Secrets.

To add a secret:
1. Go to your repository Settings -> Secrets -> Actions.
2. Click "New repository secret".
3. Add `DATABASE_URL` with the connection string.
4. (Optional) Add `IAM_KMS_SIGN_URL`.

### Local development

- Copy `.env.example` to `.env` and fill in values for local runs.
- Keep secrets out of version control.

### Security

- Use short-lived credentials and least-privilege DB users for CI and automation.
- Rotate KMS/IAM keys regularly and use a managed KMS when possible.
