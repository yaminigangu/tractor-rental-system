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

// 1. Seed Farmers
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

// 2. Seed Vehicle Owners
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

// 3. Seed 20 Core Agricultural Machinery & Tractors
const DEFAULT_TRACTORS = [
  {
    id: 1,
    brand: "Mahindra",
    model: "475 DI XP Plus (44 HP)",
    hp: "44 HP",
    equipment: "Ploughing, Rotavator, Cultivator",
    pricing: 1200,
    photo: "/tractor1.jpeg",
    rating: 4.9,
    jobs_done: 34,
    default_owner: "Ramesh Kumar",
    default_mobile: "9876543210",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 0.8
  },
  {
    id: 2,
    brand: "Mahindra",
    model: "575 DI Sarpanch (47 HP)",
    hp: "47 HP",
    equipment: "Ploughing, Cultivator, Trailer Services",
    pricing: 1250,
    photo: "/images/mahindra_575.jpg",
    rating: 4.8,
    jobs_done: 28,
    default_owner: "Sailu Yadav",
    default_mobile: "9032004060",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 1.2
  },
  {
    id: 3,
    brand: "John Deere",
    model: "5075E 4WD (75 HP Heavy)",
    hp: "75 HP",
    equipment: "Ploughing, Rotavator, Heavy Tillage, Laser Leveler",
    pricing: 1500,
    photo: "/tractor3.jpeg",
    rating: 5.0,
    jobs_done: 42,
    default_owner: "Rajesh Goud",
    default_mobile: "9440123456",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 1.9
  },
  {
    id: 4,
    brand: "Swaraj",
    model: "744 FE XT (48 HP)",
    hp: "48 HP",
    equipment: "Rotavator, Cultivator, Trailer Services",
    pricing: 1100,
    photo: "/tractor4.jpeg",
    rating: 4.7,
    jobs_done: 19,
    default_owner: "Mallesh Reddy",
    default_mobile: "9123456780",
    village: "Velair",
    district: "Hanamkonda",
    distance_km: 4.8
  },
  {
    id: 5,
    brand: "Massey Ferguson",
    model: "241 DI Maha Shakti (42 HP)",
    hp: "42 HP",
    equipment: "Ploughing, Disc Harrow, Cultivator",
    pricing: 1150,
    photo: "/tractor5.jpeg",
    rating: 4.9,
    jobs_done: 31,
    default_owner: "Kishan Rao",
    default_mobile: "9849123450",
    village: "Bhimaram",
    district: "Hanamkonda",
    distance_km: 6.5
  },
  {
    id: 6,
    brand: "Sonalika",
    model: "DI 745 III Sikander (50 HP)",
    hp: "50 HP",
    equipment: "Rotavator, Heavy Tillage, Cultivator",
    pricing: 1300,
    photo: "/tractor6.jpeg",
    rating: 4.8,
    jobs_done: 24,
    default_owner: "Srinivas Chary",
    default_mobile: "9908123456",
    village: "Kazipet",
    district: "Hanamkonda",
    distance_km: 8.2
  },
  {
    id: 7,
    brand: "Kubota",
    model: "MU4501 4WD (Paddy Specialist)",
    hp: "45 HP",
    equipment: "Cage Wheels Puddling, Rotavator, Wet Land Ploughing",
    pricing: 1400,
    photo: "/tractor7.jpeg",
    rating: 5.0,
    jobs_done: 45,
    default_owner: "Thirupathi Goud",
    default_mobile: "9701123456",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 1.5
  },
  {
    id: 8,
    brand: "Swaraj",
    model: "735 FE (40 HP Economical)",
    hp: "40 HP",
    equipment: "Ploughing, Cultivator, Trolley Hauling",
    pricing: 1050,
    photo: "/tractor8.jpg",
    rating: 4.8,
    jobs_done: 22,
    default_owner: "Prabhakar Reddy",
    default_mobile: "9490123789",
    village: "Dharmasagar",
    district: "Hanamkonda",
    distance_km: 11.0
  },
  {
    id: 9,
    brand: "Mahindra",
    model: "Arjun 605 DI DLX (60 HP with Trailer)",
    hp: "60 HP",
    equipment: "Trailer Services, Heavy Haulage, Agricultural Logistics, Ploughing",
    pricing: 1350,
    photo: "/tractor9.jpg",
    rating: 4.9,
    jobs_done: 38,
    default_owner: "Devender Varma",
    default_mobile: "9866123456",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 2.1
  },
  {
    id: 10,
    brand: "Farmtrac",
    model: "60 Powermaxx (55 HP Tillage Master)",
    hp: "55 HP",
    equipment: "Heavy Ploughing, Soil Tillage, Rotavator, Disc Harrow",
    pricing: 1300,
    photo: "/farmtrac_60.jpg",
    rating: 4.8,
    jobs_done: 29,
    default_owner: "Bikshapathi Nayak",
    default_mobile: "9949123456",
    village: "Elkathurthy",
    district: "Hanamkonda",
    distance_km: 5.5
  },
  {
    id: 11,
    brand: "John Deere",
    model: "5310 GearPro (55 HP Heavy Duty)",
    hp: "55 HP",
    equipment: "Laser Leveling, Heavy Ploughing, Rotavator, Subsoiler",
    pricing: 1450,
    photo: "/images/john_deere_5310.jpg",
    rating: 4.9,
    jobs_done: 36,
    default_owner: "Anjaiah Yadav",
    default_mobile: "9848556677",
    village: "Kamalapur",
    district: "Hanamkonda",
    distance_km: 7.8
  },
  {
    id: 12,
    brand: "Sonalika",
    model: "Tiger DI 55 (55 HP Heavy Cultivator)",
    hp: "55 HP",
    equipment: "Deep Ploughing, Cultivator, Heavy Field Preparation",
    pricing: 1350,
    photo: "/sonalika_tiger_55.jpg",
    rating: 5.0,
    jobs_done: 51,
    default_owner: "Maheshwar Rao",
    default_mobile: "9000123987",
    village: "Inavolu",
    district: "Hanamkonda",
    distance_km: 9.8
  },
  {
    id: 13,
    brand: "New Holland",
    model: "3630 TX Super Plus (55 HP 4WD)",
    hp: "55 HP",
    equipment: "Subsoiler, Heavy Disc Harrow, Rotavator, Trailer Services",
    pricing: 1400,
    photo: "/new_holland_3630.jpg",
    rating: 4.8,
    jobs_done: 26,
    default_owner: "Venkataiah Goud",
    default_mobile: "9848112233",
    village: "Parkal",
    district: "Hanamkonda",
    distance_km: 13.5
  },
  {
    id: 14,
    brand: "Eicher",
    model: "380 Super DI (40 HP Precision Sowing)",
    hp: "40 HP",
    equipment: "Ploughing, Trailer Services, Rotavator, Ridger",
    pricing: 1100,
    photo: "/eicher_380_clean.jpg",
    rating: 4.9,
    jobs_done: 33,
    default_owner: "Ravi Shankar",
    default_mobile: "9988776655",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 1.0
  },
  {
    id: 15,
    brand: "Kartar",
    model: "4000 Maize Combine Harvester (Corn Machine)",
    hp: "101 HP Combine",
    equipment: "Corn Harvester, Combine Harvester, Corn Harvesting, Cobs Separation, Grain Threshing",
    pricing: 2400,
    photo: "/corn_harvester.jpg",
    rating: 4.9,
    jobs_done: 42,
    default_owner: "Bhadraiah Goud",
    default_mobile: "9849234567",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 3.2
  },
  {
    id: 16,
    brand: "Redlands",
    model: "Round Straw Baler JRB-312 (Tractor Driven)",
    hp: "45 HP PTO Driven",
    equipment: "Straw Baler, Round Baler, Straw Baling, Paddy Residue Bundling",
    pricing: 1100,
    photo: "/straw_baler.jpg",
    rating: 4.8,
    jobs_done: 37,
    default_owner: "Srinivas Reddy",
    default_mobile: "9948123890",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 3.8
  },
  {
    id: 17,
    brand: "Kisan Tools",
    model: "Hand Push Corn Seeder & Precision Planter",
    hp: "Manual Precision Planter",
    equipment: "Corn Seeder, Hand Push Seeder, Seed Planter, Corn Seeding, Fertilizer Dispensing",
    pricing: 350,
    photo: "/corn_seeder.jpg",
    rating: 4.9,
    jobs_done: 56,
    default_owner: "Laxminarayana",
    default_mobile: "9848551234",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 0.5
  },
  {
    id: 18,
    brand: "Preet",
    model: "987 Multi-Crop Combine Harvester (Paddy & Corn)",
    hp: "101 HP Combine",
    equipment: "Corn Harvester, Combine Harvester, Paddy Harvesting, Grain Thresher",
    pricing: 2500,
    photo: "/images/preet_combine_harvester.jpg",
    rating: 4.9,
    jobs_done: 39,
    default_owner: "Ch. Thirupathi Reddy",
    default_mobile: "9989044123",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 2.8
  },
  {
    id: 19,
    brand: "Claas",
    model: "Crop Tiger 40 Terra Trac (Rubber Track Combine)",
    hp: "76 HP Combine",
    equipment: "Corn Harvester, Combine Harvester, Wetland Paddy Harvesting, Track Harvester",
    pricing: 2800,
    photo: "/images/claas_combine_harvester.jpg",
    rating: 5.0,
    jobs_done: 54,
    default_owner: "V. Lingaiah Yadav",
    default_mobile: "9701478901",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 3.6
  },
  {
    id: 20,
    brand: "John Deere",
    model: "W70 Grain Master Combine Harvester (4WD)",
    hp: "100 HP Combine",
    equipment: "Corn Harvester, Combine Harvester, Maize Harvesting, Grain Tank Unloader",
    pricing: 2600,
    photo: "/images/johndeere_combine_harvester.jpg",
    rating: 4.9,
    jobs_done: 47,
    default_owner: "M. Bhaskar Reddy",
    default_mobile: "9440556677",
    village: "Hasanparthy",
    district: "Hanamkonda",
    distance_km: 4.2
  }
];

