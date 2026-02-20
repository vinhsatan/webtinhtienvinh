import { getPool, endPool } from './db-pool.js';

(async ()=>{
  try {
    const pool = getPool();
    const res = await pool.query('SELECT id,name,source FROM trigger_registry WHERE deleted_at IS NULL');
    const triggers = res.rows;
    const findings = [];
    for (const t of triggers) {
      // simple detection: low_stock name indicates inventory issue
      if (t.name && t.name.includes('low_stock')) {
        findings.push({ triggerId: t.id, issue: 'inventory below threshold', severity: 'medium' });
      }
    }
    console.log('RECONCILER FINDINGS:', JSON.stringify(findings, null, 2));
    await endPool();
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e && (e.stack || e.message) || e);
    process.exit(1);
  }
})();
// Wrapper to run reconciler
import { runReconciliation } from '../src/reconciler/reconciler.js';

const tenant = process.env.RECONCILE_TENANT || 'tenant_1';
const from = process.env.RECONCILE_FROM || new Date(Date.now() - 24*3600*1000).toISOString();
const to = process.env.RECONCILE_TO || new Date().toISOString();

runReconciliation(tenant, from, to).then(diffs => {
  if (diffs.length) {
    console.warn('Reconciliation produced diffs:', diffs);
    process.exit(2);
  }
  console.log('Reconciliation complete: no diffs');
  process.exit(0);
}).catch(err => {
  console.error('Reconciliation failed', err);
  process.exit(3);
});
