import type { Request, Response, NextFunction } from 'express';
import * as menuService from './menu.service.js';
import { AuthError } from '../../shared/errors.js';

function extractTenantId(req: Request): string {
  if (req.token && 'tid' in req.token) {
    return req.token.tid;
  }
  throw new AuthError('Tenant context missing from token');
}

// ── Categories ──

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const activeOnly = req.token?.scope === 'guest' ? true : req.query.active_only !== 'false';
    const categories = await menuService.listCategories(tenantId, activeOnly);
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const category = await menuService.createCategory(tenantId, req.body);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const id = String(req.params.id);
    const category = await menuService.updateCategory(tenantId, id, req.body);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const id = String(req.params.id);
    await menuService.deleteCategory(tenantId, id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

// ── Menu Items ──

export async function getMenuItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const categoryId = req.query.category_id as string | undefined;
    const availableOnly = req.token?.scope === 'guest' ? true : req.query.available_only === 'true';
    const items = await menuService.listMenuItems(tenantId, categoryId, availableOnly);
    res.status(200).json({ items, count: items.length });
  } catch (err) {
    next(err);
  }
}

export async function getMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const id = String(req.params.id);
    const item = await menuService.getMenuItemById(tenantId, id);
    res.status(200).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function createMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const item = await menuService.createMenuItem(tenantId, req.body);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const id = String(req.params.id);
    const item = await menuService.updateMenuItem(tenantId, id, req.body);
    res.status(200).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function toggleStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const id = String(req.params.id);
    const { is_available } = req.body;
    const item = await menuService.setItemStock(tenantId, id, is_available);
    res.status(200).json({ item, message: `Item is now ${is_available ? 'In Stock' : '86ed (Sold Out)'}` });
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = extractTenantId(req);
    const id = String(req.params.id);
    await menuService.deleteMenuItem(tenantId, id);
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    next(err);
  }
}