// 4. Sample Seed Bookings
const DEFAULT_BOOKINGS = [
  {
    id: 1730000001,
    farmer_name: "Kondal Rao",
    farmer_mobile: "9848022334",
    farmer_village: "Hasanparthy",
    tractor_id: 2,
    tractor_model: "Mahindra 575 DI Sarpanch",
    tractor_owner: "Sailu Yadav",
    work_type: "Ploughing",
    land_area: 3.5,
    booking_date: "2026-11-05",
    booking_time: "06:30 AM",
    duration_hours: 5,
    estimated_cost: 6250,
    status: "Confirmed",
    remarks: "Morning early start for deep red soil ploughing"
  },
  {
    id: 1730000002,
    farmer_name: "Venkat Swamy",
    farmer_mobile: "9989011223",
    farmer_village: "Velair",
    tractor_id: 4,
    tractor_model: "Swaraj 744 FE XT",
    tractor_owner: "Mallesh Reddy",
    work_type: "Rotavator",
    land_area: 2.0,
    booking_date: "2026-11-06",
    booking_time: "07:00 AM",
    duration_hours: 4,
    estimated_cost: 4400,
    status: "Pending Approval",
    remarks: "Seedbed preparation for maize crop"
  }
];

async function initializeDatabase() {
  console.log('🔄 Connecting to PostgreSQL Server at', `${config.host}:${config.port}...`);

  // Step 1: Connect to maintenance database 'postgres' to verify targetDb
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
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // Step 2: Connect directly to targetDb and run schema
  const dbClient = new Client({ ...config, database: targetDb });
  try {
    await dbClient.connect();
    console.log(`✅ Connected to target database "${targetDb}".`);

    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
    await dbClient.query(schemaSql);
    console.log('✅ Schema tables (farmers, vehicle_owners, tractors, bookings) verified/created.');

    // Step 3: Seed initial farmers
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
      console.log(`✅ Seeded ${DEFAULT_FARMERS.length} default farmers.`);
    }

    // Step 4: Seed initial owners
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
      console.log(`✅ Seeded ${DEFAULT_OWNERS.length} default vehicle owners.`);
    }

    // Step 5: Seed 20 core tractors
    const tractorCount = await dbClient.query('SELECT count(*) FROM tractors');
    if (parseInt(tractorCount.rows[0].count, 10) === 0) {
      console.log('🚜 Seeding 20 base tractors and harvesters into PostgreSQL...');
      for (const t of DEFAULT_TRACTORS) {
        await dbClient.query(
          `INSERT INTO tractors (id, brand, model, hp, equipment, pricing, photo, rating, jobs_done, default_owner, default_mobile, village, district, distance_km)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             brand = EXCLUDED.brand,
             model = EXCLUDED.model,
             pricing = EXCLUDED.pricing,
             equipment = EXCLUDED.equipment;`,
          [t.id, t.brand, t.model, t.hp, t.equipment, t.pricing, t.photo, t.rating, t.jobs_done, t.default_owner, t.default_mobile, t.village, t.district, t.distance_km]
        );
      }
      console.log(`✅ Seeded ${DEFAULT_TRACTORS.length} tractors in database.`);
    }

    // Step 6: Seed sample bookings
    const bookingCount = await dbClient.query('SELECT count(*) FROM bookings');
    if (parseInt(bookingCount.rows[0].count, 10) === 0) {
      console.log('📋 Seeding sample booking work orders into PostgreSQL...');
      for (const b of DEFAULT_BOOKINGS) {
        await dbClient.query(
          `INSERT INTO bookings (id, farmer_name, farmer_mobile, farmer_village, tractor_id, tractor_model, tractor_owner, work_type, land_area, booking_date, booking_time, duration_hours, estimated_cost, status, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO NOTHING;`,
          [b.id, b.farmer_name, b.farmer_mobile, b.farmer_village, b.tractor_id, b.tractor_model, b.tractor_owner, b.work_type, b.land_area, b.booking_date, b.booking_time, b.duration_hours, b.estimated_cost, b.status, b.remarks]
        );
      }
      console.log(`✅ Seeded ${DEFAULT_BOOKINGS.length} sample bookings.`);
    }

    console.log('\n🎉 PostgreSQL database initialization complete!');
    console.log(`   Database: "${targetDb}"`);
    console.log('   All tables (farmers, vehicle_owners, tractors, bookings) are ready for REST APIs!\n');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  } finally {
    await dbClient.end();
  }
}

initializeDatabase();
