# 04 — Integrate IAM KMS Signing

Subtasks:
- Implement AWS KMS signing path in `src/iam/kmsService.ts`.
- Add HTTP external-signer fallback (`IAM_KMS_SIGN_URL`).
- Add local JWT fallback for dev (`IAM_PRIVATE_KEY`).
- Add CI secrets gating and unit tests for signing.
