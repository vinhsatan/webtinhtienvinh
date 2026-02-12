NOTE: This folder contains legacy Next/Hono API route handlers used during development.

All files in this folder have been neutralized for production. The canonical production API surface is the Express app
in `src/orchestrator/api.ts` and the single runtime entrypoint `src/server/index.ts`.

Do not serve any routes from this folder in production.
