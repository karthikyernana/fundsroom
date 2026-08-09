# FundsRoom — Mini ERP + CRM Operations Portal

Technical documentation and project submission overview for the Mini ERP + CRM system built according to the case study specifications.

---

## 1. Project Links & Submissions

- **GitHub Repository:** `[Insert your GitHub Repository URL]`
- **Live Frontend URL:** `[Insert your Live Frontend URL]`
- **Live Backend API URL:** `[Insert your Live Backend API URL]`
- **API Health Check:** `[Insert your Live Backend API URL]/health`
- **Postman API Collection:** Included in root directory as `FundsRoom.postman_collection.json`

---

## 2. Test Login Credentials & Permission Matrix

All pre-seeded test accounts share the default password: `password123`

| Role | Email | Password | Access Scope & Module Permissions |
|---|---|---|---|
| Admin | admin@fundsroom.com | password123 | Full system access across all modules. Admin user onboarding via `/users`. |
| Sales Lead | sales@fundsroom.com | password123 | Full CRM access, sales rep lead assignment, portfolio filtering, draft & confirm challans. |
| Sales Rep 2 | sales2@fundsroom.com | password123 | Assigned customer portfolio tracking, lead management, draft & confirm sales challans. |
| Warehouse | warehouse@fundsroom.com | password123 | Product CRUD, manual stock movements, read customer context, dispatch challans. |
| Accounts | accounts@fundsroom.com | password123 | Read-only oversight across all modules, snapshot pricing inspection, B2B Tax Invoice export. |

---

## 3. Technology Stack

- **Backend Runtime:** Node.js (v18+) with TypeScript
- **Backend Framework:** Express.js
- **Database:** PostgreSQL (Supabase / Neon)
- **ORM & Validation:** Prisma ORM with Zod runtime validation
- **Authentication:** Stateless JWT (`jsonwebtoken`) with `bcryptjs` password hashing
- **Frontend Framework:** React 19 + TypeScript (built with Vite)
- **State & Data Fetching:** TanStack Query (React Query v5) with Axios
- **Styling:** Custom CSS design system adhering to specified color & typography tokens

---

## 4. Architecture & Business Logic

### Atomic Transaction Safety (Preventing Negative Stock)
Outbound sales challan confirmation uses an atomic SQL update via Prisma `$executeRaw` to prevent overdrawing inventory during concurrent requests:

```sql
UPDATE "products"
SET "current_stock" = "current_stock" - $qty, "updated_at" = NOW()
WHERE "id" = $productId::uuid AND "current_stock" >= $qty;
```

If stock is insufficient at the instant of execution, the transaction cleanly aborts and rolls back all line items without affecting inventory. A database-level `CHECK ("current_stock" >= 0)` constraint serves as an engine backstop.

### Historical Line Item Snapshots
When a draft challan is created, product name, SKU, and unit price are saved as static snapshot fields on `challan_items`. Future catalog price changes or product renames will never corrupt historical sales records.

### Stock Audit Trail
Direct edits to product stock via general update endpoints are disabled. All inventory adjustments must originate from either a confirmed sales challan or an explicit stock movement entry with user attribution and an audit reason.

---

## 5. Core Modules & Features

### Authentication & Roles
- JWT-based authentication with role claims.
- Guarded routes enforcing per-role permissions for Admin, Sales, Warehouse, and Accounts.
- User management interface (`/users`) for Admin account creation.

### Customer CRM Module
- Customer management with fields for name, mobile, email, business name, GST number, customer type, address, status, follow-up date, and assigned sales representative.
- Customer search, portfolio filtering, follow-up date validation, and scrollable activity notes timeline.

### Product & Inventory Module
- Product management with SKU formatting, category assignment, unit pricing, location tracking, and low-stock alert thresholds.
- Audit-logged stock movements tracking quantity changed, movement type (IN/OUT), audit reason, user attribution, and timestamp.

### Sales Challan Module
- Sales challan creation with customer selection, multi-product line items, live stock checks, overstock warnings, and server-generated sequential numbering (`CH-YYYYMMDD-NNNN`).
- Challan lifecycle management (Draft, Confirmed, Cancelled) and printable B2B Tax Invoice / Delivery Challan layout.

---

## 6. Automated Integration Test Suite

The backend includes an integration test suite verifying all 23 case study requirements across authentication, customer CRM, product inventory, and sales challan workflows.

### Running Tests
```bash
cd backend
npm test
```

---

## 7. Local Development Setup

### 1. Clone & Install
```bash
git clone [Insert your GitHub Repository URL]
cd fundsroom

cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Create `backend/.env`:
```env
DATABASE_URL="[Insert your PostgreSQL connection URI]"
JWT_SECRET="[Insert a 32-character secret key]"
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

### 4. Run Development Servers
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## 8. Deployment Setup

### Backend (Render)
1. Create a Web Service connected to your repository with root directory set to `backend`.
2. Build Command: `npm install && npx prisma generate && npm run build`
3. Start Command: `npm start`
4. Set Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=[Insert your Live Frontend URL]`

### Frontend (Vercel)
1. Import repository into Vercel with root directory set to `frontend`.
2. Framework Preset: Vite
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set Environment Variable: `VITE_API_URL=[Insert your Live Backend API URL]`

---

## 9. Known Limitations

1. **In-Memory Low-Stock Filtering:** Low-stock alerts filter results in application logic due to ORM column-to-column query constraints. For enterprise scale (100k+ SKUs), this would be refactored to raw SQL.
2. **Stateless JWT Lifetime:** Tokens expire after 24 hours. Token revocation prior to expiration requires a blocklist store.
