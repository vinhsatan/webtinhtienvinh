// NOTE: Per-route auth helper has been deprecated.
// Authentication/authorization is centralized via `applyEnterpriseSecurity(app)` in production.
export function requireAuth() {
  throw new Error('_requireAuth.js has been removed; use centralized middleware (applyEnterpriseSecurity)');
}

export default requireAuth;
