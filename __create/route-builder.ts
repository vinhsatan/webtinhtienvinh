import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';
import { jwtAuthMiddleware } from './jwt-middleware';
import { sessionAuthMiddleware } from './session-auth-middleware';

const API_BASENAME = '/api';
const api = new Hono();

// Get current directory
const __dirname = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Recursively find all route.js files
async function findRouteFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  let routes: string[] = [];

  for (const file of files) {
    try {
      const filePath = join(dir, file);
      const statResult = await stat(filePath);

      if (statResult.isDirectory()) {
        routes = routes.concat(await findRouteFiles(filePath));
      } else if (file === 'route.js') {
        // Handle root route.js specially
        if (filePath === join(__dirname, 'route.js')) {
          routes.unshift(filePath); // Add to beginning of array
        } else {
          routes.push(filePath);
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return routes;
}

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  // Normalize for Windows (backslash -> forward slash)
  const normDir = __dirname.replace(/\\/g, '/');
  const normFile = routeFile.replace(/\\/g, '/');
  const relativePath = normFile.replace(normDir, '').replace(/^\//, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

// Import and register all routes
async function registerRoutes() {
  const routeFiles = (
    await findRouteFiles(__dirname).catch((error) => {
      console.error('Error finding route files:', error);
      return [];
    })
  )
    .slice()
    .sort((a, b) => {
      return b.length - a.length;
    });

  // Clear existing routes
  api.routes = [];
  console.log(`[RouteBuilder] Loading ${routeFiles.length} route files from ${__dirname}`);

  for (const routeFile of routeFiles) {
    try {
      // Use pathToFileURL for Windows compatibility (Node ESM requires file:// URLs)
      const importUrl = pathToFileURL(routeFile).href + '?update=' + Date.now();
      const route = await import(/* @vite-ignore */ importUrl);

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const method of methods) {
        try {
          if (route[method]) {
            const parts = getHonoPath(routeFile);
            const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
            const needsAuth = !honoPath.includes('/auth/') && honoPath !== '/' && honoPath !== '';
            const handler: Handler = async (c) => {
              if (import.meta.env.DEV) {
                const updatedUrl = pathToFileURL(routeFile).href + '?update=' + Date.now();
                const updatedRoute = await import(/* @vite-ignore */ updatedUrl);
                return await updatedRoute[method](c);
              }
              return await route[method](c);
            };
            const methodLowercase = method.toLowerCase();
            // Use session auth middleware (supports both Auth.js session cookies and JWT bearer tokens)
            const finalHandler = needsAuth ? [sessionAuthMiddleware, handler] : [handler];
            switch (methodLowercase) {
              case 'get':
                api.get(honoPath, ...finalHandler);
                break;
              case 'post':
                api.post(honoPath, ...finalHandler);
                break;
              case 'put':
                api.put(honoPath, ...finalHandler);
                break;
              case 'delete':
                api.delete(honoPath, ...finalHandler);
                break;
              case 'patch':
                api.patch(honoPath, ...finalHandler);
                break;
              default:
                console.warn(`Unsupported method: ${method}`);
                break;
            }
          }
        } catch (error) {
          console.error(`Error registering route ${routeFile} for method ${method}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error importing route file ${routeFile}:`, error);
    }
  }
  // 404 for API sub-app: always return JSON (never HTML)
  api.notFound((c) => c.json({ error: 'API endpoint not found', path: c.req.path }, 404));
  console.log(`[RouteBuilder] Registered ${api.routes.length} routes`);
}

// Initial route registration
await registerRoutes();

// Hot reload routes in development
if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
  import.meta.glob?.('../src/app/api/**/route.js', {
    eager: true,
  });
  if (import.meta.hot) {
    import.meta.hot.accept((newSelf) => {
      registerRoutes().catch((err) => {
        console.error('Error reloading routes:', err);
      });
    });
  }
}

export { api, API_BASENAME };
