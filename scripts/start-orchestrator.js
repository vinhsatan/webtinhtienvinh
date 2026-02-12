// DEV-ONLY helper for local development. Do NOT use in production.
if (process.env.NODE_ENV === 'production') {
	console.error('scripts/start-orchestrator.js is a dev helper and must not be used in production. Use dist/server/index.js instead.');
	process.exit(1);
}

import app from '../src/orchestrator/api.js';

const port = process.env.PORT || 3003;
app.listen(port, () => console.log(`Orchestrator API (dev) listening on ${port}`));
