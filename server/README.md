# 🚜 AgriRent Node.js & PostgreSQL REST API Documentation

A production-grade, modular RESTful backend built with **Node.js**, **Express**, and **PostgreSQL (`pg`)** for the AgriRent Tractor & Agricultural Machinery Rental Platform.

---

## 📌 Architecture & Structure

```
server/
├── controllers/          # Business logic & PostgreSQL queries
│   ├── bookingController.js # Work orders, status transitions, filters
│   ├── farmerController.js  # Farmer profile management & mobile verification
│   ├── ownerController.js   # Tractor captain/owner registrations
│   ├── statsController.js   # Platform analytics & KPI dashboard
│   └── tractorController.js # Machinery fleet inventory & search
├── middleware/
│   ├── errorHandler.js      # Global JSON error handling & 404 catches
│   └── requestLogger.js     # High-precision HTTP latency & status logger
├── routes/               # Express REST routers
│   ├── bookingRoutes.js     # /api/bookings endpoints
│   ├── farmerRoutes.js      # /api/farmers endpoints
│   ├── ownerRoutes.js       # /api/owners endpoints
│   ├── statsRoutes.js       # /api/stats endpoints
│   └── tractorRoutes.js     # /api/tractors endpoints
├── db.js                 # PostgreSQL Pool connection with auto-reconnect
├── initDb.js             # Automated DB creator, migrator & seeder
├── schema.sql            # Table definitions, constraints & indexes
├── server.js             # Express application entrypoint
└── README.md             # Complete REST API documentation (this file)
```

---

## ⚙️ 1. Environment & Setup

Make sure your `.env` in the root folder contains your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Yamu@10
DB_NAME=tractor_rental_db
PORT=5000
```

### Initialize / Migrate Database
Run the automated schema creator and seeder:
```bash
npm run db:init
```
This automatically creates `tractor_rental_db` (if missing), creates all 4 tables (`farmers`, `vehicle_owners`, `tractors`, `bookings`), adds performance indexes, and seeds 20 tractors/harvesters, default farmers, and sample bookings.

### Run Backend Server
```bash
npm run server
```
Server runs on: **`http://localhost:5000`**

### Run Frontend & Backend Simultaneously
```bash
npm run dev:all
```

---

## 📡 2. REST API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| **GET** | `/api/health` | Service health, PostgreSQL uptime & database status |
| **GET** | `/api/stats` | Platform KPIs (total fleet, active bookings, revenue, etc.) |
| **GET** | `/api/tractors` | List all tractors & machinery (filter by `brand`, `village`, `equipment`) |
| **GET** | `/api/tractors/:id` | Get single tractor by ID |
| **POST** | `/api/tractors` | Register new tractor or machinery |
| **PUT** | `/api/tractors/:id` | Update tractor details, pricing, availability |
| **DELETE** | `/api/tractors/:id` | Delete tractor by ID |
| **GET** | `/api/farmers` | List registered farmers |
| **GET** | `/api/farmers/:mobile`| Lookup farmer by registered 10-digit mobile number |
| **POST** | `/api/farmers` | Register / Upsert farmer profile |
| **PUT** | `/api/farmers/:mobile`| Update farmer land area, crops, details |
| **DELETE** | `/api/farmers/:mobile`| Delete farmer account |
| **GET** | `/api/owners` | List all registered tractor captains/owners |
| **GET** | `/api/owners/:mobile` | Lookup vehicle owner by mobile number |
| **POST** | `/api/owners` | Register / Upsert tractor owner |
| **PUT** | `/api/owners/:mobile` | Update vehicle owner profile |
| **DELETE** | `/api/owners/:mobile` | Delete vehicle owner profile |
| **GET** | `/api/bookings` | List bookings (filter by `farmerMobile`, `status`) |
| **GET** | `/api/bookings/:id` | Get single booking details by ID |
| **POST** | `/api/bookings` | Create new tractor rental work order |
| **PUT** | `/api/bookings/:id` | Update full booking details |
| **PATCH** | `/api/bookings/:id/status`| Update booking status (`Confirmed`, `In Progress`, `Completed`, `Cancelled`) |
| **DELETE** | `/api/bookings/:id` | Cancel/Delete booking |

---

## 🧪 3. Ready-To-Run cURL Commands & Request/Response Samples

### 3.1 Health Check
```bash
curl.exe -X GET http://localhost:5000/api/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "AgriRent Backend REST API",
  "database": "connected",
  "dbName": "tractor_rental_db",
  "pgVersion": "PostgreSQL 18.6 on x86_64-windows",
  "serverTime": "2026-11-04T05:30:11.406Z",
  "uptimeSeconds": 120
}
```

---

### 3.2 Platform Dashboard & Stats
```bash
curl.exe -X GET http://localhost:5000/api/stats
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalFarmers": 4,
    "totalOwners": 3,
    "totalTractors": 20,
    "totalBookings": 2,
    "pendingBookings": 1,
    "confirmedBookings": 1,
    "completedBookings": 0,
    "totalRevenue": 10650,
    "recentBookings": [ ... ]
  }
}
```

---

### 3.3 Tractors Fleet Management

#### Get All Tractors (Supports Optional Query Filters: `?village=Hasanparthy&brand=Mahindra`)
```bash
curl.exe -X GET "http://localhost:5000/api/tractors"
```

#### Get Tractor by ID
```bash
curl.exe -X GET http://localhost:5000/api/tractors/1
```

