import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './shared/logger.js';
import { AppError } from './shared/errors.js';

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
import qrRoutes from './modules/qr/qr.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import tablesRoutes from './modules/tables/tables.routes.js';
import transactionsRoutes from './modules/transactions/transactions.routes.js';

const app = express();

// Security Hardening
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.debug({ method: req.method, path: req.path, ip: req.ip }, 'Incoming request');
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/qr', qrRoutes);
app.use('/menu', menuRoutes);
app.use('/orders', ordersRoutes);
app.use('/tables', tablesRoutes);
app.use('/transactions', transactionsRoutes);

// Default Deny 404 handler for undefined endpoints
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Endpoint ${req.method} ${req.path} not found`, 'NOT_FOUND'));
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details || undefined,
    });
    return;
  }

  logger.error({ err }, 'Unhandled internal server error');
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(`🚀 LOC QR Restaurant Platform API running on port ${env.PORT}`);
  });
}

export default app;
