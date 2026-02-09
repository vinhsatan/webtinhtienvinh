import type { Pool } from 'pg';

declare global {
  var dbPool: Pool | undefined;
  var broadcastToUser: ((userId: string, message: unknown) => void) | undefined;
}

declare module 'hono' {
  interface ContextVariableMap {
    user?: { userId: string; email: string };
    pool?: import('pg').Pool;
    broadcastToUser?: (userId: string, message: unknown) => void;
  }
}

import 'react-router';
module 'virtual:load-fonts.jsx' {
	export function LoadFonts(): null;
}
declare module 'react-router' {
	interface AppLoadContext {
		// add context properties here
	}
}
declare module 'npm:stripe' {
	import Stripe from 'stripe';
	export default Stripe;
}
declare module '@auth/create/react' {
	import { SessionProvider } from '@auth/react';
	export { SessionProvider };
}
