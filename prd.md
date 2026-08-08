
# PRD — Mini ERP + CRM Operations Portal
**For:** FundsRoom Infotech — Full Stack Developer Intern, Round 1 Technical Case Study
**Timeline:** 24-hour build window
**Build target:** Antigravity-assisted solo build. This document is the single source of truth for what gets built — do not introduce modules, screens, or endpoints beyond what's specified here.

---

## 1. Objective & Scope

Build an internal ERP/CRM tool for a wholesale distribution business, covering customer relationships, product/stock tracking, and outbound sales dispatch, used day-to-day by four internal functions: Admin, Sales, Warehouse, and Accounts. Success is measured by correctness of the underlying business rules (stock can never be oversold), clean and well-documented APIs, and an interface that reads as a considered internal tool rather than a scaffolded demo.

Three modules make up the build: **Customer CRM**, **Product & Inventory**, and **Sales Challan** (outbound dispatch), sitting behind role-based authentication. Purchase orders and standalone invoicing are referenced only as surrounding business context in the source spec and are not part of this build — they don't appear in scope here.

---

## 2. Design System

This is a **stock-ledger / dispatch-tab** visual direction — the interface should feel like a warehouse dispatch counter's paperwork, not a generic SaaS admin template. Avoid the current default AI-generated looks on sight: warm-cream-plus-terracotta, near-black-plus-acid-green, and hairline-rule broadsheet layouts. All three read as templated to anyone reviewing this.

### Palette (CSS variables — use exactly these)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#EDE7DA` | App background — dusty parchment |
| `--ink` | `#211D18` | Primary text |
| `--ledger` | `#1F4D3D` | Primary brand — nav, primary actions, active states (bottle green, never blue) |
| `--stamp` | `#C98A2C` | Secondary accent — badges, highlights |
| `--brick` | `#A6341A` | Alerts — low stock, outbound movement, blocked actions, errors |
| `--olive` | `#4C6B3F` | Confirmations — confirmed status, inbound movement |
| `--border` | `#C9BFA8` | Dividers, table and input borders |

### Typography
- **Headers:** IBM Plex Sans, bold/semibold
- **Body:** IBM Plex Sans, regular
- **Data (SKUs, challan numbers, prices, tables):** IBM Plex Mono — the signature touch that gives data-heavy screens a ledger feel

### Signature element
Challan numbers and status markers (Draft / Confirmed / Cancelled) render as ink-stamp tabs — slightly rotated, bordered, monospace — like a stamp on a paper dispatch note, instead of generic rounded badges. Spend visual effort here; keep everything else quiet.

### Rules
- No blue anywhere, including default link/focus states — `--ledger` is the focus color.
- No out-of-the-box component-library look. Build one small, consistently reused set — table, field, button, modal, badge — rather than reaching for varied off-the-shelf pieces.
- One 8px spacing unit, applied everywhere, no per-screen exceptions.

---

## 3. Tech Stack

### 3.1 Required by the case study — fixed, not a decision point
- Runtime & language: Node.js, TypeScript
- Backend framework: Express.js or NestJS (either accepted)
- Database engine: PostgreSQL or MySQL (either accepted)
- API style: REST, with input validation and error handling
- Frontend: React, HTML, CSS, JavaScript/TypeScript
- UI: responsive
- Auth: JWT-based authentication is explicitly called sufficient

### 3.2 Where the spec allows either option, we picked one — with reasons

| Decision point | Pick | Why this one |
|---|---|---|
| Express.js vs. NestJS | Express.js | Lighter to scaffold and reason about solo, inside a 24-hour window — NestJS's structure pays off on larger teams/timelines, not this one. |
| PostgreSQL vs. MySQL | PostgreSQL | The transactional guarantees Postgres gives directly back the stock-deduction invariant in §5 — this isn't a preference, it's what that specific piece of logic needs. |
| Database host (spec lists Supabase/Neon/Render Postgres as acceptable) | Neon | Free tier that doesn't expire mid-project. |
| Backend host (spec lists Render/Railway/Fly.io as acceptable) | Render | Reliable free web-service tier for a demo deployment. |
| Frontend host (spec lists Vercel/Netlify/Render Static as acceptable) | Vercel | Zero-config static hosting for a Vite build. |

### 3.3 Supporting tooling — not named in the spec at all, needed to execute what it requires

These don't add scope or features; they're what "clean REST APIs with validation and error handling" and "JWT-based auth" actually run on in practice.

