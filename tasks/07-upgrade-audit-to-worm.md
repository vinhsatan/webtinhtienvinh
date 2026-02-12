# 07 — Upgrade Audit to WORM Storage

Subtasks:
- Design immutable audit storage (S3 WORM / append-only DB table / object-store with CAS).
- Implement write-ahead cryptographic chaining for audit logs.
- Add retention & legal-hold metadata support.
- Add migration tool to copy existing `logs/audit.log` to WORM store.
