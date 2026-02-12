# 02 — Migrate Trigger Registry Data

Subtasks:
- Export records from file-backed `data/triggerRegistry.json`.
- Create a safe dry-run migration mode that writes a preview report.
- Run migration against staging Postgres and validate counts/hashes.
- Run final migration and mark old file-backed source read-only archive.

Acceptance criteria: migration report with checksums and row counts.