| Tool | Implements which requirement |
|---|---|
| Prisma | The PostgreSQL layer above — type-safe schema and migrations for the required database. |
| bcrypt | Password hashing underneath the required JWT auth — JWT alone doesn't specify how passwords are stored. |
| Vite | Build tooling for the required React frontend — not an alternative to React, just how it gets built and served locally. |
| Zod | Implements the spec's own "input validation and error handling" line. |
| TanStack Query | Consistent loading/error/cache handling across screens, in service of the UI quality bar in §7. |
| Plain CSS (design tokens from §2) | Chosen over a component library specifically because of the visual-identity requirement in §2 — not a spec item either way. |

---

## 4. Data Model

```
users            (id, name, email, password_hash, role[admin|sales|warehouse|accounts], created_at)
customers        (id, name, mobile, email, business_name, gst_number?, 
                  customer_type[retail|wholesale|distributor], address, 
                  status[lead|active|inactive], follow_up_date?, notes, created_at, updated_at)
customer_notes   (id, customer_id→customers, note, created_by→users, created_at)
products         (id, name, sku[unique], category, unit_price, current_stock, 
                  min_stock_alert, location, created_at, updated_at)
stock_movements  (id, product_id→products, quantity_changed, movement_type[IN|OUT], 
                  reason, created_by→users, created_at)
challans         (id, challan_number[unique, server-generated], customer_id→customers,
                  status[draft|confirmed|cancelled], total_quantity, created_by→users, created_at)
challan_items    (id, challan_id→challans, product_id→products, 
                  product_name_snapshot, product_sku_snapshot, unit_price_snapshot, 
                  quantity, subtotal)
```

`customer_notes` is its own table rather than a single overwritable field, because follow-ups need a running history a sales user can scroll through. `challan_items` carries its own copies of the product's name, SKU, and price at the moment the line was added — a challan must keep an accurate historical record of what was actually dispatched, independent of any later edits to the product catalog.

---

## 5. Critical Business Logic

Confirming a challan is the one place correctness is non-negotiable, and it must run as a single database transaction:

1. Re-check every line item's product stock inside the transaction.
2. If any product's available stock is less than the requested quantity, abort the entire transaction and return a `409 Conflict` naming the specific product(s) at fault — no partial confirmation.
3. If every line clears, decrement `current_stock` for each product, write a matching `OUT` row to `stock_movements`, and set the challan's status to confirmed.
4. Stock going negative is an invariant violation, not something the UI merely discourages — it must be structurally impossible.

Challan numbers are generated server-side on creation and are never accepted from the client.

---

## 6. API Surface

```
POST   /auth/login
GET    /auth/me

GET    /customers            ?search=&status=&page=&limit=
POST   /customers
GET    /customers/:id
PUT    /customers/:id
POST   /customers/:id/notes

GET    /products             ?search=&category=&page=&limit=
POST   /products
PUT    /products/:id
GET    /products/:id
POST   /products/:id/stock-movements
GET    /products/:id/stock-movements

GET    /challans             ?status=&customer=&page=&limit=
POST   /challans
GET    /challans/:id
PUT    /challans/:id
POST   /challans/:id/confirm
POST   /challans/:id/cancel
```

Every list endpoint supports pagination and search/filter via query parameters. Every response uses a consistent JSON error envelope and the HTTP status code that actually matches the outcome (200/201/400/401/403/404/409/500) — this is a direct implementation of the source spec's API expectations, not an extension beyond them.

---

## 7. Code & UI Quality Standards

**Backend:**
- TypeScript strict mode across the codebase
- One centralized error-handling middleware — no unhandled rejections leaking raw stack traces
- Every write endpoint validated with Zod before it touches business logic
- Business logic lives in service functions, not inline in route handlers
- No endpoint returns 200 for a failure — status codes are meaningful, not decorative

**Frontend:**
- Every list/detail screen has distinct loading, empty, and error states — never a blank screen
- Navigation is role-aware: each of the four roles sees only what's relevant to it
- Forms validate client-side and surface backend validation errors field-by-field, not as a single generic message
- Fully responsive down to tablet width
- Design tokens from §2 applied with no one-off inline styles

---

## 8. Git Commit Policy

**Cadence:** commit at the end of every logical unit — one schema migration, one resource's full CRUD, one business-logic function, one frontend screen — not batched into a handful of end-of-day commits. Commit before moving from one build phase to the next. Across the full build this should produce roughly 15–25 commits, not 3–4. Antigravity commits proactively as each unit completes; this is a standing instruction, not something to prompt for each time.

**Message format** — Conventional Commits, `type(scope): description`, imperative mood, one change per commit:
- `feat(auth): add JWT login with role claims`
- `feat(customers): add CRUD endpoints with validation`
- `feat(challans): add stock-safe confirm transaction`
- `fix(products): prevent negative stock on OUT movement`
- `docs(readme): add local setup and env var instructions`
- `chore(deploy): add render + vercel config`

