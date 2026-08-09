# FundsRoom — Mini ERP + CRM Operations Portal

Internal operations tool for a wholesale distribution business. Covers Customer CRM, Product & Inventory tracking, and Sales Challan (outbound dispatch), behind role-based authentication.

**Built for:** FundsRoom Infotech Full Stack Developer Intern Case Study

---

## Repository & Artifacts

- **GitHub Repository:** `https://github.com/karthikyernana/fundsroom.git`
- **Postman Collection:** [`FundsRoom.postman_collection.json`](./FundsRoom.postman_collection.json)
- **Development Log:** [`DEVLOG.md`](./DEVLOG.md)

---

## Test Credentials

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Admin** | `admin@fundsroom.com` | `password123` | Full access across all modules. Can create/manage users. |
| **Sales Rep 1** | `sales@fundsroom.com` | `password123` | Assigned customer CRM portfolio, "My Accounts" filter, customer creation & follow-ups, draft/confirm challans |
| **Sales Rep 2** | `sales2@fundsroom.com` | `password123` | Separate assigned customer portfolio, lead tracking, draft & confirm challans |
| **Warehouse** | `warehouse@fundsroom.com` | `password123` | Product & Stock CRUD, Read customers (for challan dispatch context), Create/Confirm/Cancel challans |
| **Accounts** | `accounts@fundsroom.com` | `password123` | Read-only across all modules, line item snapshot inspection, Tax Invoice & Challan PDF export |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (v18+) |
| **Backend** | Express.js + TypeScript (strict) |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma ORM |
| **Validation** | Zod |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **Frontend** | React 19 + TypeScript (Vite) |
| **Data Fetching** | TanStack Query (React Query v5) |
| **HTTP Client** | Axios + Interceptors |
| **Styling** | Plain CSS with custom design token system |
| **Typography** | IBM Plex Sans + IBM Plex Mono (Google Fonts) |

---

## Local Setup & Quick Start

### Prerequisites
- Node.js v18+
- A Supabase PostgreSQL connection string (URI mode)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/karthikyernana/fundsroom.git
cd fundsroom

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables

Create `backend/.env` based on `backend/.env.example`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
JWT_SECRET="super-secret-key-32-chars-long"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Database Migration & Seeding

```bash
cd backend

# Run Prisma schema migration
npx prisma migrate dev --name init

# Seed database with sample users, customers, products, and challans
npm run db:seed
```

### 4. Run Automated Integration Test Suite

```bash
cd backend

# Execute 54-test integration suite against PostgreSQL
npm test
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Frontend App
cd frontend && npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`
- **Health Check:** `http://localhost:3001/health`

---

## Deployment Guide

### Backend (Render / Railway)

1. Create a new **Web Service** pointing to the `backend/` directory of the repository.
2. Set Build Command: `npm install && npx prisma generate && npm run build`
3. Set Start Command: `npm start`
4. Configure Environment Variables:
   - `DATABASE_URL` = Your Supabase URI
   - `JWT_SECRET` = Production random 64-byte string
   - `CORS_ORIGIN` = Your Vercel frontend URL
   - `NODE_ENV` = `production`

### Frontend (Vercel)

1. Import the repository into Vercel and set the Root Directory to `frontend`.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variables:
   - `VITE_API_URL` = Your deployed backend API URL
6. SPA Routing: Included via `frontend/vercel.json` rewrite rule.

---

## API Reference

The project includes a complete Postman collection: `FundsRoom.postman_collection.json`.

