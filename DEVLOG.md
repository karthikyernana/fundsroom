# FundsRoom — Development Log

Running log of build decisions, per §9 of the PRD. This is the direct source for the final README.

---

## Phase 1 — Foundation & Data Layer
**Date:** 2026-08-08

### What was built
- Backend scaffold: Express.js + TypeScript (strict mode), Prisma ORM, bcryptjs, jsonwebtoken, zod, cors, dotenv
- Prisma schema for all 7 tables: `users`, `customers`, `customer_notes`, `products`, `stock_movements`, `challans`, `challan_items`
- JWT login (`POST /auth/login`) and `/auth/me` endpoints
- Auth middleware: `authenticate` (JWT verify) + `requireRole(...roles)` factory for RBAC
- Centralized error handler: ZodError → 400 with field-level details, AppError → its status, unknown → 500 (no stack trace leakage)
- Seed script: 4 users (one per role), 5 customers, 5 products (including 1 below min_stock_alert), stock movement history
- Frontend scaffold: Vite + React + TypeScript, TanStack Query, React Router, Axios
- AuthContext with localStorage session persistence
- Full design system CSS: all §2 tokens as CSS custom properties, IBM Plex Sans + IBM Plex Mono, every reusable component class
- Login page with role-aware demo credential shortcuts
- ProtectedRoute component with loading state

### Key decisions

**Why Express.js over NestJS:** Solo, 24-hour build. Express's lighter surface area means less scaffolding overhead and full control over the middleware chain. NestJS's value (DI, decorators, modules) pays off on team builds over longer timelines — not applicable here.

**Why PostgreSQL (Supabase):** The §5 challan confirm transaction requires ACID guarantees — specifically, the ability to lock rows and guarantee atomicity of the stock decrement + movement write + status update. PostgreSQL's `$transaction` with Prisma gives this directly. Supabase chosen over Neon (user preference) — free tier, PostgreSQL under the hood, excellent connection string UX.

**Prisma over raw SQL:** Type-safe schema, auto-migrations, and the `$transaction` API are worth the abstraction. The generated Prisma client makes the `confirmChallan` transaction readable and maintainable.

**`challan_items` price/name/sku snapshots:** Per PRD §4 — a confirmed challan is a historical record. If a product is later renamed or repriced, the dispatched challan must still show what was actually sent. Snapshot fields make this structurally correct without JOIN-time calculations.

**`customer_notes` as its own table:** A single overwritable `notes` field loses history. Sales teams need a scrollable timeline of follow-up activity — normalized table with `created_by` and `created_at` gives this.

**Role permissions (best judgment — see §11 of PRD):**
- Admin: full CRUD everywhere
- Sales: full CRUD on customers + notes, read-only products, create/confirm challans
- Warehouse: read-only customers, full product + stock movements, read + confirm + cancel challans
- Accounts: read-only on everything (financial oversight, no write access)

**8px spacing grid:** Applied as CSS custom properties `--sp1` through `--sp6`. Never ad-hoc values — all spacing derives from multiples of 8px.

**Stamp badge:** The §2 signature element. IBM Plex Mono, `rotate(-1.5deg)`, bordered, uppercase — behaves like a physical ink stamp on a dispatch note. Returns to 0deg on hover. Used exclusively for challan status (`draft` / `confirmed` / `cancelled`).

### Assumptions
- Password reset flow is not in scope (not mentioned in PRD §1).
- The `accounts` role sees challans in read-only mode even though §6 doesn't explicitly specify per-role restrictions on challan list — business logic demands it.
- `gst_number`, `email`, `follow_up_date`, `notes`, and `location` are optional fields per the schema (marked with `?` in PRD §4).

---

*Phase 2 entry will be appended after Core Business APIs are complete.*

---

## Phase 2 — Core Business APIs
**Date:** 2026-08-08

### What was built
- Customer service: list (search/filter/paginate), get (with notes timeline), create, update, addNote
- Customer routes: GET/POST /customers, GET/PUT /customers/:id, POST /customers/:id/notes — role-guarded per the approved permission matrix
- Product service: list (low_stock column-to-column filter via post-processing), get, create (with opening stock movement), update, addStockMovement, getStockMovements
- Product routes: all 6 endpoints — PUT does NOT accept current_stock (forces stock movements for audit trail)
- Challan service: all CRUD + confirmChallan with atomic conditional UPDATE (race-safe)
- Challan routes: all 6 endpoints with role guards
- Zod schemas: customer.schema.ts, product.schema.ts, challan.schema.ts — all with .parse() at route layer

### Key decisions

**`current_stock` not editable via PUT /products/:id:** Stock changes must go through POST /products/:id/stock-movements to maintain a complete audit trail. Blocking direct edits enforces this at the API layer, not just convention.

**Low-stock filter as post-process:** Prisma doesn't support column-to-column comparisons (WHERE current_stock <= min_stock_alert) in its ORM API. Options: raw SQL or post-filter. Post-filter chosen to keep code readable — the dataset is small enough that fetching all and filtering in JS is not a performance concern for this use case.

