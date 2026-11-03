# AgriRent PostgreSQL Integration Guide

## 1. Prerequisites
You already have **PostgreSQL 18** and **pgAdmin 4** installed!
Your PostgreSQL server is running on `localhost:5432`.

## 2. Configuration (`.env`)
Open `.env` in the root of the project:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=tractor_rental_db
PORT=5000
```
Replace `YOUR_POSTGRES_PASSWORD_HERE` with the password you created when installing PostgreSQL.

## 3. Initialize Database & Tables
Run this single command in your terminal:
```bash
npm run db:init
```
This command:
1. Connects to PostgreSQL.
2. Creates the `tractor_rental_db` database if it doesn't already exist.
3. Creates the tables: `farmers`, `vehicle_owners`, `bookings`, and `tractors`.
4. Populates them with initial records and indexes.

## 4. Start Backend Server
Run:
```bash
npm run server
```
The backend API starts on `http://localhost:5000`.

## 5. View Data in pgAdmin 4
1. Open **pgAdmin 4** (search for pgAdmin 4 in Windows Start Menu).
2. Enter your master password to unlock pgAdmin.
3. On the left sidebar, expand:
   - **Servers** -> **PostgreSQL 18**
   - **Databases** -> **tractor_rental_db**
   - **Schemas** -> **public** -> **Tables**
4. Right-click on **`farmers`** -> **View/Edit Data** -> **All Rows**.
5. You can also right-click **`tractor_rental_db`** -> select **Query Tool**, and run:
   ```sql
   SELECT * FROM farmers;
   SELECT * FROM vehicle_owners;
   SELECT * FROM bookings;
   ```
