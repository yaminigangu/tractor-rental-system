import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const targetDb = process.env.DB_NAME || 'tractor_rental_db';

// Seed Data
const DEFAULT_FARMERS = [
  {
    name: "Kondal Rao",
    mobile: "9848022334",
    village: "Hasanparthy",
    district: "Hanamkonda",
    land_area: 3.0,
    crops: ["Paddy", "Cotton"],
    passbook_no: "TS-WGL-98234",
    is_verified: true,
    registered_at: "2026-01-15"
  },
  {
    name: "Venkat Swamy",
    mobile: "9989011223",
    village: "Velair",
    district: "Hanamkonda",
    land_area: 2.5,
    crops: ["Maize", "Chilli"],
    passbook_no: "TS-WGL-44102",
    is_verified: true,
    registered_at: "2026-02-10"
  },
  {
    name: "Laxminarayana",
    mobile: "9848552134",
    village: "Pidicolla",
    district: "Jayashankar Bhupalpally",
    land_area: 4.0,
    crops: ["Cotton", "Maize"],
    passbook_no: "TS-JBP-77812",
    is_verified: true,
    registered_at: "2026-03-01"
  }
];

const DEFAULT_OWNERS = [
  {
    full_name: "Ramesh Kumar",
    mobile: "9876543210",
    dob: "1988-06-15",
    gender: "Male",
    vehicle_type: "Tractor",
    tractor_model: "Mahindra 575 DI XP Plus",
    vehicle_number: "TS 04 AB 7890",
    pricing: 1200,
    village: "Hasanparthy",
    district: "Hanamkonda",
    dl_number: "DL-0420120045612",
    rc_number: "TS04AB7890",
    is_verified: true,
    registered_at: "2026-01-10"
  },
  {
    full_name: "Mallesh Reddy",
    mobile: "9123456780",
    dob: "1985-03-22",
    gender: "Male",
    vehicle_type: "Tractor",
    tractor_model: "Swaraj 744 FE XT",
    vehicle_number: "TS 03 CD 4321",
    pricing: 1250,
    village: "Velair",
    district: "Hanamkonda",
    dl_number: "DL-0320150098765",
    rc_number: "TS03CD4321",
    is_verified: true,
    registered_at: "2026-01-20"
  },
  {
    full_name: "Bhadraiah Goud",
    mobile: "9849234567",
    dob: "1980-05-12",
    gender: "Male",
    vehicle_type: "Harvester",
    tractor_model: "Kartar 4000 Maize Combine Harvester",
    vehicle_number: "TS 04 GH 5544",
    pricing: 2400,
    village: "Hasanparthy",
    district: "Hanamkonda",
    dl_number: "DL-0420080011223",
    rc_number: "TS04GH5544",
    is_verified: true,
    registered_at: "2026-02-15"
  }
];

async function initializeDatabase() {
  console.log('🔄 Connecting to PostgreSQL Server at', `${config.host}:${config.port}...`);

  // Step 1: Connect to maintenance database 'postgres' to verify or create targetDb
  const rootClient = new Client({ ...config, database: 'postgres' });
  try {
    await rootClient.connect();
    console.log('✅ Connected to PostgreSQL root server.');

    const checkDb = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (checkDb.rowCount === 0) {
      console.log(`🔨 Database "${targetDb}" does not exist. Creating now...`);
      await rootClient.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`✅ Database "${targetDb}" created successfully!`);
    } else {
      console.log(`ℹ️ Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.code === '28P01') {
      console.log('\n👉 Authentication failed for user "postgres".');
      console.log('   Please open ".env" file in your project and update DB_PASSWORD with the password you chose during PostgreSQL installation.');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('\n👉 Could not connect to PostgreSQL server on port 5432.');
      console.log('   Please make sure the PostgreSQL service is running (in Windows Services or pgAdmin).');
    }
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect directly to tractor_rental_db and run schema
  const dbClient = new Client({ ...config, database: targetDb });
  try {
    await dbClient.connect();
    console.log(`✅ Connected to target database "${targetDb}".`);

    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
    await dbClient.query(schemaSql);
    console.log('✅ Schema tables (farmers, vehicle_owners, bookings, tractors) verified/created.');

    // Step 3: Seed initial default farmers if table empty
    const farmerCount = await dbClient.query('SELECT count(*) FROM farmers');
    if (parseInt(farmerCount.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial farmers into PostgreSQL...');
      for (const f of DEFAULT_FARMERS) {
        await dbClient.query(
          `INSERT INTO farmers (name, mobile, village, district, land_area, crops, passbook_no, is_verified, registered_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (mobile) DO NOTHING;`,
          [f.name, f.mobile, f.village, f.district, f.land_area, f.crops, f.passbook_no, f.is_verified, f.registered_at]
        );
      }
      console.log('✅ Seeded 3 default farmers.');
    }

    // Step 4: Seed initial default owners if table empty
    const ownerCount = await dbClient.query('SELECT count(*) FROM vehicle_owners');
    if (parseInt(ownerCount.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial vehicle owners into PostgreSQL...');
      for (const o of DEFAULT_OWNERS) {
        await dbClient.query(
          `INSERT INTO vehicle_owners (full_name, mobile, dob, gender, vehicle_type, tractor_model, vehicle_number, pricing, village, district, dl_number, rc_number, is_verified, registered_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (mobile) DO NOTHING;`,
          [o.full_name, o.mobile, o.dob, o.gender, o.vehicle_type, o.tractor_model, o.vehicle_number, o.pricing, o.village, o.district, o.dl_number, o.rc_number, o.is_verified, o.registered_at]
        );
      }
      console.log('✅ Seeded 3 default vehicle owners.');
    }

    console.log('\n🎉 PostgreSQL database initialization complete!');
    console.log(`   You can now open pgAdmin 4, connect to "${targetDb}", and run:`);
    console.log('   SELECT * FROM farmers;');
    console.log('   SELECT * FROM vehicle_owners;\n');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  } finally {
    await dbClient.end();
  }
}

initializeDatabase();