#### Add New Tractor
```bash
curl.exe -X POST http://localhost:5000/api/tractors ^
  -H "Content-Type: application/json" ^
  -d "{\"brand\":\"Sonalika\",\"model\":\"DI 60 Sikander (60 HP)\",\"hp\":\"60 HP\",\"equipment\":\"Ploughing, Rotavator, Laser Leveler\",\"pricing\":1350,\"photo\":\"/tractor6.jpeg\",\"rating\":4.9,\"owner\":\"Ramesh Chary\",\"mobile\":\"9849912345\",\"village\":\"Hasanparthy\",\"district\":\"Hanamkonda\",\"distanceKm\":1.5,\"availability\":\"Available\"}"
```

#### Update Tractor Pricing or Availability
```bash
curl.exe -X PUT http://localhost:5000/api/tractors/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"pricing\":1250,\"availability\":\"Available\"}"
```

#### Delete Tractor
```bash
curl.exe -X DELETE http://localhost:5000/api/tractors/99
```

---

### 3.4 Farmers Authentication & Management

#### Lookup Farmer by Mobile Number
```bash
curl.exe -X GET http://localhost:5000/api/farmers/9876500001
```
**Response:**
```json
{
  "id": 5,
  "name": "Suresh Kumar",
  "mobile": "9876500001",
  "village": "Hasanparthy",
  "district": "Hanumakonda",
  "landArea": "3.00",
  "crops": ["Paddy", "Cotton"],
  "isVerified": true
}
```

#### Register / Save Farmer (Upsert)
```bash
curl.exe -X POST http://localhost:5000/api/farmers ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Ravi Varma\",\"mobile\":\"9955443322\",\"village\":\"Hasanparthy\",\"district\":\"Hanamkonda\",\"landArea\":4.5,\"crops\":[\"Cotton\",\"Chilli\"],\"passbookNo\":\"TS-WGL-55443\"}"
```

#### Delete Farmer Account
```bash
curl.exe -X DELETE http://localhost:5000/api/farmers/9955443322
```

---

### 3.5 Vehicle Owners / Tractor Captains

#### List All Owners
```bash
curl.exe -X GET http://localhost:5000/api/owners
```

#### Register Tractor Owner
```bash
curl.exe -X POST http://localhost:5000/api/owners ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Laxman Rao\",\"mobile\":\"9848123999\",\"dob\":\"1985-08-14\",\"gender\":\"Male\",\"vehicleType\":\"Tractor\",\"tractorModel\":\"Mahindra Arjun 605 DI\",\"vehicleNumber\":\"TS 03 EF 9988\",\"pricing\":1300,\"village\":\"Hasanparthy\",\"district\":\"Hanamkonda\",\"dlNumber\":\"DL-0320140088991\",\"rcNumber\":\"TS03EF9988\"}"
```

---

### 3.6 Bookings & Work Orders

#### List All Bookings (Supports Filter: `?farmerMobile=9848022334` or `?status=Confirmed`)
```bash
curl.exe -X GET http://localhost:5000/api/bookings
```

#### Create New Booking
```bash
curl.exe -X POST http://localhost:5000/api/bookings ^
  -H "Content-Type: application/json" ^
  -d "{\"farmerName\":\"Suresh Kumar\",\"farmerMobile\":\"9876500001\",\"farmerVillage\":\"Hasanparthy\",\"tractorId\":1,\"tractorModel\":\"Mahindra 475 DI XP Plus\",\"tractorOwner\":\"Ramesh Kumar\",\"workType\":\"Ploughing\",\"landArea\":3.0,\"bookingDate\":\"2026-11-08\",\"bookingTime\":\"06:30 AM\",\"durationHours\":4,\"estimatedCost\":4800,\"remarks\":\"Deep ploughing for Rabi season preparation\"}"
```

#### Update Booking Status (e.g. Confirm or Complete)
```bash
curl.exe -X PATCH http://localhost:5000/api/bookings/1730000002/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"Confirmed\"}"
```

#### Delete / Cancel Booking
```bash
curl.exe -X DELETE http://localhost:5000/api/bookings/1730000002
```

---

## 💻 4. Frontend Integration via `src/api/apiClient.js`

The frontend React application includes high-level SDK helper methods in [src/api/apiClient.js](file:///c:/tractor-rental-system/src/api/apiClient.js):

```javascript
import {
  apiGetTractors,
  apiSaveTractor,
  apiGetFarmers,
  apiGetFarmerByMobile,
  apiSaveFarmer,
  apiGetOwners,
  apiSaveOwner,
  apiGetBookings,
  apiSaveBooking,
  apiUpdateBookingStatus,
  apiGetStats,
  apiCheckHealth
} from '../api/apiClient';

// Example: Fetch live fleet
const tractors = await apiGetTractors({ village: 'Hasanparthy' });

// Example: Check if farmer exists on login
const farmer = await apiGetFarmerByMobile('9876500001');

// Example: Create booking
const newBooking = await apiSaveBooking({
  farmerName: 'Suresh Kumar',
  farmerMobile: '9876500001',
  tractorModel: 'Mahindra 575 DI',
  workType: 'Ploughing',
  estimatedCost: 3600
});
```

---

## 🗄️ 5. PostgreSQL Tables & Schema

All data is permanently persisted in PostgreSQL under `tractor_rental_db`. You can view or query the data anytime in **pgAdmin 4**:
- `farmers` (id, name, mobile, village, district, land_area, crops, passbook_no, is_verified, created_at)
- `vehicle_owners` (id, full_name, mobile, dob, gender, vehicle_type, tractor_model, vehicle_number, pricing, village, dl_number, rc_number, created_at)
- `tractors` (id, brand, model, hp, equipment, pricing, photo, rating, jobs_done, default_owner, default_mobile, village_type, village, district, distance_km, availability, created_at)
- `bookings` (id, farmer_name, farmer_mobile, farmer_village, tractor_id, tractor_model, tractor_owner, work_type, land_area, booking_date, booking_time, duration_hours, estimated_cost, status, remarks, created_at)
