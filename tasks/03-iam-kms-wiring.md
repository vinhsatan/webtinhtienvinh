# Task: IAM KMS Wiring (M1 / M2)

- Owner: platform/security
- Estimate: 1 week
- Priority: High

## Goal
Wire production KMS signer for token issuance, add proxy or SDK-based signing, and rotate dev key.

## Acceptance Criteria
- `src/iam/iamService.ts` uses `IAM_KMS_SIGN_URL` or `AWS_KMS_KEY_ID` + `AWS_KMS_PROXY_URL`.
- Integration test that uses a KMS proxy mock to validate signature envelope format.
- `.env.example` updated and docs for secret configuration.

## Files to change
- `src/iam/iamService.ts`
- `src/iam/kmsService.ts`
- `docs/ENV.md`

## Next Steps
1. Validate KMS proxy interface in staging.
2. Implement rotation plan for `IAM_PRIVATE_KEY`.
3. Add CI secret check ensuring `IAM_KMS_SIGN_URL` presence for protected branches.
