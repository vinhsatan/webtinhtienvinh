# 17 — Upgrade Audit to WORM/Immutable Storage

Goal: ensure audit records are tamper-evident and stored in an immutable WORM store.

Subtasks:
- Design architecture: S3 Object Lock (WORM) or append-only ledger table with cryptographic chaining.
- Implement write-ahead chained audit entries (`src/audit/wormAudit.ts`) that compute SHA256(prev_entry + current_entry).
- Add a migration script to copy existing `logs/audit.log` into the WORM store and emit a verification report.
- Add retention/hold metadata and legal-hold flag support in audit metadata.
- Add monitoring and alerting for write failures or unverifiable chains.

Acceptance criteria:
- Existing audit lines are imported and the chain verifies.
- New audit writes include chain links and are written to the immutable target.
