import { Router } from 'express';
import { generate, verify, revoke, list, getDemoSession } from './qr.controller.js';
import { validateBody } from '../../middleware/validateBody.js';
import { generateQRSchema } from './qr.schema.js';
import { authenticateStaff } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { qrVerifyLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// GET /qr/demo & /qr/demo/:tableNumber — Obtain verified guest session bound to physical table
router.get(
  '/demo',
  qrVerifyLimiter,
  getDemoSession
);

router.get(
  '/demo/:tableNumber',
  qrVerifyLimiter,
  getDemoSession
);

// POST /qr/generate — Generate encrypted QR token strictly bound to physical table (Admin/Manager only)
router.post(
  '/generate',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(generateQRSchema),
  generate
);

// GET /qr/verify/:token — Guest QR verification (Rate limited, public endpoint issuing table guest session JWT)
router.get(
  '/verify/:token',
  qrVerifyLimiter,
  verify
);

// POST /qr/revoke/:id — Revoke a QR token and terminate active table sessions (Admin/Manager only)
router.post(
  '/revoke/:id',
  authenticateStaff,
  authorize('admin', 'manager'),
  revoke
);

// GET /qr/list — List active table QR tokens for an outlet (Admin/Manager only)
router.get(
  '/list',
  authenticateStaff,
  authorize('admin', 'manager'),
  list
);

export default router;
