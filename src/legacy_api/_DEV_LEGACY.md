NOTE: This folder contains legacy Next/Hono API route handlers used during development.

Do NOT expose these routes in production. The canonical production API surface is the Express app
in `src/orchestrator/api.ts` and the single runtime entrypoint `src/server/index.ts`.

When preparing a production build, either remove this folder or ensure it is not served by the runtime.
