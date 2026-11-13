import { Router } from 'express';
import * as controller from './tables.controller.js';
import { authenticateStaff } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validateBody.js';
import { createTableSchema, updateTableSchema, closeSessionSchema } from './tables.schema.js';

const router = Router();

// GET /tables — List tables with live order/session statuses
router.get(
  '/',
  authenticateStaff,
  authorize('admin', 'manager', 'cashier', 'waiter'),
  controller.getTables
);

// POST /tables — Create table
router.post(
  '/',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(createTableSchema),
  controller.createTable
);

// PATCH /tables/:id — Update table details
router.patch(
  '/:id',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(updateTableSchema),
  controller.updateTable
);

// POST /tables/:id/close-session — Evict active guest session & free table
router.post(
  '/:id/close-session',
  authenticateStaff,
  authorize('admin', 'manager', 'cashier'),
  validateBody(closeSessionSchema),
  controller.closeSession
);

export default router;
