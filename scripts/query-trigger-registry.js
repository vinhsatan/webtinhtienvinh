import pkg from 'pg';
import { lookup } from 'dns/promises';
const { Pool } = pkg;

(async ()=>{
  try {
    const conn = process.env.PG_CONN || process.env.DB_CONN;
    if(!conn){
      console.error('PG_CONN/DB_CONN not set');
      process.exit(2);
    }

    // Simulation mode for testing error-flow without a real DB
    if (process.argv.includes('--simulate')) {
      console.log('SIMULATION: returning fake schema and rows');
      console.log('COLUMNS:', JSON.stringify([
        { column_name: 'id', data_type: 'uuid', udt_name: 'uuid' },
        { column_name: 'name', data_type: 'text', udt_name: 'text' },
        { column_name: 'source', data_type: 'jsonb', udt_name: 'jsonb' }
      ], null, 2));
      console.log('ROWS:', JSON.stringify([{ id: '00000000-0000-0000-0000-000000000000', name: 'SIMULATED', source: {} }], null, 2));
      process.exit(0);
    }

    // DNS pre-check: parse host from connection string and verify resolution
    try {
      const u = new URL(conn);
      const host = u.hostname;
      if (!host) {
        console.error('Unable to parse host from connection string.');
        process.exit(2);
      }
      // common placeholder detection
      if (host === 'host' || host.endsWith('.example.com')) {
        console.error(`Connection string host looks like a placeholder: "${host}". Replace with your real DB host.`);
        process.exit(2);
      }
      try {
        await lookup(host);
      } catch (err) {
        console.error(`DNS lookup failed for host "${host}": ${err.code || err.message}`);
        console.error('Tip: verify DNS or use an IP address.');
        process.exit(2);
      }
    } catch (err) {
      console.error('Failed to parse connection string URL:', err.message || err);
      process.exit(2);
    }
    // Robust query with retries and exponential backoff
    const maxAttempts = 5;
    const backoff = (attempt) => Math.min(500 * 2 ** (attempt - 1), 5000);

    async function runQueriesWithRetries(connectionString) {
      let lastErr;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const pool = new Pool({ connectionString });
          const cols = await pool.query("SELECT column_name,data_type,udt_name FROM information_schema.columns WHERE table_name='trigger_registry' ORDER BY ordinal_position");
          console.log('COLUMNS:', JSON.stringify(cols.rows, null, 2));
          const res = await pool.query('SELECT * FROM trigger_registry LIMIT 5');
          console.log('ROWS:', JSON.stringify(res.rows, null, 2));
          await pool.end();
          return;
        } catch (e) {
          lastErr = e;
          const code = e.code || e.name || e.message;
          console.error(`Attempt ${attempt}/${maxAttempts} failed:`, code);
          if (attempt < maxAttempts) {
            const wait = backoff(attempt);
            console.error(`Waiting ${wait}ms before retrying...`);
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }
          // final attempt failed
          throw lastErr;
        }
      }
    }

    await runQueriesWithRetries(conn);
  } catch (e) {
    // Better error presentation for troubleshooting
    if (e && e.code === 'ENOTFOUND') {
      console.error('ERROR: DNS lookup failed for DB host. Check your connection string host.');
    }
    console.error('ERROR:', e && (e.stack || e.message) || e);
    process.exit(1);
  }
})();
