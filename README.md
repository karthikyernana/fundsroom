# FundsRoom — Mini ERP + CRM Operations Portal

> **Full Stack Developer Case Study Submission**  
> **Built for:** FundsRoom Infotech Full Stack Developer Intern Case Study  
> **Candidate:** Karthik Yernana (B.Tech CSE, 2027)  

---

## 🚀 Live Deployment Links

- **Live Frontend Application:** [`https://fundsroom-green.vercel.app/`](https://fundsroom-green.vercel.app/)
- **Live Backend REST API:** [`https://fundsroom-lp8g.onrender.com`](https://fundsroom-lp8g.onrender.com)
- **API Health Check:** [`https://fundsroom-lp8g.onrender.com/health`](https://fundsroom-lp8g.onrender.com/health)
- **GitHub Repository:** [`https://github.com/karthikyernana/fundsroom`](https://github.com/karthikyernana/fundsroom)
- **Postman API Collection:** [`FundsRoom.postman_collection.json`](./FundsRoom.postman_collection.json)
- **Project PDF Documentation:** [`FundsRoom_Project_Documentation.pdf`](./FundsRoom_Project_Documentation.pdf)
- **Development Log:** [`DEVLOG.md`](./DEVLOG.md)

---

## 🔐 Test Login Credentials

All accounts share the default password: **`password123`**

| Role | Email | Password | Scope & Module Permissions |
|---|---|---|---|
| 👑 **Admin** | `admin@fundsroom.com` | `password123` | Full system access. Can onboard/manage internal user accounts via `/users`. |
| 📈 **Sales Lead** | `sales@fundsroom.com` | `password123` | Full CRM access, lead assignment, "My Accounts" filter, draft & confirm challans. |
| 💼 **Sales Rep 2** | `sales2@fundsroom.com` | `password123` | Separate assigned customer portfolio, lead tracking, draft & confirm challans. |
| 📦 **Warehouse** | `warehouse@fundsroom.com` | `password123` | Product & Stock CRUD, manual stock movements, read customer context, dispatch challans. |
| 🧾 **Accounts** | `accounts@fundsroom.com` | `password123` | Read-only across all modules, line item snapshot inspection, Tax Invoice & Challan PDF export. |

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend Runtime** | Node.js (v18+) | Non-blocking I/O, fast execution, seamless TypeScript integration. |
| **Framework** | Express.js + TypeScript | Lightweight, strict type safety, custom middleware pipeline. |
| **Database** | PostgreSQL (Supabase) | ACID compliance, row locking, relational integrity, raw SQL support. |
| **ORM** | Prisma ORM | Type-safe queries, migration control, schema-driven model definitions. |
| **Validation** | Zod | Runtime schema validation on every write request with field-level errors. |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Stateless token auth with role claims & 24h expiration. |
| **Frontend** | React 19 + TypeScript (Vite) | High performance, modular component architecture, fast HMR. |
| **State & Fetching** | TanStack Query v5 | Server state management, auto-caching, and optimistic cache invalidation. |
| **Styling & UI** | Plain CSS (Custom Tokens) | Zero heavy UI frameworks — precision design system following PRD tokens. |
| **Typography** | Plus Jakarta Sans + Instrument Serif + IBM Plex Mono | Professional financial editorial typography hierarchy. |

---

## 🏗️ Core Architecture & Business Logic

### 1. Atomic Transaction Safety (§5 — Preventing Stock Overdraw)
- **Challenge:** Outbound challans can cause negative stock if two concurrent requests attempt to confirm a challan for the last remaining unit (TOCTOU race condition).
- **Solution:** Stock deduction uses a single atomic SQL statement via Prisma `$executeRaw`:
  ```sql
  UPDATE "products"
  SET "current_stock" = "current_stock" - $qty, "updated_at" = NOW()
  WHERE "id" = $productId::uuid AND "current_stock" >= $qty;
  ```
- **Guarantees:**
  - `$executeRaw` returns affected row count (1 = success, 0 = stock was modified/insufficient at instant of execution).
  - If any single item in a multi-item challan fails, the entire Prisma `$transaction` aborts and rolls back stock for earlier items.
  - A PostgreSQL database constraint (`CHECK ("current_stock" >= 0)`) acts as an engine-level backstop.

### 2. Historical Data Integrity via Line Item Snapshots (§4)
- When a draft challan is created, product name (`product_name_snapshot`), SKU (`product_sku_snapshot`), and unit price (`unit_price_snapshot`) are frozen at creation time.
- Future catalog price changes or product renames will never alter historical financial records or confirmed dispatch values.

### 3. Strict Audit Trail Enforcement
- Direct edits to `current_stock` via `PUT /products/:id` are blocked.
- Stock changes must originate from either a confirmed sales challan or an explicit `POST /products/:id/stock-movements` call (`IN` / `OUT` with mandatory user attribution and audit reasoning).

### 4. Single-Logo High-Craft Enterprise UI
- Built strictly with the PRD palette (`#EDE7DA` parchment background, `#211D18` ink text, `#1F4D3D` bottle green primary).
- **Single Authoritative Logo:** Responsive logo architecture displays a single brand header on desktop, hiding redundant form logos, while adapting seamlessly to mobile (`<899px`).
- **Interactive Animations:** Concentric architectural SVG vault graphic (`spinSlow`), floating ambient background lighting (`floatAmbient`), and vertical-centered input eye toggles.

---

## 🧪 Automated Integration Test Suite (54 Tests)

A comprehensive integration test suite is included in `backend/src/__tests__/api.test.ts`.

### Run Tests:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Auth (9 tests):** Valid logins across 4 roles, password hashing, invalid credentials, malformed tokens, `/auth/me` user profile.
- **Customers (17 tests):** Full CRUD, role permissions, search, pagination, assigned sales rep filtering, GST regex format validation (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`), follow-up date validation.
- **Products & Stock (12 tests):** SKU uppercase transformation, duplicate SKU rejection, negative stock prevention, stock movement logging, `low_stock` filtering, and exact zero stock boundary test.
- **Challans (14 tests):** Sequential `CH-YYYYMMDD-NNNN` generation, line item consolidation, draft edit restrictions, atomic confirm stock deduction, 409 insufficient stock rollback proof, and concurrent double-confirm race protection.
- **System Routes (2 tests):** `/health` endpoint and 404 JSON fallback handler.

**All 54 tests pass with 100% coverage of PRD requirements.**

---

## 💻 Local Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL database connection URI (Supabase / Neon / local PostgreSQL)

### 1. Clone & Install
```bash
git clone https://github.com/karthikyernana/fundsroom.git
cd fundsroom

# Install backend & frontend dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
JWT_SECRET="super-secret-key-32-chars-long"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

Create `frontend/.env`:
```env
VITE_API_URL="http://localhost:3001"
```

### 3. Database Migration & Seed
```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Local Servers
```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Frontend Application
cd frontend && npm run dev
```

---

## 🌐 Production Deployment Architecture

### 1. Backend API (Render)
- **Deployment Platform:** Render Web Service
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://fundsroom-green.vercel.app`

### 2. Frontend Application (Vercel)
- **Deployment Platform:** Vercel Static Site
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **SPA Rewrites:** Handled via `frontend/vercel.json` (`/.*` -> `/index.html`)
- **Environment Variable:** `VITE_API_URL=https://fundsroom-lp8g.onrender.com`

---

## 📖 API Documentation Reference

Base URL: `https://fundsroom-lp8g.onrender.com`

| Method | Endpoint | Auth | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | No | All | Authenticate user & return JWT token |
| `GET` | `/auth/me` | Yes | All | Get current authenticated user profile |
| `GET` | `/auth/sales-reps` | Yes | All | List sales representatives for lead assignment |
| `GET` | `/auth/users` | Yes | Admin | List all system users |
| `POST` | `/auth/register` | Yes | Admin | Onboard new user (Admin, Sales, Warehouse, Accounts) |
| `GET` | `/customers` | Yes | All | List customers (supports `search`, `status`, `assigned_to`, `my_customers`, `page`, `limit`) |
| `POST` | `/customers` | Yes | Admin, Sales | Create customer record with assigned sales rep |
| `GET` | `/customers/:id` | Yes | All | Get customer detail with follow-up notes timeline |
| `PUT` | `/customers/:id` | Yes | Admin, Sales | Update customer profile & assigned sales rep |
| `POST` | `/customers/:id/notes` | Yes | Admin, Sales | Append follow-up note to customer timeline |
| `GET` | `/products` | Yes | All | List products (supports `search`, `category`, `low_stock`, `page`, `limit`) |
| `POST` | `/products` | Yes | Admin, Warehouse | Create product record & log opening stock movement |
| `GET` | `/products/:id` | Yes | All | Get product detail with movement count |
| `PUT` | `/products/:id` | Yes | Admin, Warehouse | Update product details (price, alert threshold, location) |
| `POST` | `/products/:id/stock-movements` | Yes | Admin, Warehouse | Record manual `IN` / `OUT` stock movement |
| `GET` | `/products/:id/stock-movements` | Yes | All | Retrieve complete audit-logged stock movement timeline |
| `GET` | `/challans` | Yes | All | List sales challans (supports `status`, `customer`, `page`, `limit`) |
| `POST` | `/challans` | Yes | Admin, Sales, Warehouse | Create draft sales challan with snapshot pricing |
| `GET` | `/challans/:id` | Yes | All | Get challan details with line item snapshots |
| `PUT` | `/challans/:id` | Yes | Admin, Sales, Warehouse | Update draft challan items |
| `POST` | `/challans/:id/confirm` | Yes | Admin, Sales, Warehouse | Confirm challan & atomically deduct stock |
| `POST` | `/challans/:id/cancel` | Yes | Admin, Warehouse | Cancel draft or un-dispatched challan |

---

## ⚠️ Known Limitations & Tradeoffs

1. **In-Memory Post-Filtering for `low_stock`:** Prisma ORM lacks native column-to-column comparison queries (e.g. `WHERE current_stock <= min_stock_alert`). The service fetches category/search filtered records and post-filters in JS. For enterprise scale (100k+ SKUs), this would be refactored to raw SQL `$queryRaw`.
2. **Stateless JWT Expiration:** Tokens expire after 24 hours. Immediate token revocation prior to expiration would require a Redis token blocklist, omitted to keep deployment lightweight.
