import * as trgDB from '../control/triggerRegistry.db';
import { appendAudit } from '../audit/auditService';
import * as orchestrator from '../orchestrator/orchestratorService';

export type RepairTask = {
  triggerId: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
};

export async function detectDiscrepancyForTrigger(trigger: any): Promise<RepairTask | null> {
  // Placeholder detection logic. Replace with real ledger queries.
  if (trigger.name && trigger.name.includes('low_stock')) {
    return {
      triggerId: trigger.id,
      issue: 'inventory below threshold',
      severity: 'medium',
      suggestedAction: 'create-reorder',
    };
  }
  return null;
}

export async function runReconcilerWindow() {
  const triggers = await trgDB.listTriggers();
  const repairs: RepairTask[] = [];
  for (const t of triggers) {
    const d = await detectDiscrepancyForTrigger(t);
    if (d) {
      repairs.push(d);
      await appendAudit({ action: 'reconciler.detect', triggerId: t.id, issue: d.issue, severity: d.severity });
      // For non-critical issues we may auto-schedule a repair workflow (placeholder)
      if (d.severity !== 'high') {
        try {
          // Start a repair workflow with orchestrator; this is a best-effort call
          await orchestrator.startTriggerById(t.id, { args: { repair: d } });
          await appendAudit({ action: 'reconciler.repair.scheduled', triggerId: t.id, repair: d });
        } catch (e) {
          await appendAudit({ action: 'reconciler.repair.schedule.failed', triggerId: t.id, error: String(e) });
        }
      } else {
        // High severity: require human review — emit audit record only
        await appendAudit({ action: 'reconciler.repair.required', triggerId: t.id, repair: d });
      }
    }
  }
  return repairs;
}

export default { detectDiscrepancyForTrigger, runReconcilerWindow };
// Reconciler - Node/TS example (pseudo)
// Reads event store, recomputes balances, compares with ledger snapshots, and emits repair tasks.

import { Client } from 'pg';

const DB = new Client({ connectionString: process.env.DB_CONN });

async function deriveBalances(tenantId: string, from: string, to: string) {
  const q = `
    SELECT wallet_id, SUM(CASE WHEN type='debit' THEN amount ELSE -amount END) AS balance
    FROM journal_entries
    WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
    GROUP BY wallet_id
  `;
  const res = await DB.query(q, [tenantId, from, to]);
  return res.rows;
}

async function getCurrentWallets(tenantId: string) {
  const res = await DB.query('SELECT id as wallet_id, balance_real FROM wallets WHERE tenant_id = $1', [tenantId]);
  return res.rows;
}

export async function runReconciliation(tenantId: string, from: string, to: string) {
  await DB.connect();
  try {
    const derived = await deriveBalances(tenantId, from, to);
    const current = await getCurrentWallets(tenantId);
    const currentMap = new Map(current.map((r: any) => [r.wallet_id, Number(r.balance_real)]));

    const diffs: any[] = [];
    for (const row of derived) {
      const expected = Number(row.balance);
      const actual = currentMap.get(row.wallet_id) ?? 0;
      const delta = actual - expected;
      if (Math.abs(delta) > 0.01) {
        diffs.push({ wallet_id: row.wallet_id, expected, actual, delta });
      }
    }

    // Emit diffs (placeholder: log or push to repair queue)
    if (diffs.length) {
      console.warn('Reconciliation diffs found', diffs);
      // create repair workflow per diff (requires approvals for critical)
    }

    return diffs;
  } finally {
    await DB.end();
  }
}

// Example invocation:
// runReconciliation('tenant_1', '2026-02-08T00:00:00Z', '2026-02-09T00:00:00Z');
