# Trigger Registry Migration

This document explains how to migrate the file-backed trigger registry (`data/triggerRegistry.json`) to Postgres.

Prerequisites:
- A Postgres instance reachable via `DB_CONN` or `DATABASE_URL` environment variable.
- `psql` available for applying SQL migrations.

Steps:

1. Apply the SQL migration to create the table:

```bash
psql "$DB_CONN" -f database/migrations/20260210_01_create_trigger_registry.sql
```

2. Dry-run the import to preview records (no DB changes):

```bash
node scripts/migrate-trigger-registry.js --dry-run
```

3. Run the import (will insert/update rows):

```bash
export DB_CONN="postgres://user:pass@host:5432/dbname"
node scripts/migrate-trigger-registry.js
```

4. Verify counts:

```bash
psql "$DB_CONN" -c "SELECT count(*) FROM trigger_registry;"
```

Notes:
- The migration script uses `ON CONFLICT (id)` to upsert by `id`.
- For large datasets prefer COPY/bulk load strategies and staged imports.