**Race-condition fix on `confirmChallan`:** The original findUnique+check+decrement pattern has a TOCTOU race at READ COMMITTED isolation. Fixed with a single `$executeRaw` `UPDATE ... WHERE current_stock >= qty`. `$executeRaw` returns rows affected — 0 means the condition failed atomically. A PostgreSQL CHECK (current_stock >= 0) constraint was added via manual migration as a structural backstop. The same atomic pattern is also applied to manual OUT stock movements.

**Challan number server-generated:** Per §4. Pattern: CH-YYYYMMDD-NNNN. Never accepted from the client — the route ignores any `challan_number` field in the request body.

**Snapshot fields on challan_items:** product_name_snapshot, product_sku_snapshot, unit_price_snapshot are written at creation time from the live product data. These are never updated. If the product catalog changes, historical challans remain accurate.

---

## Phase 3 — Challan Engine & Full Frontend
**Date:** 2026-08-08

### What was built
- UI component kit: Spinner, EmptyState, ErrorState, Badge, StampBadge, Modal (portal + Escape + backdrop), Pagination
- TanStack Query hooks: useCustomers, useProducts, useChallans — all with proper cache invalidation
- AuthContext with localStorage session persistence and global 401 redirect
- All 9 frontend pages:
  - CustomerList (search, status filter, paginate), CustomerDetail (info + notes timeline), CustomerForm (create/edit, field-level backend errors)
  - ProductList (search, low-stock checkbox filter, LOW badge), ProductDetail (big stock number + movement log + Adjust Stock modal), ProductForm (create/edit, stock only editable via modal)
  - ChallanList (status filter tabs, StampBadge column), ChallanDetail (line items, confirm/cancel modals, live stock warning), ChallanForm (customer search picker, product search picker with live stock, quantity validation, overstock warning)
- Role-aware App router: per-role route guarding — accounts can't access write routes, correct nav shown per role

### Key decisions

**StampBadge as signature element:** Implemented exactly per §2 — IBM Plex Mono, rotate(-1.5deg), 2px border, returns to 0deg on hover. Used ONLY for challan status. Generic badges use the rounded pill style.

**ChallanForm product picker:** Search-driven rather than showing all products (could be thousands). Shows live current_stock next to each product — overstock warning appears inline when quantity exceeds stock, giving the user visibility before they hit the backend 409.

**TanStack Query cache invalidation on confirm:** useConfirmChallan invalidates both ['challans'] and ['products'] cache on success, because stock changed. This ensures the product list reflects updated stock immediately without a manual refresh.

**Modal via React portal:** Renders into document.body to avoid z-index stacking context issues with the sidebar. Includes Escape key handler, backdrop click close, and body scroll lock.

**Every screen has loading/empty/error states:** No blank screens anywhere — this was a direct PRD requirement (§7).

### Assumptions
- The Vite boilerplate's App.css and react.svg were removed as they would override the custom design system.
- Products route is visible to `accounts` role for read-only access (needed for financial context when reviewing challans).

---

## Phase 4 — System Refinement, Bug Fixes & UI/UX Upgrade
**Date:** 2026-08-09

### What was built & fixed
- **Zod Boolean Query Preprocessor:** Fixed `low_stock` boolean coercion in `product.schema.ts` using `z.preprocess()` so that string `"false"` correctly resolves to `false` instead of coercing to `true`.
- **Customer Date Validation Flexibility:** Updated `follow_up_date` validation in `customer.schema.ts` to accept plain ISO date strings (`YYYY-MM-DD`) as well as full ISO datetime strings.
- **Resilient Sequence Generator:** Refactored `generateChallanNumber()` in `challan.service.ts` to query the highest sequence number matching today's pattern `CH-YYYYMMDD-%` ordered descending, preventing duplicate challan number collisions across timezones or deleted draft numbers.
- **FK User ID Guard in Product Initial Stock:** Fixed `createProduct` stock movement creation so `created_by` references a valid user ID.
- **Live Operations Dashboard Metrics:** Added real-time operational metric widgets to Dashboard (`App.tsx`), giving instant visibility into Active Customers, Total Products, Low Stock Alerts, and Total & Draft Challan counts.
- **Toast Notification System:** Created `Toast.tsx` component and integrated toast notifications across all form submissions, stock adjustments, and challan confirmations.
- **Mobile Responsive Drawer:** Added mobile header toggle and sidebar drawer navigation in `App.tsx` and `index.css`.
- **Micro-animations & CSS Design System:** Added active button scaling, spring modal transitions, and table hover micro-interactions while preserving exact PRD design system tokens.

### Key decisions
- **Query Preprocessor over Zod Coerce:** `z.coerce.boolean()` evaluates `Boolean("false")` to `true` in JavaScript. Preprocessing string values explicitly guarantees correct boolean conversion.
- **Toast Notifications for User Feedback:** Replaced silent mutations with Toast popups so users receive immediate visual feedback for all key operations.