No `wip`, `update`, or catch-all messages — `type` ∈ `feat|fix|chore|docs|refactor|test`, `scope` names the affected module.

---

## 9. Documentation Policy

Documentation is produced alongside the build, not written cold at the end:

- A running `DEVLOG.md` starts in Phase 1. After every phase, it's appended with what was built, the key decisions made and why (schema shape, business-logic choices), and any assumptions.
- This running log is the direct source for the final README's architecture and assumptions sections — nothing gets reconstructed from memory under time pressure in the last phase.
- The README itself is built progressively: setup steps written as the setup happens, environment variables documented as they're introduced.
- Each phase in §10 ends with a required documentation update before the next phase starts.

---

## 10. Build Phases

Four phases. Each ends with a commit checkpoint (§8) and a documentation update (§9).

### Phase 1 — Foundation & Data Layer
- Scaffold backend (Express + TS) and frontend (Vite + React + TS)
- Prisma schema for all seven tables, migration, and a seed script covering one user per role plus a handful of sample customers/products
- JWT login and role-guard middleware
- `.env.example`, CORS configuration
- Design tokens (§2) wired in as CSS variables, applied to a styled login screen
- **Done when:** all four roles can log in locally and receive a role-correct token.

### Phase 2 — Core Business APIs
- Customer CRUD, search, and the notes endpoint
- Product CRUD and stock-movement logging, with the non-negative-stock guard enforced at the API layer
- Zod validation and the shared error envelope on every endpoint from this phase
- **Done when:** every endpoint in §6 except the challan routes is testable in Postman with correct status codes on both success and failure paths.

### Phase 3 — Sales Challan Engine & Full Frontend
- Challan endpoints including the §5 transaction
- Frontend shell with role-aware navigation
- Customer screens: list/search, detail, add/edit, notes timeline
- Product/inventory screens: list, add/edit, stock movement log, low-stock indicator
- Challan flow: customer selection, multi-product picker with live stock, draft save, confirm, with the stamp-badge status treatment
- **Done when:** the full flow works locally end to end — login, new customer, new product, new challan, confirm, stock visibly decremented.

### Phase 4 — Hardening, Deployment & Submission Package
- Loading/empty/error states finished across every screen
- Deploy database to Neon, backend to Render, frontend to Vercel, with environment variables configured on each platform
- Export a Postman collection; finalize the README from the accumulated `DEVLOG.md`, covering setup, environment variables, local run steps, deployment steps, assumptions, architecture summary, and known limitations
- Full manual pass across all four roles against the deployed app, not just localhost
- **Done when:** everything in §12 is complete and verified against the live URLs.

---

## 11. AI Responsibilities vs. Your Responsibilities

**Antigravity handles:** both repo scaffolds, the Prisma schema and migrations, all CRUD endpoints with validation and error handling, JWT middleware and role guards, the §5 transaction, React components matching the design tokens, the Postman collection, the progressive README/DEVLOG updates, and committing per §8 as each unit completes.

**You handle directly:** creating the actual accounts on Neon, Render, Vercel, and GitHub, and entering connection strings/env vars into their dashboards — this is UI interaction outside the agent's reach. Pushing commits and confirming the deployment genuinely works by clicking through the live URLs yourself. Reviewing the §5 transaction logic once it's generated, since you're accountable for what ships. Keeping the build within the scope defined in §1 — flag and cut anything that drifts beyond it.

---

## 12. Submission Checklist

- [ ] GitHub repository, with a clean, periodic commit history per §8
- [ ] Live frontend URL
- [ ] Live backend API URL
- [ ] Test login credentials for all four roles
- [ ] Postman collection or equivalent API documentation
- [ ] README covering setup, environment variables, local run, deployment, and assumptions
- [ ] Short written architecture summary
- [ ] Known limitations, stated honestly
- [ ] Screen recording of the build/demo walkthrough
- [ ] Final submission form completed with all of the above

---

## 13. Time & Effort Budget

24-hour build window, with documentation treated as its own line item across every phase rather than compressed into the end.

| Phase | Build | Docs | Total |
|---|---|---|---|
| 1 — Foundation & Data Layer | 2.5h | 1.5h | 4h |
| 2 — Core Business APIs | 3h | 2h | 5h |
| 3 — Challan Engine & Frontend | 6h | 3h | 9h |
| 4 — Hardening, Deployment & Submission | 2h | 2h | 4h |
| Buffer | — | — | 2h |
| **Total** | **13.5h** | **8.5h** | **24h** |

Roughly 8–9 hours of the total window goes to documentation writing — `DEVLOG.md` entries, the progressive README, and the architecture summary — distributed across all four phases so it never becomes a rushed final task. If time runs short anywhere, trim Phase 3's frontend polish before touching Phase 4's deployment or documentation time.
