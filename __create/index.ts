import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool } from 'pg';
import { hash, verify } from 'argon2';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';
import { initializeVault, getDatabaseUrlFromVault } from './vault-secrets';
import { registerHandler, loginHandler, verifyPasswordHandler } from './auth-routes';
import { getAllUsersHandler, deleteUserHandler, updateUserHandler, isProtectedHandler, changePasswordHandler, resetUserDataHandler } from './admin-routes';
import { jwtAuthMiddleware } from './jwt-middleware';
import { broadcastToUser } from './websocket-server';
import jwtLib from 'jsonwebtoken';

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

// Initialize Vault and get secrets (fail-fast if Vault is unreachable)
let pool: Pool;
let databaseUrl: string;

// Run all migrations in sequence
async function runMigrations(pool: Pool) {
  try {
    const migrationsDir = join(process.cwd(), 'database', 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const sql = await readFile(filePath, 'utf-8');
      
      // Skip empty files
      if (!sql.trim()) continue;

      try {
        await pool.query(sql);
        console.log(`[Migration] ✅ ${file}`);
      } catch (err: any) {
        // Log errors but continue - allow app to start
        console.warn(`[Migration] ⚠️  ${file}: ${err.message}`);
        // Only stop on critical errors (connection issues)
        if (err.code && err.code.includes('ECONNREFUSED')) {
          throw err;
        }
      }
    }
    console.log('[Startup] Migrations completed');
  } catch (error) {
    console.error('[Startup] CRITICAL: Migration failed:', error);
    throw error;
  }
}

async function initializeServices() {
  try {
    console.log('[Startup] Initializing Vault connection...');
    await initializeVault();
    databaseUrl = getDatabaseUrlFromVault();
    console.log('[Startup] Vault initialized successfully');
    
    // Create database pool with Vault credentials
    // Parse connection string for pg Pool
    const url = new URL(databaseUrl.replace('postgresql://', 'http://'));
    pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1), // Remove leading '/'
      user: url.username,
      password: url.password,
    });
    
    // Test database connection
    await pool.query('SELECT 1');
    console.log('[Startup] Database connection established');

    // Run migrations - log errors but don't crash
    try {
      await runMigrations(pool);
    } catch (migErr) {
      console.warn('[Startup] Migration error (continuing):', migErr);
    }

    // Expose pool and broadcastToUser for API route handlers
    globalThis.dbPool = pool;
    globalThis.broadcastToUser = broadcastToUser;
  } catch (error) {
    console.error('[Startup] CRITICAL: Failed to initialize services:', error);
    process.exit(1);
  }
}

// Initialize services before starting server
await initializeServices();

const adapter = NeonAdapter(pool!);

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  // API routes always return JSON, even for GET (EventSource expects text/event-stream, not HTML)
  const path = c.req.path;
  if (path.startsWith('/api/') || c.req.header('Accept')?.includes('application/json')) {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

// CORS configuration - allow all origins in development
if (process.env.CORS_ORIGINS) {
  const allowedOrigins = process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  app.use(
    '/*',
    cors({
      origin: (origin) => {
        // Allow all origins in development, or check against allowed list
        if (process.env.NODE_ENV === 'development') {
          return origin || '*';
        }
        return allowedOrigins.includes(origin || '') ? origin : null;
      },
      credentials: true,
    })
  );
} else {
  // Default: allow all in development
  app.use(
    '/*',
    cors({
      origin: '*',
      credentials: true,
    })
  );
}
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024, // 4.5mb to match vercel limit
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

if (process.env.AUTH_SECRET) {
  app.use(
    '*',
    initAuthConfig((c) => ({
      secret: c.env.AUTH_SECRET,
      pages: {
        signIn: '/account/signin',
        signOut: '/account/logout',
      },
      skipCSRFCheck,
      session: {
        strategy: 'jwt',
      },
      callbacks: {
        session({ session, token }) {
          if (token.sub) {
            session.user.id = token.sub;
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        sessionToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        callbackUrl: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
      },
      providers: [
        Credentials({
          id: 'credentials-signin',
          name: 'Credentials Sign in',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            const { email, password } = credentials;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              return null;
            }
            const matchingAccount = user.accounts.find(
              (account) => account.provider === 'credentials'
            );
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              return null;
            }

            const isValid = await verify(accountPassword, password);
            if (!isValid) {
              return null;
            }

            // return user object with the their profile data
            return user;
          },
        }),
        Credentials({
          id: 'credentials-signup',
          name: 'Credentials Sign up',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
            name: { label: 'Name', type: 'text' },
            image: { label: 'Image', type: 'text', required: false },
          },
          authorize: async (credentials) => {
            const { email, password, name, image } = credentials;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              const newUser = await adapter.createUser({
                id: crypto.randomUUID(),
                emailVerified: null,
                email,
                name: typeof name === 'string' && name.length > 0 ? name : undefined,
                image: typeof image === 'string' && image.length > 0 ? image : undefined,
              });
              await adapter.linkAccount({
                extraData: {
                  password: await hash(password),
                },
                type: 'credentials',
                userId: newUser.id,
                providerAccountId: newUser.id,
                provider: 'credentials',
              });
              return newUser;
            }
            return null;
          },
        }),
      ],
    }))
  );
}
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

