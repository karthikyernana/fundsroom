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
- **Customer Date Validation & Domain Rule:** Updated `follow_up_date` validation in `customer.schema.ts` and `CustomerForm.tsx` to enforce that follow-up dates cannot be set in the past (must be today or a future date).
- **Resilient Sequence Generator:** Refactored `generateChallanNumber()` in `challan.service.ts` to query the highest sequence number matching today's pattern `CH-YYYYMMDD-%` ordered descending, preventing duplicate challan number collisions across timezones or deleted draft numbers.
- **Challan Line Item Consolidation:** Consolidated duplicate product line items in `createChallan` and `updateChallan` (`challan.service.ts`), ensuring clean quantity aggregation and snapshot integrity.
- **Raw SQL Type Casting Fix (500 Error Resolution):** Fixed PostgreSQL raw SQL queries in `addStockMovement` (`product.service.ts`) and `confirmChallan` (`challan.service.ts`) by removing redundant `::uuid` type casting on string parameters matching text column types, resolving unhandled 500 Internal Server Errors.
- **Stock Movement Bounds Validation:** Added client-side quantity checks in `ProductDetail.tsx` to prevent manual `OUT` movements exceeding available stock before calling the API.
- **SKU Alphanumeric Sanitization:** Enforced character pattern validation (`/^[A-Za-z0-9\-_./]+$/`) and non-negative alert/stock bounds in `ProductForm.tsx`.
- **Live Operations Dashboard Metrics:** Added real-time operational metric widgets to Dashboard (`App.tsx`), giving instant visibility into Active Customers, Total Products, Low Stock Alerts, and Total & Draft Challan counts.
- **Toast Notification System:** Created `Toast.tsx` component and integrated toast notifications across all form submissions, stock adjustments, and challan confirmations.
- **Mobile Responsive Drawer:** Added mobile header toggle and sidebar drawer navigation in `App.tsx` and `index.css`.
- **Micro-animations & CSS Design System:** Added active button scaling, spring modal transitions, and table hover micro-interactions while preserving exact PRD design system tokens.

### Key decisions
- **Query Preprocessor over Zod Coerce:** `z.coerce.boolean()` evaluates `Boolean("false")` to `true` in JavaScript. Preprocessing string values explicitly guarantees correct boolean conversion.
- **Toast Notifications for User Feedback:** Replaced silent mutations with Toast popups so users receive immediate visual feedback for all key operations.

---

## Phase 5 — Role Corrections, Feature Additions & Professional UI Polish
**Date:** 2026-08-09

### What was built & fixed

**Role-Based Access Corrections:**
- **Warehouse** now sees Customers module in read-only mode. Warehouse users dispatch challans and need to see customer context. Backend already allowed `GET /customers` for all roles — the frontend was incorrectly hiding it.
- **Sales** now sees Products module in read-only mode. Sales users create challans and need stock visibility when picking products. Backend already allowed `GET /products` for all roles.
- `canWrite` guard in CustomerList/CustomerDetail correctly restricts "New Customer" / "Edit" / "Add Note" buttons to admin and sales only. Warehouse sees data but no mutation buttons.

**User Management (Admin Only):**
- Added `GET /auth/users` and `POST /auth/register` endpoints to `auth.ts` — both guarded by `requireRole('admin')`.
- Input validated with inline Zod schema: name (required, max 100), email (valid format), password (min 8 chars), role (enum admin|sales|warehouse|accounts).
- `409 Conflict` returned if email already exists (prevents duplicates).
- New frontend page `UserManagement.tsx` — admin-only route `/users`, shows user list + inline create form with role description hints.
- **Assumption documented:** Any production ERP requires admins to onboard new employees without reseeding. User creation is implicit to the Admin role. Implemented and documented per PRD §11 (assumptions must be documented).

**PDF Export (Bonus Feature):**
- Implemented `Export PDF` button on confirmed challans only (draft/cancelled challans are not exportable).
- Uses `window.print()` + a `@media print` CSS stylesheet — zero new npm packages, fully within spec.
- Print CSS hides sidebar, nav buttons, modals, and toasts. Shows challan detail in clean print layout.
- `.no-print` utility class added for elements that should be hidden in print view.

**Edge Case Validation (Frontend):**
- Customer form: mobile ≥ 10 digits (existing), GST regex validation (existing), follow_up_date ≥ today (existing + Zod backend).
- Product form: unit_price > 0 validated as positive (existing Zod), min_stock_alert ≥ 0 (existing), opening stock ≥ 0 (existing).
- Stock movement: quantity > 0 (existing), OUT quantity ≤ current_stock (existing client-side guard).
- Challan form: at least 1 item, no zero-quantity items, qty ≤ available stock (existing with inline warning).
- Login: empty field prevention via `required` HTML attribute, loading state disables button to prevent double-submit.
- Backend Zod schemas already cover all server-side validation. No gaps found requiring additional backend changes.

