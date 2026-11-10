import { query } from '../server/db.js';

async function migrate() {
  try {
    await query(`
      ALTER TABLE farmers ADD COLUMN IF NOT EXISTS mandal VARCHAR(100);
      ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_photo TEXT;
      ALTER TABLE vehicle_owners ADD COLUMN IF NOT EXISTS mandal VARCHAR(100);
      ALTER TABLE vehicle_owners ADD COLUMN IF NOT EXISTS profile_photo TEXT;
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS mobile VARCHAR(30);
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS district VARCHAR(100);
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS mandal VARCHAR(100);
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS profile_photo TEXT;
    `);
    console.log('Profile columns migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
