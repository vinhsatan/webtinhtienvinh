import pkg from 'pg';
const { Pool } = pkg;

(async ()=>{
  try {
    const conn = process.env.PG_CONN || process.env.DB_CONN;
    if(!conn){
      console.error('PG_CONN/DB_CONN not set');
      process.exit(2);
    }
    const pool = new Pool({connectionString: conn});

    const samples = [
      { name: 'orders.created', description: 'Order created webhook', source: { type: 'webhook', owner: 'sales', safety_level: 'low' }, enabled: true },
      { name: 'payments.refund_requested', description: 'Refund requested', source: { type: 'webhook', owner: 'finance', safety_level: 'high' }, enabled: false },
      { name: 'inventory.low_stock', description: 'Low stock alert', source: { type: 'cron', owner: 'ops', safety_level: 'medium' }, enabled: true }
    ];

    for (const s of samples) {
      const exists = await pool.query('SELECT 1 FROM trigger_registry WHERE name = $1 LIMIT 1', [s.name]);
      if (exists.rowCount > 0) {
        console.log('Skipping existing trigger:', s.name);
        continue;
      }
      const inserted = await pool.query(
        'INSERT INTO trigger_registry (name, description, source, enabled) VALUES ($1, $2, $3::jsonb, $4) RETURNING *',
        [s.name, s.description, JSON.stringify(s.source), s.enabled]
      );
      console.log('Inserted:', inserted.rows[0]);
    }

    await pool.end();
    console.log('Seed complete');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.stack || e.message || e);
    process.exit(1);
  }
})();
