# FundsRoom — Mini ERP + CRM Operations Portal

Internal operations tool for a wholesale distribution business. Covers Customer CRM, Product & Inventory tracking, and Sales Challan (outbound dispatch), behind role-based authentication.

**Built for:** FundsRoom Infotech Full Stack Developer Intern Case Study

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | *(Vercel — added in Phase 4)* |
| Backend API | *(Render — added in Phase 4)* |

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@fundsroom.com | password123 |
| Sales | sales@fundsroom.com | password123 |
| Warehouse | warehouse@fundsroom.com | password123 |
| Accounts | accounts@fundsroom.com | password123 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express.js + TypeScript (strict) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Frontend | React + TypeScript (Vite) |
| Data fetching | TanStack Query |
| HTTP client | Axios |
| Styling | Plain CSS with custom design tokens |
| Fonts | IBM Plex Sans + IBM Plex Mono (Google Fonts) |

---

## Local Setup

### Prerequisites
- Node.js v18+
- A Supabase project (free tier) — get the PostgreSQL connection string from Settings → Database → Connection String (URI mode)

### 1. Clone and install

```bash
git clone https://github.com/karthikyernana/fundsroom.git
cd fundsroom

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Backend environment

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL URI |
| `JWT_SECRET` | Long random string for signing tokens |
| `PORT` | Server port (default: 3001) |
| `CORS_ORIGIN` | Frontend URL (default: http://localhost:5173) |
| `NODE_ENV` | `development` or `production` |

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Database setup

```bash
cd backend

# Run migrations
npx prisma migrate dev --name init

# Seed with sample data
npm run db:seed
```

### 4. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  
Health check: http://localhost:3001/health

---

## API Reference

Full Postman collection: `FundsRoom.postman_collection.json` *(added in Phase 4)*

Base URL: `http://localhost:3001`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/login | — | Login, receive JWT |
| GET | /auth/me | ✓ | Current user |
| GET | /customers | ✓ | List + search + paginate |
| POST | /customers | ✓ | Create customer |
| GET | /customers/:id | ✓ | Customer detail |
| PUT | /customers/:id | ✓ | Update customer |
| POST | /customers/:id/notes | ✓ | Add note |
| GET | /products | ✓ | List + search + paginate |
| POST | /products | ✓ | Create product |
| GET | /products/:id | ✓ | Product detail |
| PUT | /products/:id | ✓ | Update product |
| POST | /products/:id/stock-movements | ✓ | Add stock movement |
| GET | /products/:id/stock-movements | ✓ | Movement history |
| GET | /challans | ✓ | List + filter + paginate |
| POST | /challans | ✓ | Create draft challan |
| GET | /challans/:id | ✓ | Challan detail |
| PUT | /challans/:id | ✓ | Update draft challan |
| POST | /challans/:id/confirm | ✓ | Confirm (stock-safe transaction) |
| POST | /challans/:id/cancel | ✓ | Cancel challan |

---

## Deployment

*(Completed in Phase 4 — steps will be filled here)*

---

## Architecture Summary

*(Completed in Phase 4 from accumulated DEVLOG.md)*

---

## Known Limitations

*(Filled honestly in Phase 4)*

---

*This README is built progressively alongside the build per §9 of the PRD. See DEVLOG.md for build decisions and assumptions.*
