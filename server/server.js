import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Root Welcome Endpoint
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
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS farmer_id INTEGER;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending Cash on Service';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS registration_no VARCHAR(50) DEFAULT 'TS 03 AB 4589';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS owner_mobile VARCHAR(50) DEFAULT '9876543210';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tractor_photo TEXT;
      CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_farmer_mobile ON bookings(farmer_mobile);
    `);
    console.log('✅ PostgreSQL bookings schema verified & migrated.');
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