**Professional UI Redesign:**
- Replaced all emoji icons (📦 📋 📄 👥 ⚠️) with proper SVG icons in States.tsx, ChallanDetail.tsx, App.tsx.
- `EmptyState` and `ErrorState` now render styled SVG icon circles instead of large emoji.
- Mobile header (hamburger + title) hidden on desktop via CSS (`display: none` in base, `display: flex` at ≤ 600px). Previously always visible.
- Dashboard metric cards and module tiles use CSS-only hover (`.metric-card:hover`, `.module-tile:hover`) instead of inline `onMouseEnter`/`onMouseLeave` JS handlers.
- Dashboard greeting is time-aware: "Good morning / Good afternoon / Good evening" based on `new Date().getHours()`.
- Login page: dot-grid background texture via `radial-gradient`, staggered entrance animations (logo → card → credentials) at 0/60/120ms delays.
- `@keyframes loginEnter` (fade + scale), `@keyframes pageEnter` (fade + translateY), `@keyframes cardEnter` (fade + scale), `@keyframes modalSlideUp` (more polished spring).
- Sidebar: active indicator left-edge bar (`::before` pseudo-element, scaleY transition), refined opacity transitions on nav icons.
- Tables: `table-clickable` class separates clickable rows (cursor: pointer + hover) from non-clickable ones.
- Buttons: enhanced `btn:active` scale (0.97), shadow on primary/danger/secondary hover for depth.
- Form inputs: 1.5px border (slightly heavier than 1px for crispness), hover state border color change before focus.
- Custom scrollbar on all scrollable containers (6px, rounded).
- Toast: improved slide-in animation with `translateX` + scale for a more polished feel.
- Print stylesheet `@media print` handles PDF export of challans cleanly.
- Modal animation: `modalSlideUp` with scale for premium spring effect.

### Key decisions
- **`window.print()` for PDF:** Avoids adding jsPDF or html2canvas (both are large bundles). The browser's native print dialog supports "Save as PDF" on all platforms. Print CSS ensures clean output. This is the standard approach for simple document export without adding dependencies.
- **No `POST /auth/delete-user` or `PUT /auth/users/:id`:** Keeping write surface minimal. User creation covers the core admin need. Deletion is a sensitive operation that warrants explicit future scope, not assumption.
- **CSS-only hover on Dashboard cards:** Inline JS handlers were being used for hover effects, which defeats the purpose of a CSS design system and prevents proper `:hover` CSS from working. Replaced with `.metric-card` and `.module-tile` classes.
- **`table-clickable` modifier class:** Not all tables have clickable rows (e.g., stock movement log in ProductDetail). Separating the cursor and hover style into a modifier keeps the base table style clean.

---

## Phase 6 — Salesperson Assignment, Role Access Hardening & Stock-Ledger Redesign
**Date:** 2026-08-09

### What was built & fixed

**1. Customer Salesperson Lead Assignment & Portfolio Ownership:**
- Updated Prisma schema with `assigned_to` foreign key on `customers` referencing `users(id)` with relation `assigned_salesperson`.
- Added `GET /auth/sales-reps` API endpoint returning active sales representative accounts (`sales` and `admin` roles).
- Updated `customer.schema.ts` and `customer.service.ts` to validate and persist `assigned_to`, and support `assigned_to` & `my_customers=true` query parameters.
- Updated `CustomerList.tsx` with "All Accounts" vs "My Assigned Accounts" filter tabs for Sales users, a Sales Rep filter dropdown, and an "Assigned Sales Rep" table column.
- Updated `CustomerForm.tsx` with an "Assigned Salesperson" select dropdown.
- Updated `CustomerDetail.tsx` displaying the assigned sales representative contact details.

**2. Stock-Ledger Dashboard Redesign (Eliminating AI-generic visual cues):**
- Redesigned Dashboard metric cards and module tiles in `App.tsx`, completely removing AI-generic left-accent colored borders (`borderLeft`).
- Applied clean paper-ledger aesthetics with subtle parchment borders (`1px solid var(--border)`), dashed tab header dividers, and crisp IBM Plex Mono numeric highlights.
- Added role-specific operational metrics (e.g., "My Assigned Customers" for Sales reps).

**3. Role-Based Access Controls & Field Restrictions:**
- Enforced strict field editability boundaries (e.g., `current_stock` in `ProductForm.tsx` is read-only on product edit, forcing stock changes through audit-logged stock movements).
- Guaranteed that Accounts role receives read-only access with B2B Tax Invoice & Delivery Challan PDF printing/exporting.
- Restricted user creation and user management (`/users`) exclusively to Administrators.

**4. B2B Tax Invoice PDF Export:**
- Provided printable PDF export on `ChallanDetail.tsx` formatted as a B2B Tax Invoice & Delivery Challan with company header, consignee details, and itemized subtotal calculations.
