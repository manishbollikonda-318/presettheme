import { Router } from 'express';
import { generate, verify, revoke, list, getDemoSession, getKioskSession } from './qr.controller.js';
import { validateBody } from '../../middleware/validateBody.js';
import { generateQRSchema } from './qr.schema.js';
import { authenticateStaff } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { qrVerifyLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// GET /qr/kiosk & /qr/demo — Obtain verified virtual kiosk session for QSR counter pickup
router.get(
  '/kiosk',
  qrVerifyLimiter,
  getKioskSession
);

router.get(
  '/demo',
  qrVerifyLimiter,
  getKioskSession
);

// GET /qr/demo/:tableNumber — Obtain verified guest session (backward compatible)
router.get(
  '/demo/:tableNumber',
  qrVerifyLimiter,
  getDemoSession
);

// POST /qr/generate — Generate encrypted QR token (Admin/Manager only)
router.post(
  '/generate',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(generateQRSchema),
  generate
);

// GET /qr/verify/:token — Guest QR verification (Rate limited, public endpoint issuing guest session JWT)
router.get(
  '/verify/:token',
  qrVerifyLimiter,
  verify
);

// POST /qr/revoke/:id — Revoke a QR token and terminate active guest sessions (Admin/Manager only)
router.post(
  '/revoke/:id',
  authenticateStaff,
  authorize('admin', 'manager'),
  revoke
);

// GET /qr — List active non-expired QR tokens for tenant/outlet
router.get(
  '/',
  authenticateStaff,
  authorize('admin', 'manager'),
  list
);

export default router;