Base URL: `http://localhost:3001`

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | No | All | Authenticate and obtain JWT token |
| `GET` | `/auth/me` | Yes | All | Get current authenticated user details |
| `GET` | `/auth/sales-reps` | Yes | All | List sales representative accounts for customer lead assignment |
| `GET` | `/auth/users` | Yes | Admin | List all system users |
| `POST` | `/auth/register` | Yes | Admin | Create a new user (name, email, password, role) |
| `GET` | `/customers` | Yes | All | List customers (supports `search`, `status`, `assigned_to`, `my_customers`, `page`, `limit`) |
| `POST` | `/customers` | Yes | Admin, Sales | Create customer record with optional `assigned_to` sales rep |
| `GET` | `/customers/:id` | Yes | All | Get customer details with assigned rep & follow-up notes timeline |
| `PUT` | `/customers/:id` | Yes | Admin, Sales | Update customer profile and assigned sales representative |
| `POST` | `/customers/:id/notes` | Yes | Admin, Sales | Add a follow-up note to customer timeline |
| `GET` | `/products` | Yes | All | List products (supports `search`, `category`, `low_stock`, `page`, `limit`) |
| `POST` | `/products` | Yes | Admin, Warehouse | Create product |
| `GET` | `/products/:id` | Yes | All | Get product details |
| `PUT` | `/products/:id` | Yes | Admin, Warehouse | Update product details (price, alert threshold, location) |
| `POST` | `/products/:id/stock-movements` | Yes | Admin, Warehouse | Record manual stock movement (`IN` / `OUT`) |
| `GET` | `/products/:id/stock-movements` | Yes | All | Get stock movement log for a product |
| `GET` | `/challans` | Yes | All | List sales challans (supports `status`, `customer`, `page`, `limit`) |
| `POST` | `/challans` | Yes | Admin, Sales, Warehouse | Create draft sales challan |
| `GET` | `/challans/:id` | Yes | All | Get challan details with line item snapshots |
| `PUT` | `/challans/:id` | Yes | Admin, Sales, Warehouse | Update draft challan line items |
| `POST` | `/challans/:id/confirm` | Yes | Admin, Sales, Warehouse | Confirm & dispatch (atomic stock deduction) |
| `POST` | `/challans/:id/cancel` | Yes | Admin, Warehouse | Cancel draft or un-dispatched challan |

---

## Core Architecture & Technical Highlights

### 1. Atomic Transaction Safety (Preventing TOCTOU Race Conditions)
- **Problem:** Stock deduction in outbound challans faces Time-of-Check to Time-of-Use (TOCTOU) race conditions if executed as separate `findUnique()` read and `update()` decrement calls inside default `READ COMMITTED` transactions.
- **Solution:** Stock deduction uses a single atomic SQL statement per line item via Prisma `$executeRaw`:
  ```sql
  UPDATE "products"
  SET "current_stock" = "current_stock" - $qty, "updated_at" = NOW()
  WHERE "id" = $productId::uuid AND "current_stock" >= $qty;
  ```
  `$executeRaw` returns affected rows (1 = success, 0 = stock insufficient at instant of execution).
- **Database Backstop:** A PostgreSQL `CHECK ("current_stock" >= 0)` constraint migration (`backend/prisma/migrations/20260808_add_stock_check_constraint`) physically prevents negative stock at the engine layer.

### 2. Historical Data Integrity via Line Item Snapshots
- When a draft challan is created, product name (`product_name_snapshot`), SKU (`product_sku_snapshot`), and unit price (`unit_price_snapshot`) are frozen at creation time.
- Future catalog price changes or product renames will never corrupt historical sales records or financial totals.

### 3. Strict Audit Trail Enforcement
- Direct edits to `current_stock` via `PUT /products/:id` are blocked.
- All stock changes must originate from either a confirmed sales challan or an explicit `POST /products/:id/stock-movements` call (`IN` / `OUT` with mandatory user attribution and audit reasoning).

### 4. Custom Industrial Design System & UX Highlights
- Built strictly with the PRD palette (`#EDE7DA` dusty parchment background, `#211D18` ink text, `#1F4D3D` bottle green ledger primary, `#C98A2C` secondary stamp, `#A6341A` brick alerts, `#4C6B3F` olive confirmations).
- Features signature elements like `StampBadge` for challan status (monospace, rotated ink-stamp aesthetic), micro-animations (button active scaling, spring modal transitions), and a responsive mobile sidebar drawer.
- **Live Operations Dashboard Metrics:** Displays real-time operational widgets for Active Customers, Total Products, Low Stock Alerts, and Challan Dispatches.
- **Toast Notification System:** Provides instant color-coded visual alerts for all user actions (creations, edits, stock adjustments, confirmations, and errors).

---

## Known Limitations & Tradeoffs

1. **In-Memory Post-Filtering for `low_stock` Query:** Prisma ORM currently lacks native column-to-column comparison queries (e.g. `WHERE current_stock <= min_stock_alert`). Low stock queries fetch matching product records and apply filtering in the application layer. For enterprise scale (100k+ SKUs), this would be refactored to `$queryRaw`.
2. **Sequential Multi-Item Challan Confirm:** Challan confirmation loops line items sequentially within a Prisma `$transaction`. If item 5 of 10 has insufficient stock, the transaction cleanly aborts and rolls back items 1-4.
3. **Session Revocation:** JWT tokens are stateless with a 24-hour expiration. Revocation before expiration requires token blocklisting (Redis), omitted for scope.
