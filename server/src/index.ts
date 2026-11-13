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
import tenantsRoutes from './modules/tenants/tenants.routes.js';

const app = express();

// Security Hardening
app.use(helmet());

// Dynamic CORS configuration (Supports wildcards, arrays, and credential headers)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, or server-to-server health checks without origin header
      if (!origin) return callback(null, true);

      const allowed = env.CORS_ORIGINS.split(',').map((s) => s.trim());
      if (allowed.includes('*') || allowed.includes(origin)) {
        return callback(null, true);
      }

      callback(null, true); // Permissive in deployment to prevent CORS blockages across Netlify deep links
    },
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

// Health check endpoint (Render health check targets /health)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root ping endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Smart QR Restaurant API' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/qr', qrRoutes);
app.use('/menu', menuRoutes);
app.use('/orders', ordersRoutes);
app.use('/tables', tablesRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/tenants', tenantsRoutes);

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
  // Bind to 0.0.0.0 for Docker/Linux container networking on Render/Fly.io
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`🚀 Smart QR Restaurant Platform API running on http://0.0.0.0:${env.PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
