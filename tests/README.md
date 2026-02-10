Integration Tests

Location: `tests/integration`

Run integration tests (scaffolding) with:

```bash
npm run test:integration
```

Notes:
- Tests are designed as scaffolded integration tests and mock external systems (PDP, IAM, Temporal/Argo connectors).
- Extend tests to cover real orchestrator flows by removing mocks and providing test doubles for external services.
