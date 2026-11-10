import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

import { query } from './db.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

import tractorRoutes from './routes/tractorRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ---------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version');
    res.json({
      status: 'ok',
      service: 'AgriRent Backend REST API',
      database: 'connected',
      dbName: dbRes.rows[0].db_name,
      pgVersion: dbRes.rows[0].pg_version.split(',')[0],
      serverTime: dbRes.rows[0].current_time,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'AgriRent Backend REST API',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// Ensure static uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed'));
    }
  }
});

// Single Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file uploaded' });
  }
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol || 'http';
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    filename: req.file.filename,
    url: fileUrl,
    path: `/uploads/${req.file.filename}`
  });
});

// ---------------------------------------------------------------------
// REST API ROUTE MODULES
// ---------------------------------------------------------------------
app.use('/api/tractors', tractorRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Production single-port serving: serve static dist assets and index.html
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Root Welcome Endpoint (when not in full SPA build mode)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AgriRent Tractor & Farm Machinery Rental REST API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      tractors: 'GET, POST /api/tractors | GET, PUT, DELETE /api/tractors/:id',
      farmers: 'GET, POST /api/farmers | GET, PUT, DELETE /api/farmers/:mobile',
      owners: 'GET, POST /api/owners | GET, PUT, DELETE /api/owners/:mobile',
      bookings: 'GET, POST /api/bookings | GET, PUT, DELETE /api/bookings/:id | PATCH /api/bookings/:id/status',
      stats: 'GET /api/stats',
      otp: 'POST /api/otp/send | POST /api/otp/verify | GET /api/otp/status (Message Central)',
      upload: 'POST /api/upload',
    }
  });
});

// 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found. Check / for available endpoints.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

async function ensureBookingsSchema() {
  try {
    await query(`
      -- Farmers Authentication Columns
      ALTER TABLE farmers ADD COLUMN IF NOT EXISTS email VARCHAR(150);
      ALTER TABLE farmers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_farmers_email ON farmers(email);

      -- Vehicle Owners Authentication Columns
      ALTER TABLE vehicle_owners ADD COLUMN IF NOT EXISTS email VARCHAR(150);
      ALTER TABLE vehicle_owners ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_owners_email ON vehicle_owners(email);

      -- Bookings Workflow & Slotted Columns
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS farmer_id INTEGER;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending Cash on Service';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS registration_no VARCHAR(50) DEFAULT 'TS 03 AB 4589';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS owner_mobile VARCHAR(50) DEFAULT '9876543210';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tractor_photo TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(50);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot VARCHAR(50) DEFAULT '09:00 AM – 01:00 PM';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time VARCHAR(20);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time VARCHAR(20);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_payment INTEGER DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_farmer_mobile ON bookings(farmer_mobile);
      CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
      CREATE INDEX IF NOT EXISTS idx_bookings_tractor_date ON bookings(tractor_id, booking_date);

      -- In-App Notifications Table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_mobile VARCHAR(20) NOT NULL,
        user_role VARCHAR(20) NOT NULL DEFAULT 'farmer',
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'booking',
        booking_id BIGINT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_mobile ON notifications(user_mobile);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    `);
    console.log('✅ PostgreSQL full schema verified & migrated.');
  } catch (err) {
    console.warn('PostgreSQL schema migration check warning:', err.message);
  }
}

// Start Server
const server = app.listen(PORT, async () => {
  await ensureBookingsSchema();
  console.log(`\n=============================================================`);
  console.log(`🚀 AgriRent Node.js REST API Server running on http://localhost:${PORT}`);
  console.log(`📡 Database: PostgreSQL [${process.env.DB_NAME || 'tractor_rental_db'}] on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
  console.log(`📋 REST API Route Endpoints:`);
  console.log(`   • GET, POST          /api/tractors`);
  console.log(`   • GET, PUT, DELETE   /api/tractors/:id`);
  console.log(`   • GET, POST          /api/farmers`);
  console.log(`   • GET, PUT, DELETE   /api/farmers/:mobile`);
  console.log(`   • GET, POST          /api/owners`);
  console.log(`   • GET, PUT, DELETE   /api/owners/:mobile`);
  console.log(`   • GET, POST          /api/bookings`);
  console.log(`   • GET, PUT, DELETE   /api/bookings/:id`);
  console.log(`   • PATCH              /api/bookings/:id/status`);
  console.log(`   • GET                /api/stats`);
  console.log(`   • GET                /api/health`);
  console.log(`=============================================================\n`);
});

// Keep process active
setInterval(() => {}, 1000 * 60 * 60);

server.on('error', (err) => {
  console.error('Server error:', err);
});

export { app, server };