// Middleware: Chỉ cho phép đăng nhập từ localhost khi RESTRICT_TO_LOCALHOST=true
function isLocalhost(c: { req: { header: (name: string) => string | undefined } }): boolean {
  const forwarded = c.req.header('x-forwarded-for');
  const realIp = c.req.header('x-real-ip');
  const ip = (forwarded?.split(',')[0]?.trim() || realIp || '').toLowerCase();
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === '';
}

app.use('/api/auth/*', async (c, next) => {
  if (process.env.RESTRICT_TO_LOCALHOST === 'true' || process.env.RESTRICT_TO_LOCALHOST === '1') {
    if (!isLocalhost(c)) {
      console.warn('[Auth] Blocked non-localhost request:', c.req.header('x-forwarded-for'), c.req.header('x-real-ip'));
      return c.json(
        { error: 'Đăng nhập tạm thời chỉ cho phép từ localhost. Vui lòng truy cập qua http://localhost' },
        403
      );
    }
  }
  return next();
});

// JWT-based Authentication Routes (Register/Login with bcrypt)
app.post('/api/auth/register', async (c) => {
  return registerHandler(c, pool);
});

app.post('/api/auth/login', async (c) => {
  return loginHandler(c, pool);
});

app.post('/api/auth/verify-password', jwtAuthMiddleware, async (c) => {
  return verifyPasswordHandler(c, pool);
});

// Admin Routes (JWT protected)
app.get('/api/admin/users', jwtAuthMiddleware, async (c) => {
  return getAllUsersHandler(c, pool);
});

app.put('/api/admin/users/:userId', jwtAuthMiddleware, async (c) => {
  return updateUserHandler(c, pool);
});

app.put('/api/admin/users/:userId/password', jwtAuthMiddleware, async (c) => {
  return changePasswordHandler(c, pool);
});

app.post('/api/admin/users/:userId/reset-data', jwtAuthMiddleware, async (c) => {
  return resetUserDataHandler(c, pool);
});

// User self-reset endpoint - user can reset their own data
app.post('/api/user/reset-data', jwtAuthMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = user.userId;

    // Delete all app data for this user
    await pool.query('DELETE FROM products WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM customers WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM debts WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM product_templates WHERE user_id = $1', [userId]);
    
    // Reset wallets to 0
    await pool.query(
      `UPDATE wallets 
       SET cash = 0, bank = 0 
       WHERE user_id = $1`,
      [userId]
    );

    console.log(`[User] Self data reset for user: ${user.email}`);

    return c.json({
      success: true,
      message: 'All your app data has been deleted. Account is still active.',
    });
  } catch (error) {
    console.error('[User] Error resetting data:', error);
    return c.json({ error: 'Failed to reset data' }, 500);
  }
});

app.delete('/api/admin/users/:userId', jwtAuthMiddleware, async (c) => {
  return deleteUserHandler(c, pool);
});

app.get('/api/admin/is-protected', jwtAuthMiddleware, async (c) => {
  return isProtectedHandler(c, pool);
});

// Example protected route using JWT middleware
app.get('/api/protected', jwtAuthMiddleware, async (c) => {
  const user = (c as unknown as { get: (k: string) => { userId: string; email: string } }).get('user');
  return c.json({
    message: 'This is a protected route',
    user,
  });
});

// SSE endpoint for real-time updates (EventSource sends token via query param)
app.get('/api/events', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.json({ error: 'Unauthorized: Token required in query' }, 401);
  }

  let userId: string;
  try {
    const secrets = (await import('./vault-secrets')).getVaultSecrets();
    const jwtSecret = secrets.jwt.secret;
    if (!jwtSecret) {
      return c.json({ error: 'Internal server error: JWT configuration missing' }, 500);
    }
    const decoded = jwtLib.verify(token, jwtSecret) as { userId: string; email: string };
    userId = decoded.userId;
  } catch {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: JSON.stringify({ type: 'connected', userId }),
      event: 'connected',
      id: '1',
    });

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(async () => {
      try {
        await stream.writeSSE({
          data: JSON.stringify({ type: 'ping', ts: Date.now() }),
          event: 'ping',
          id: String(Date.now()),
        });
      } catch {
        clearInterval(pingInterval);
      }
    }, 15000);

    // Wait until connection closes (client disconnects)
    c.req.raw.signal.addEventListener('abort', () => {
      clearInterval(pingInterval);
    });

    // Keep stream open - sleep in a loop until aborted
    while (!c.req.raw.signal.aborted) {
      await stream.sleep(30000);
    }
  });
});

// Middleware: inject pool & broadcastToUser for ALL /api/ requests (path.startsWith is more reliable than /api/* pattern)
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api/')) {
    (c as { set: (k: string, v: unknown) => void }).set('pool', pool!);
    (c as { set: (k: string, v: unknown) => void }).set('broadcastToUser', broadcastToUser);
  }
  return next();
});

// Existing auth routes (for backward compatibility)
app.use('/api/auth/*', async (c, next) => {
  if (isAuthAction(c.req.path)) {
    return authHandler()(c, next);
  }
  return next();
});
app.route(API_BASENAME, api);

export default await createHonoServer({
  app,
  defaultLogger: false,
  ignoredPathPatterns: ['/api/**', '/assets/**', '/build/**'],
});
