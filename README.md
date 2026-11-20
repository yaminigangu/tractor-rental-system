# 🌾 AgriRent (అగ్రిరెంట్)
### Locality Farm Machinery & Tractor Rental Platform
> Connecting landowning farmers with local tractor owners for ploughing, rotavator, cultivator, puddling, and haulage services.

[![React 19](https://img.shields.io/badge/React-19.2.8-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Localization](https://img.shields.io/badge/Bilingual-English%20%7C%20%E0%B0%A4%E0%B1%86%E0%B0%B2%E0%B1%81%E0%B0%97%E0%B1%81-2e7d32.svg)]()
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

---

## 📌 Project Overview
In rural agricultural clusters (such as Hasanparthy, Bheemaram, Velair, Dharmasagar, Kazipet), many farmers have farm lands requiring timely machinery, while local tractor owners have idle machinery slots. 

**AgriRent** solves rural agricultural coordination by:
1. Eliminating awkward price and slot negotiations over phone calls.
2. Automating **instant slot availability verification** via WhatsApp and an **In-App Tractor Owner Inbox**.
3. Providing clear dynamic pricing based on land area ($Acres \times 1.5 \text{ hrs} \times Rate$).
4. Issuing verifiable **Digital Agricultural Work Passes / Slips** with QR verification and print support.

---

## 🚀 Key Features

### 👨‍🌾 1. For Landowning Farmers
- **Locality Fleet Directory**: Browse 12 diverse tractors with real equipment attachments (Rotavator, Ploughing, Cage Wheels, Disc Harrow, Laser Leveler).
- **Live Search & Filter**: Search by tractor brand (*Mahindra, John Deere, Swaraj, Kubota, Massey Ferguson, Sonalika*) or village (*Hasanparthy, Velair, Kazipet*).
- **Dynamic Fare Calculator**: Instant estimate calculation with operator fee included.
- **Order Tracker (4-Step Visual Stepper)**: Track status through *Requested ➔ Slot Confirmed ➔ In Field ➔ Completed*.
- **Official Digital Work Slip**: Printable PDF/paper work receipt with order ID and direct WhatsApp share.
- **Agricultural Advisory**: Real-time soil moisture and weather advisory widget.

### 🚜 2. For Tractor Owners
- **Owner Work Inbox**: Dedicated portal to manage incoming farm requests.
- **1-Click Slot Decisions**: Accept slots, propose next day, or decline busy slots with persistent visual confirmations.
- **Automated WhatsApp Dispatch**: 1-tap pre-filled Telugu/English WhatsApp templates to reply to farmers without saving contacts.
- **Fleet Registration**: Register new machinery with brand selector, equipment checkboxes, and photo presets.

### 🛡️ 3. For Village Admins
- **Secure Authentication Gate**: Gated access (`admin` / `admin123`) using `sessionStorage`.
- **Operational Command Center**: Total work intake, pending verification badges, fleet unit count, and acreage serviced.
- **Lifecycle Management**: Advance jobs through *Pending ➔ Approved ➔ In Progress ➔ Completed*.

### 🌐 4. Full Bilingual Localization
- Complete toggle between **English** and **Telugu (తెలుగు)** across all cards, navigation, forms, and receipts.

---

## 🛠️ Technology Stack
- **Frontend Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8 with Hot Module Replacement (HMR)
- **Styling**: Vanilla CSS Design System with responsive mobile navigation and print media queries (`@media print`)
- **Icons**: SVG Agricultural iconography
- **State Persistence**: `localStorage` (tractors and bookings) and `sessionStorage` (admin session)
- **Linting**: Oxlint (`oxlint`)

---

## 📁 Project Structure (Separated Frontend & Backend)

```
tractor-rental-system/
├── frontend/             # React + Vite Frontend SPA (Port 5173)
│   ├── src/              # Pages, components, api client, translations
│   ├── public/           # Static assets, images, icons, manifest
│   ├── index.html        # HTML entry point
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Frontend dependencies & scripts
│
├── backend/              # Node.js + Express REST API (Port 5000)
│   ├── controllers/      # Route controllers (auth, bookings, tractors, etc.)
│   ├── routes/           # Express API route modules
│   ├── middleware/       # RBAC auth, verifyToken & error middlewares
│   ├── services/         # Message Central SMS OTP, WhatsApp services
│   ├── scripts/          # Database migrations, DB audit & RBAC test suites
│   ├── uploads/          # Uploaded machinery and profile photos
│   ├── db.js             # PostgreSQL connection pool
│   ├── initDb.js         # DB initialization & seeding script
│   ├── schema.sql        # Database schema definitions
│   ├── server.js         # Express app entry point
│   └── package.json      # Backend dependencies & scripts
│
├── package.json          # Root orchestration scripts (dev, server, dev:all)
└── .env                  # Environment variables (DB credentials, JWT, keys)
```

## 💻 Local Setup & Development Commands

### From Root Directory (Recommended):
- **Run Both Frontend & Backend Simultaneously:**
  ```bash
  npm run dev:all
  ```
- **Run Frontend Only (Port 5173):**
  ```bash
  npm run dev
  ```
- **Run Backend Only (Port 5000):**
  ```bash
  npm run server
  ```
- **Build Frontend:**
  ```bash
  npm run build
  ```

---

### Running Directly From Subfolders:
- **Frontend Only:**
  ```bash
  cd frontend
  npm run dev
  ```
- **Backend Only:**
  ```bash
  cd backend
  npm run dev
  ```

---

## 🌐 Deploying to Vercel

### Method 1: Using Vercel CLI (Recommended & Fastest)
```bash
# 1. Install or run Vercel CLI
npx vercel

# 2. Follow prompts:
# ? Set up and deploy? [Y/n] y
# ? Which scope? (Select your personal account)
# ? Link to existing project? [y/N] n
# ? What's your project's name? agrirent-tractor-rental
# ? In which directory is your code located? ./
# ? Want to modify these settings? N

# 3. Deploy to production:
npx vercel --prod
```

### Method 2: Via GitHub + Vercel Dashboard
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Complete AgriRent tractor rental system"
   ```
2. Push to your GitHub account:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/agrirent.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), import your repository, and click **Deploy**.
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`

---

## 🔐 Demo Credentials
- **Admin Username**: `admin`
- **Admin Password**: `admin123`
- *(Or click the "Fill Demo Credentials" button on the Admin Login page)*
