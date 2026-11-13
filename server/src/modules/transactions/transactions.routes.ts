import { Router } from 'express';
import * as controller from './transactions.controller.js';
import { authenticateStaff } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateQuery } from '../../middleware/validateBody.js';
import { settleTransactionSchema, transactionFilterSchema } from './transactions.schema.js';

const router = Router();

// POST /transactions/settle — Settle payment for an order
router.post(
  '/settle',
  authenticateStaff,
  authorize('admin', 'manager', 'cashier'),
  validateBody(settleTransactionSchema),
  controller.settle
);

// GET /transactions — Audit ledger of all settled transactions
router.get(
  '/',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateQuery(transactionFilterSchema),
  controller.list
);

export default router;
