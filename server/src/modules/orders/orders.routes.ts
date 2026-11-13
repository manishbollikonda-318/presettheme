import { Router } from 'express';
import * as controller from './orders.controller.js';
import { authenticateAny, authenticateStaff } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateQuery } from '../../middleware/validateBody.js';
import { orderCreateLimiter } from '../../middleware/rateLimiter.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderFilterQuerySchema,
} from './orders.schema.js';

const router = Router();

// POST /orders — Create new order (Guest with QR session JWT or Staff POS/waiter)
router.post(
  '/',
  authenticateAny,
  orderCreateLimiter,
  validateBody(createOrderSchema),
  controller.createOrder
);

// GET /orders/stream — Server-Sent Events (SSE) live stream for Kitchen Display System
router.get(
  '/stream',
  authenticateStaff,
  authorize('admin', 'manager', 'kitchen', 'cashier'),
  controller.streamOrders
);

// GET /orders — Filter and list active queue (Staff only)
router.get(
  '/',
  authenticateStaff,
  authorize('admin', 'manager', 'cashier', 'kitchen', 'waiter'),
  validateQuery(orderFilterQuerySchema),
  controller.listOrders
);

// GET /orders/:id — Retrieve single ticket (Staff or owner guest)
router.get(
  '/:id',
  authenticateAny,
  controller.getOrder
);

// PATCH /orders/:id/status — Transition ticket status (Kitchen, Cashier, Waiter, Admin, Manager)
router.patch(
  '/:id/status',
  authenticateStaff,
  authorize('admin', 'manager', 'kitchen', 'cashier', 'waiter'),
  validateBody(updateOrderStatusSchema),
  controller.updateStatus
);

export default router;
