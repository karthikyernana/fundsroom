import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import challanRoutes from './routes/challans';
import docsRoutes from './routes/docs';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Boot-time env validation (fail fast, not per-request) ───────────────────
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured');
}
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured');
}
const allowedOrigin = process.env.CORS_ORIGIN;
if (process.env.NODE_ENV === 'production' && !allowedOrigin) {
  throw new Error('CORS_ORIGIN must be configured when NODE_ENV is production');
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } },
}));
app.use(cors({
  origin: (origin, callback) => {
    // In production, only allow the configured CORS_ORIGIN.
    // In development, default to the local Vite dev server unless overridden.
    if (!origin) return callback(null, true);
    const devOrigins = allowedOrigin ? [allowedOrigin] : ['http://localhost:5173', 'http://127.0.0.1:5173'];
    const allowList = process.env.NODE_ENV === 'production' ? [allowedOrigin!] : devOrigins;
    if (allowList.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/challans', challanRoutes);
app.use('/docs', docsRoutes);

// A useful landing response for the deployed API URL. Resource routes remain
// intentionally namespaced, but opening the base URL should guide operators
// instead of looking like a broken deployment.
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'FundsRoom Operations API',
      status: 'ok',
      health: '/health',
      documentation: '/docs',
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler — must be before errorHandler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// ─── Centralized error handler ───────────────────────────────────────────────
app.use(errorHandler);

// ─── Start — only when run directly, not when imported by tests ──────────────
if (require.main === module) {
  const portNum = Number(PORT);
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`🚀 FundsRoom API running on http://localhost:${portNum}`);
    console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

export default app;
