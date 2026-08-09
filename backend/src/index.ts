import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import challanRoutes from './routes/challans';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: (origin, callback) => {
    // In production, only allow the configured CORS_ORIGIN
    // In development (no CORS_ORIGIN set), reflect the requesting origin
    if (!origin) return callback(null, true);
    if (!allowedOrigin || process.env.NODE_ENV !== 'production') {
      return callback(null, true); // dev: allow all
    }
    if (origin === allowedOrigin) {
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
