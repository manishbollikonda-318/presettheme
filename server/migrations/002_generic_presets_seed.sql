-- ============================================================
-- GENERIC MULTI-TENANT SEED SCRIPT (SaaS Template)
-- Fully customizable per client via the settings panel / database
-- ============================================================

BEGIN;

-- 1. Create Generic Master Tenant
INSERT INTO tenants (id, brand_name, slug, currency_symbol, tax_percent, service_charge_percent, config)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'TableCraft Bistro',
  'tablecraft-bistro',
  '$',
  10.00,
  5.00,
  '{"primaryColor": "#16A34A", "tagline": "Fresh & Fast Dining"}'::jsonb
) ON CONFLICT (slug) DO UPDATE
SET brand_name = EXCLUDED.brand_name,
    currency_symbol = EXCLUDED.currency_symbol,
    tax_percent = EXCLUDED.tax_percent,
    service_charge_percent = EXCLUDED.service_charge_percent;

-- 2. Create Master Outlets
INSERT INTO outlets (id, tenant_id, name, address, phone, timezone)
VALUES
  ('e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Main Downtown Branch', '100 Culinary Avenue, Suite 1', '+1 (555) 234-5678', 'UTC')
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 3. Create Standard Dining Tables (Tables 01 to 08)
INSERT INTO tables (id, outlet_id, table_number, capacity)
VALUES
  ('d9b2d678-0001-4c7b-944a-f5bb54a5c501', 'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', '01', 4),
  ('d9b2d678-0002-4c7b-944a-f5bb54a5c502', 'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', '02', 4),
  ('d9b2d678-0003-4c7b-944a-f5bb54a5c503', 'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', '03', 2),
  ('d9b2d678-0004-4c7b-944a-f5bb54a5c504', 'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', '04', 6),
  ('d9b2d678-0005-4c7b-944a-f5bb54a5c505', 'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', '05', 4),
  ('d9b2d678-0006-4c7b-944a-f5bb54a5c506', 'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531', '06', 4)
ON CONFLICT (outlet_id, table_number) DO NOTHING;

-- 4. Create Standard Staff Accounts
-- Password for all seed accounts: "admin123"
INSERT INTO staff (id, tenant_id, outlet_id, name, email, password_hash, role, title)
VALUES
  (
    'c1a2b3d4-1111-4ef8-bb6d-6bb9bd380a01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531',
    'Store Manager',
    'admin@rms.io',
    '$argon2id$v=19$m=65536,t=3,p=4$qFq8zYkU0bLzQxK8/NqP2g$G6O6bC5H8aKqZ3xX2bV8sL4dE6rT9yU0iO1pA3sD5fG',
    'admin',
    'General Manager'
  ),
  (
    'c1a2b3d4-2222-4ef8-bb6d-6bb9bd380a02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e1a3b5c7-1111-4c7b-944a-f5bb54a5c531',
    'Chef de Cuisine',
    'kitchen@rms.io',
    '$argon2id$v=19$m=65536,t=3,p=4$qFq8zYkU0bLzQxK8/NqP2g$G6O6bC5H8aKqZ3xX2bV8sL4dE6rT9yU0iO1pA3sD5fG',
    'kitchen',
    'Executive Head Chef'
  )
ON CONFLICT (tenant_id, email) DO NOTHING;

-- 5. Universal Categories
INSERT INTO categories (id, tenant_id, name, emoji, sort_order)
VALUES
  ('b1a2c3d4-0001-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Popular Entrees', '🍽️', 1),
  ('b1a2c3d4-0002-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pastas & Bowls', '🍝', 2),
  ('b1a2c3d4-0003-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beverages & Brews', '🥤', 3),
  ('b1a2c3d4-0004-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Desserts', '🍰', 4)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 6. Universal Demo Menu Items
INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, extras)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1a2c3d4-0001-4ef8-bb6d-6bb9bd380a01',
    'Grilled Teriyaki Bowl',
    'Tender chicken glazed with savory house-crafted teriyaki, steamed rice, and charred greens.',
    12.99,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    '["Extra Sauce", "Add Egg", "Extra Protein"]'::jsonb
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1a2c3d4-0002-4ef8-bb6d-6bb9bd380a02',
    'Creamy Truffle Penne',
    'Al dente penne pasta in rich wild mushroom truffle cream sauce, topped with aged parmigiano.',
    15.50,
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=80',
    '["Extra Shaved Parmesan", "Truffle Oil Drizzle", "Garlic Bread"]'::jsonb
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1a2c3d4-0003-4ef8-bb6d-6bb9bd380a03',
    'Artisanal Cold Brew',
    '16-hour steeped single-origin roast served chilled over clear rock ice with citrus twist.',
    4.50,
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
    '["Oat Milk", "Vanilla Bean Syrup", "Sugar Free"]'::jsonb
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1a2c3d4-0004-4ef8-bb6d-6bb9bd380a04',
    'Warm Molten Lava Cake',
    'Decadent dark chocolate soufflé cake served with a scoop of vanilla bean gelato.',
    7.99,
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
    '["Extra Gelato Scoop", "Berry Compote"]'::jsonb
  );

COMMIT;
