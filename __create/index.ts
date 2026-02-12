// Bridge so Vite plugin serverEntryPoint './__create/index.ts' resolves
// to the real implementation under `src/__create`.
export * from '../src/__create/index';

// Provide a default Hono app for the dev server. The react-router Hono
// plugin expects the server entrypoint to export a default app with a
// `fetch` handler. We delegate to the official helper which wires up
// the React Router server build and static assets.
import { createHonoServer } from 'react-router-hono-server/node';
import fs from 'node:fs/promises';
import path from 'node:path';

// Helper to auto-register legacy API handlers under /api
async function registerLegacyApi(app: any) {
	const apiDir = path.resolve(process.cwd(), 'src/legacy_api');
	try {
		const stat = await fs.stat(apiDir);
		if (!stat.isDirectory()) return;
	} catch {
		return; // no legacy_api folder
	}

	async function walk(dir: string) {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		for (const ent of entries) {
			const full = path.join(dir, ent.name);
			if (ent.isDirectory()) {
				await walk(full);
				continue;
			}
			if (ent.isFile() && /route\.(js|ts)$/.test(ent.name)) {
				// derive route path from file location
				const rel = path.relative(apiDir, path.dirname(full));
				const routeBase = '/api' + (rel === '' ? '' : '/' + rel.replaceAll(path.sep, '/'));
				// dynamic import the module
				try {
					const mod = await import(full);
					// register common methods
					if (mod.GET) app.get(routeBase, mod.GET);
					if (mod.POST) app.post(routeBase, mod.POST);
					// For item-level methods, register with :id
					if (mod.PUT) app.put(routeBase + '/:id', mod.PUT);
					if (mod.DELETE) app.delete(routeBase + '/:id', mod.DELETE);
					if (mod.PATCH) app.patch(routeBase + '/:id', mod.PATCH);
					// also register GET on item if present
					if (mod.GET && mod.GET.length === 0) {
						// nothing
					}
				} catch (e) {
					// best-effort: log and continue
					// eslint-disable-next-line no-console
					console.error('Failed to register legacy api route', full, e);
				}
			}
		}
	}

	await walk(apiDir);
}

export default await createHonoServer({
	configure: async (app: any) => {
		// Provide simple development stubs so UI can load without a real DB
		if (!(globalThis as any).dbPool) {
			const createStubPool = () => ({
				query: async (_text: string, _params?: any[]) => ({ rows: [], rowCount: 0 }),
				// minimal interface for callers
				end: async () => {},
			});
			(globalThis as any).dbPool = createStubPool();
		}
		if (!(globalThis as any).broadcastToUser) {
			(globalThis as any).broadcastToUser = (_userId: any, _msg: any) => {};
		}
		if (!(globalThis as any).wsClients) {
			(globalThis as any).wsClients = new Map();
		}

		// Inject a development user into the Hono context so legacy handlers
		// that call `c.get('user')` don't throw.
		app.use('*', async (c: any, next: any) => {
			try {
				if (!c.get('user')) {
					c.set('user', { userId: 'dev-user', email: 'dev@localhost' });
				}
			} catch {
				// best-effort
			}
			return await next();
		});

		await registerLegacyApi(app);
	},
});
