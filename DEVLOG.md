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
