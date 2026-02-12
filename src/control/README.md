Trigger Registry

This module provides a minimal file-backed Trigger Registry for automation triggers.

Location: `src/control/triggerRegistry.ts`

API:
- `listTriggers()`
- `getTrigger(id)`
- `createTrigger(payload)`
- `updateTrigger(id, patch)`
- `deleteTrigger(id)`
- `validateTrigger(payload)`

Usage example:

```js
import triggerRegistry from '../src/control/triggerRegistry.js';

const t = triggerRegistry.createTrigger({ name: 'daily-reconcile', owner: 'platform/finance', type: 'cron', spec: { cron: '0 0 * * *' }, safety_level: 'high' });
console.log('created', t);
```

Notes:
- This implementation is intentionally minimal for scaffolding. Replace with a DB-backed API and proper authentication for production.
