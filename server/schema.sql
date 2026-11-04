-- ============================================================
-- AgriRent PostgreSQL Database Schema
-- Run this in pgAdmin 4 Query Tool or automatically via:
-- npm run db:init
-- ============================================================

-- 1. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    village VARCHAR(100) DEFAULT 'Hasanparthy',
    district VARCHAR(100) DEFAULT 'Hanamkonda',
    land_area NUMERIC(5, 2) DEFAULT 3.0,
    crops TEXT[] DEFAULT ARRAY['Paddy', 'Cotton'],
    passbook_no VARCHAR(50),
    is_verified BOOLEAN DEFAULT TRUE,
    registered_at VARCHAR(50) DEFAULT CURRENT_DATE::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicle Owners / Tractor Captains Table
CREATE TABLE IF NOT EXISTS vehicle_owners (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    dob VARCHAR(50),
    gender VARCHAR(20) DEFAULT 'Male',
    referral_code VARCHAR(50),
    vehicle_type VARCHAR(100) DEFAULT 'Tractor',
    tractor_model VARCHAR(150),
    vehicle_number VARCHAR(50),
    pricing INTEGER DEFAULT 1200,
    village VARCHAR(100) DEFAULT 'Hasanparthy',
    district VARCHAR(100) DEFAULT 'Hanamkonda',
    dl_number VARCHAR(100),
    rc_number VARCHAR(100),
    aadhaar_number VARCHAR(50),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(50),
    upi_id VARCHAR(100),
    photo TEXT,
    selfie_photo TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    registered_at VARCHAR(50) DEFAULT CURRENT_DATE::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tractors & Agricultural Machinery Fleet Table
CREATE TABLE IF NOT EXISTS tractors (
    id INTEGER PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    hp VARCHAR(50),
    equipment TEXT,
    pricing INTEGER DEFAULT 1200,
    photo TEXT,
    rating NUMERIC(3, 1) DEFAULT 4.8,
    jobs_done INTEGER DEFAULT 0,
    default_owner VARCHAR(150),
    default_mobile VARCHAR(50),
    village_type VARCHAR(50) DEFAULT 'local',
    village VARCHAR(100) DEFAULT 'Hasanparthy',
    district VARCHAR(100) DEFAULT 'Hanamkonda',
    distance_km NUMERIC(5, 2) DEFAULT 1.0,
    availability VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bookings & Work Orders Table
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT PRIMARY KEY,
    farmer_name VARCHAR(150) NOT NULL,
    farmer_mobile VARCHAR(20) NOT NULL,
    farmer_village VARCHAR(100),
    tractor_id INTEGER,
    tractor_model VARCHAR(150),
    tractor_owner VARCHAR(150),
    work_type VARCHAR(100) NOT NULL,
    land_area NUMERIC(5, 2) DEFAULT 2.0,
    booking_date VARCHAR(50) NOT NULL,
    booking_time VARCHAR(50) DEFAULT '07:00 AM',
    duration_hours INTEGER DEFAULT 4,
    estimated_cost INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending Approval',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure backward compatibility if columns were added later
ALTER TABLE tractors ADD COLUMN IF NOT EXISTS village VARCHAR(100) DEFAULT 'Hasanparthy';
ALTER TABLE tractors ADD COLUMN IF NOT EXISTS district VARCHAR(100) DEFAULT 'Hanamkonda';
ALTER TABLE tractors ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'Available';

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_farmers_mobile ON farmers(mobile);
CREATE INDEX IF NOT EXISTS idx_owners_mobile ON vehicle_owners(mobile);
CREATE INDEX IF NOT EXISTS idx_tractors_brand ON tractors(brand);
CREATE INDEX IF NOT EXISTS idx_tractors_village ON tractors(village);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_mobile ON bookings(farmer_mobile);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
