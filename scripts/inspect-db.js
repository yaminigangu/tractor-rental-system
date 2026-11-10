import { query } from '../server/db.js';

async function run() {
  const f = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'farmers'");
  console.log('farmers:', f.rows.map(x => x.column_name));
  const o = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicle_owners'");
  console.log('vehicle_owners:', o.rows.map(x => x.column_name));
  
  const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('all tables:', tables.rows.map(x => x.table_name));
  process.exit(0);
}

run();

