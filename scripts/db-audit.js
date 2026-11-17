import { query } from '../server/db.js';

async function auditDatabase() {
  console.log('=== DATABASE DEEP AUDIT ===\n');

  // 1. Tables and Row Counts
  const tablesRes = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('--- Tables & Row Counts ---');
  for (const row of tablesRes.rows) {
    const countRes = await query(`SELECT COUNT(*) FROM "${row.table_name}"`);
    console.log(`Table: ${row.table_name.padEnd(20)} | Rows: ${countRes.rows[0].count}`);
  }

  // 2. Constraints & Foreign Keys
  console.log('\n--- Foreign Keys & Constraints ---');
  const fkRes = await query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      tc.constraint_type,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema='public'
    ORDER BY tc.table_name, tc.constraint_type;
  `);

  for (const c of fkRes.rows) {
    console.log(`${c.table_name.padEnd(16)} | ${c.constraint_type.padEnd(12)} | Column: ${(c.column_name || '').padEnd(15)} | Ref: ${c.foreign_table_name || 'N/A'}.${c.foreign_column_name || ''}`);
  }

  // 3. Check for any duplicate records or data anomalies
  console.log('\n--- Data Quality Checks ---');
  const dupFarmerRes = await query(`SELECT mobile, COUNT(*) FROM farmers GROUP BY mobile HAVING COUNT(*) > 1`);
  console.log(`Duplicate farmers by mobile: ${dupFarmerRes.rows.length}`);

  const dupOwnerRes = await query(`SELECT mobile, COUNT(*) FROM vehicle_owners GROUP BY mobile HAVING COUNT(*) > 1`);
  console.log(`Duplicate owners by mobile: ${dupOwnerRes.rows.length}`);

  const nullCodeBookings = await query(`SELECT COUNT(*) FROM bookings WHERE booking_code IS NULL`);
  console.log(`Bookings missing booking_code: ${nullCodeBookings.rows[0].count}`);

  const invalidStatusBookings = await query(`SELECT status, COUNT(*) FROM bookings GROUP BY status`);
  console.log('Bookings status breakdown:', invalidStatusBookings.rows);

  process.exit(0);
}

auditDatabase().catch(err => {
  console.error('Audit DB error:', err);
  process.exit(1);
});

