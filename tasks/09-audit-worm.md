# Task: Audit WORM Storage (M2/M5)

- Owner: platform/compliance
- Estimate: 1 week
- Priority: High

## Goal
Move audit logs to a WORM-friendly store and add cryptographic chaining for tamper-evidence.

## Acceptance Criteria
- `src/audit/auditService.ts` can write to append-only WORM store (S3 Glacier/Immutable bucket or DB with immutable mode).
- Implement cryptographic chaining (hash chain) per audit append.
- Migration doc for existing `logs/audit.log` to WORM store.

## Files to change
- `src/audit/auditService.ts`
- `scripts/migrate-audit-to-worm.js`
- `docs/compliance/audit-worm.md`

## Next Steps
1. Prototype with local file-based chain, then integrate with S3 immutable bucket in staging.
2. Add tests that validate chain integrity after appends.
