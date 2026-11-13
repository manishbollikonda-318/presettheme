import { Router } from 'express';
import * as controller from './menu.controller.js';
import { authenticateAny, authenticateStaff } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validateBody.js';
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  toggleStockSchema,
} from './menu.schema.js';

const router = Router();

// ── Categories ──
// GET /menu/categories — Available to authenticated guests & staff
router.get('/categories', authenticateAny, controller.getCategories);

// POST /menu/categories — Admin & Manager only
router.post(
  '/categories',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(createCategorySchema),
  controller.createCategory
);

// PATCH /menu/categories/:id — Admin & Manager only
router.patch(
  '/categories/:id',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(updateCategorySchema),
  controller.updateCategory
);

// DELETE /menu/categories/:id — Admin only
router.delete(
  '/categories/:id',
  authenticateStaff,
  authorize('admin'),
  controller.deleteCategory
);

// ── Menu Items ──
// GET /menu/items — Available to authenticated guests & staff
router.get('/items', authenticateAny, controller.getMenuItems);

// GET /menu/items/:id — Available to authenticated guests & staff
router.get('/items/:id', authenticateAny, controller.getMenuItem);

// POST /menu/items — Admin & Manager only
router.post(
  '/items',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(createMenuItemSchema),
  controller.createMenuItem
);

// PATCH /menu/items/:id — Admin & Manager only
router.patch(
  '/items/:id',
  authenticateStaff,
  authorize('admin', 'manager'),
  validateBody(updateMenuItemSchema),
  controller.updateMenuItem
);

// PATCH /menu/items/:id/stock — 86 toggle accessible to Kitchen, Admin, and Manager
router.patch(
  '/items/:id/stock',
  authenticateStaff,
  authorize('admin', 'manager', 'kitchen'),
  validateBody(toggleStockSchema),
  controller.toggleStock
);

// DELETE /menu/items/:id — Admin only
router.delete(
  '/items/:id',
  authenticateStaff,
  authorize('admin'),
  controller.deleteMenuItem
);

export default router;
