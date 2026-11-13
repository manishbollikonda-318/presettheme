import { query } from '../../config/db.js';
import { NotFoundError, ConflictError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from './menu.schema.js';

export interface CategoryRow {
  id: string;
  tenant_id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItemRow {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  rating: string;
  extras: string[];
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const FALLBACK_CATEGORIES: CategoryRow[] = [
  { id: 'b1a2c3d4-0001-4ef8-bb6d-6bb9bd380a01', tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Popular Entrees', emoji: '🍽️', sort_order: 1, is_active: true },
  { id: 'b1a2c3d4-0002-4ef8-bb6d-6bb9bd380a02', tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Pastas & Bowls', emoji: '🍝', sort_order: 2, is_active: true },
  { id: 'b1a2c3d4-0003-4ef8-bb6d-6bb9bd380a03', tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Beverages & Brews', emoji: '🥤', sort_order: 3, is_active: true },
  { id: 'b1a2c3d4-0004-4ef8-bb6d-6bb9bd380a04', tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Desserts', emoji: '🍰', sort_order: 4, is_active: true },
];

const FALLBACK_ITEMS: MenuItemRow[] = [
  {
    id: 'm1a2c3d4-0001-4ef8-bb6d-6bb9bd380a01',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category_id: 'b1a2c3d4-0001-4ef8-bb6d-6bb9bd380a01',
    name: 'Grilled Teriyaki Bowl',
    description: 'Tender chicken glazed with savory house-crafted teriyaki, steamed rice, and charred greens.',
    price: '12.99',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    rating: '4.9',
    extras: ['Extra Sauce', 'Add Egg', 'Extra Protein'],
    is_available: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1a2c3d4-0002-4ef8-bb6d-6bb9bd380a02',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category_id: 'b1a2c3d4-0002-4ef8-bb6d-6bb9bd380a02',
    name: 'Creamy Truffle Penne',
    description: 'Al dente penne pasta in rich wild mushroom truffle cream sauce, topped with aged parmigiano.',
    price: '15.50',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=80',
    rating: '4.8',
    extras: ['Extra Shaved Parmesan', 'Truffle Oil Drizzle', 'Garlic Bread Slice'],
    is_available: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1a2c3d4-0003-4ef8-bb6d-6bb9bd380a03',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category_id: 'b1a2c3d4-0003-4ef8-bb6d-6bb9bd380a03',
    name: 'Artisanal Cold Brew',
    description: 'Slow-steeped single-origin Arabica beans with clean dark cocoa notes and creamy velvet finish.',
    price: '4.75',
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
    rating: '5.0',
    extras: ['Oat Milk', 'Vanilla Bean Syrup', 'Sugar Free'],
    is_available: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1a2c3d4-0004-4ef8-bb6d-6bb9bd380a04',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category_id: 'b1a2c3d4-0004-4ef8-bb6d-6bb9bd380a04',
    name: 'Warm Molten Lava Cake',
    description: 'Decadent dark chocolate soufflé cake served with a scoop of vanilla bean gelato.',
    price: '7.99',
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
    rating: '4.9',
    extras: ['Extra Gelato Scoop', 'Berry Compote'],
    is_available: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── Categories ──

export async function listCategories(tenantId: string, activeOnly = true): Promise<CategoryRow[]> {
  try {
    const sql = `
      SELECT id, tenant_id, name, emoji, sort_order, is_active
      FROM categories
      WHERE tenant_id = $1 ${activeOnly ? 'AND is_active = true' : ''}
      ORDER BY sort_order ASC, name ASC
    `;
    const result = await query<CategoryRow>(sql, [tenantId]);
    if (result.rows && result.rows.length > 0) {
      return result.rows;
    }
  } catch (err) {
    logger.warn({ err }, 'Live DB query for categories failed, falling back to default presets');
  }
  return FALLBACK_CATEGORIES;
}

export async function createCategory(tenantId: string, input: CreateCategoryInput): Promise<CategoryRow> {
  const existing = await query(
    `SELECT id FROM categories WHERE tenant_id = $1 AND name = $2 LIMIT 1`,
    [tenantId, input.name]
  );
  if (existing.rows.length > 0) {
    throw new ConflictError(`Category '${input.name}' already exists`);
  }

  const result = await query<CategoryRow>(
    `INSERT INTO categories (tenant_id, name, emoji, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tenant_id, name, emoji, sort_order, is_active`,
    [tenantId, input.name, input.emoji || null, input.sort_order ?? 0]
  );
  return result.rows[0];
}

export async function updateCategory(
  tenantId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<CategoryRow> {
  const current = await query<CategoryRow>(
    `SELECT id FROM categories WHERE id = $1 AND tenant_id = $2`,
    [categoryId, tenantId]
  );
  if (!current.rows[0]) {
    throw new NotFoundError('Category');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.emoji !== undefined) {
    fields.push(`emoji = $${idx++}`);
    values.push(input.emoji);
  }
  if (input.sort_order !== undefined) {
    fields.push(`sort_order = $${idx++}`);
    values.push(input.sort_order);
  }
  if (input.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(input.is_active);
  }

  if (fields.length === 0) {
    const fresh = await query<CategoryRow>(
      `SELECT id, tenant_id, name, emoji, sort_order, is_active FROM categories WHERE id = $1`,
      [categoryId]
    );
    return fresh.rows[0];
  }

  values.push(categoryId, tenantId);
  const sql = `
    UPDATE categories
    SET ${fields.join(', ')}
    WHERE id = $${idx++} AND tenant_id = $${idx++}
    RETURNING id, tenant_id, name, emoji, sort_order, is_active
  `;

  const result = await query<CategoryRow>(sql, values);
  return result.rows[0];
}

export async function deleteCategory(tenantId: string, categoryId: string): Promise<void> {
  const checkItems = await query(
    `SELECT id FROM menu_items WHERE category_id = $1 AND tenant_id = $2 LIMIT 1`,
    [categoryId, tenantId]
  );
  if (checkItems.rows.length > 0) {
    throw new ConflictError('Cannot delete category containing existing menu items');
  }

  const result = await query(
    `DELETE FROM categories WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [categoryId, tenantId]
  );
  if (result.rowCount === 0) {
    throw new NotFoundError('Category');
  }
}

// ── Menu Items ──

export async function listMenuItems(
  tenantId: string,
  categoryId?: string,
  availableOnly = false
): Promise<MenuItemRow[]> {
  try {
    const conditions: string[] = ['m.tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (categoryId) {
      conditions.push(`m.category_id = $${idx++}`);
      values.push(categoryId);
    }
    if (availableOnly) {
      conditions.push(`m.is_available = true`);
    }

    const sql = `
      SELECT m.id, m.tenant_id, m.category_id, m.name, m.description, m.price,
             m.image_url, m.rating, m.extras, m.is_available, m.sort_order,
             m.created_at, m.updated_at
      FROM menu_items m
      WHERE ${conditions.join(' AND ')}
      ORDER BY m.sort_order ASC, m.name ASC
    `;

    const result = await query<MenuItemRow>(sql, values);
    if (result.rows && result.rows.length > 0) {
      return result.rows;
    }
  } catch (err) {
    logger.warn({ err }, 'Live DB query for menu items failed, falling back to default presets');
  }

  let items = FALLBACK_ITEMS;
  if (categoryId && categoryId !== 'ALL') {
    items = items.filter((i) => i.category_id === categoryId);
  }
  return items;
}

export async function getMenuItemById(tenantId: string, itemId: string): Promise<MenuItemRow> {
  const result = await query<MenuItemRow>(
    `SELECT id, tenant_id, category_id, name, description, price,
            image_url, rating, extras, is_available, sort_order,
            created_at, updated_at
     FROM menu_items
     WHERE id = $1 AND tenant_id = $2`,
    [itemId, tenantId]
  );
  if (!result.rows[0]) {
    throw new NotFoundError('Menu item');
  }
  return result.rows[0];
}

export async function createMenuItem(tenantId: string, input: CreateMenuItemInput): Promise<MenuItemRow> {
  const categoryCheck = await query(
    `SELECT id FROM categories WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
    [input.category_id, tenantId]
  );
  if (!categoryCheck.rows[0]) {
    throw new NotFoundError('Active category');
  }

  const result = await query<MenuItemRow>(
    `INSERT INTO menu_items (
      tenant_id, category_id, name, description, price, image_url,
      rating, extras, is_available, sort_order
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, tenant_id, category_id, name, description, price,
              image_url, rating, extras, is_available, sort_order,
              created_at, updated_at`,
    [
      tenantId,
      input.category_id,
      input.name,
      input.description || null,
      input.price,
      input.image_url || null,
      input.rating ?? 0,
      JSON.stringify(input.extras || []),
      input.is_available ?? true,
      input.sort_order ?? 0,
    ]
  );

  return result.rows[0];
}

export async function updateMenuItem(
  tenantId: string,
  itemId: string,
  input: UpdateMenuItemInput
): Promise<MenuItemRow> {
  const current = await query<MenuItemRow>(
    `SELECT id FROM menu_items WHERE id = $1 AND tenant_id = $2`,
    [itemId, tenantId]
  );
  if (!current.rows[0]) {
    throw new NotFoundError('Menu item');
  }

  if (input.category_id) {
    const cat = await query(
      `SELECT id FROM categories WHERE id = $1 AND tenant_id = $2`,
      [input.category_id, tenantId]
    );
    if (!cat.rows[0]) {
      throw new NotFoundError('Category');
    }
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.category_id !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(input.category_id);
  }
  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (input.price !== undefined) {
    fields.push(`price = $${idx++}`);
    values.push(input.price);
  }
  if (input.image_url !== undefined) {
    fields.push(`image_url = $${idx++}`);
    values.push(input.image_url);
  }
  if (input.rating !== undefined) {
    fields.push(`rating = $${idx++}`);
    values.push(input.rating);
  }
  if (input.extras !== undefined) {
    fields.push(`extras = $${idx++}`);
    values.push(JSON.stringify(input.extras));
  }
  if (input.is_available !== undefined) {
    fields.push(`is_available = $${idx++}`);
    values.push(input.is_available);
  }
  if (input.sort_order !== undefined) {
    fields.push(`sort_order = $${idx++}`);
    values.push(input.sort_order);
  }

  if (fields.length === 0) {
    return getMenuItemById(tenantId, itemId);
  }

  values.push(itemId, tenantId);
  const sql = `
    UPDATE menu_items
    SET ${fields.join(', ')}
    WHERE id = $${idx++} AND tenant_id = $${idx++}
    RETURNING id, tenant_id, category_id, name, description, price,
              image_url, rating, extras, is_available, sort_order,
              created_at, updated_at
  `;

  const result = await query<MenuItemRow>(sql, values);
  return result.rows[0];
}

export async function setItemStock(tenantId: string, itemId: string, isAvailable: boolean): Promise<MenuItemRow> {
  const result = await query<MenuItemRow>(
    `UPDATE menu_items
     SET is_available = $1
     WHERE id = $2 AND tenant_id = $3
     RETURNING id, tenant_id, category_id, name, description, price,
               image_url, rating, extras, is_available, sort_order,
               created_at, updated_at`,
    [isAvailable, itemId, tenantId]
  );
  if (!result.rows[0]) {
    throw new NotFoundError('Menu item');
  }
  return result.rows[0];
}

export async function deleteMenuItem(tenantId: string, itemId: string): Promise<void> {
  const result = await query(
    `DELETE FROM menu_items WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [itemId, tenantId]
  );
  if (result.rowCount === 0) {
    throw new NotFoundError('Menu item');
  }
}
