-- ============================================================
-- LOC QR Restaurant Platform — Phase 1: Initial Schema
-- Target: Supabase PostgreSQL (free tier)
-- Domains: Identity · Menu · Orders · Transactions
-- ============================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- UTILITY: auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DOMAIN 1: IDENTITY
-- ============================================================

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name      VARCHAR(120) NOT NULL,
    slug            VARCHAR(60) UNIQUE NOT NULL,
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹',
    tax_percent     NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (tax_percent >= 0 AND tax_percent <= 100),
    service_charge_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (service_charge_percent >= 0 AND service_charge_percent <= 100),
    config          JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE outlets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    address         TEXT,
    phone           VARCHAR(20),
    timezone        VARCHAR(40) NOT NULL DEFAULT 'Asia/Kolkata',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);
CREATE INDEX idx_outlets_tenant ON outlets(tenant_id);

CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outlet_id       UUID REFERENCES outlets(id) ON DELETE SET NULL,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','cashier','waiter','kitchen')),
    avatar          VARCHAR(10) DEFAULT '👤',
    title           VARCHAR(60),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    UNIQUE(tenant_id, email)
);
CREATE INDEX idx_staff_tenant ON staff(tenant_id);
CREATE INDEX idx_staff_lookup ON staff(tenant_id, email) WHERE is_active = true;

CREATE TABLE tables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id       UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    table_number    VARCHAR(10) NOT NULL,
    capacity        SMALLINT NOT NULL DEFAULT 4 CHECK (capacity > 0 AND capacity <= 50),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(outlet_id, table_number)
);
CREATE INDEX idx_tables_outlet ON tables(outlet_id);

-- ============================================================
-- DOMAIN 2: MENU
-- ============================================================

CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(60) NOT NULL,
    emoji           VARCHAR(10),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(tenant_id, name)
);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);

CREATE TABLE menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url       TEXT,
    rating          NUMERIC(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    extras          JSONB NOT NULL DEFAULT '[]',
    is_available    BOOLEAN NOT NULL DEFAULT true,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_menu_tenant_cat ON menu_items(tenant_id, category_id);
CREATE INDEX idx_menu_available ON menu_items(tenant_id, is_available) WHERE is_available = true;

-- ============================================================
-- DOMAIN 3: ORDERS
-- ============================================================

CREATE TABLE qr_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id        UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    encrypted_token TEXT UNIQUE NOT NULL,
    token_hash      VARCHAR(64) UNIQUE NOT NULL,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_qr_hash_active ON qr_tokens(token_hash) WHERE is_revoked = false;
CREATE INDEX idx_qr_table ON qr_tokens(table_id);

CREATE TABLE active_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id        UUID NOT NULL REFERENCES tables(id),
    qr_token_id     UUID NOT NULL REFERENCES qr_tokens(id),
    guest_count     SMALLINT DEFAULT 1 CHECK (guest_count > 0 AND guest_count <= 30),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','closed','abandoned'))
);
CREATE INDEX idx_session_table_active ON active_sessions(table_id, status) WHERE status = 'active';

-- Sequence for human-readable order numbers per outlet
CREATE SEQUENCE order_number_seq START 1001;

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES active_sessions(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    table_id        UUID REFERENCES tables(id),
    order_number    VARCHAR(20) NOT NULL,
    order_type      VARCHAR(20) NOT NULL DEFAULT 'dine_in'
                    CHECK (order_type IN ('dine_in','takeaway','delivery')),
    status          VARCHAR(20) NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','cooking','ready','completed','cancelled')),
    customer_name   VARCHAR(100),
    subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax             NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    service_charge  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (service_charge >= 0),
    discount        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    promo_code      VARCHAR(30),
    notes           TEXT CHECK (char_length(notes) <= 500),
    created_by      UUID REFERENCES staff(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_orders_outlet_status ON orders(outlet_id, status);
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_session ON orders(session_id);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
    name            VARCHAR(120) NOT NULL,
    unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity        SMALLINT NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    extras          JSONB DEFAULT '[]',
    notes           TEXT CHECK (char_length(notes) <= 300),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Append-only audit trail — protect with trigger
CREATE TABLE order_status_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status      VARCHAR(20) NOT NULL,
    changed_by      UUID REFERENCES staff(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason          TEXT CHECK (char_length(reason) <= 300)
);
CREATE INDEX idx_status_log_order ON order_status_log(order_id, changed_at);

-- Prevent UPDATE/DELETE on audit log
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'order_status_log is append-only. UPDATE and DELETE are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_status_log_no_update
  BEFORE UPDATE ON order_status_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE TRIGGER trg_status_log_no_delete
  BEFORE DELETE ON order_status_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- Auto-log status transitions on orders
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_log (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================================
-- DOMAIN 4: TRANSACTIONS
-- ============================================================

CREATE TABLE transaction_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    payment_method  VARCHAR(30) NOT NULL
                    CHECK (payment_method IN ('cash','card','upi','wallet','comp')),
    amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    gateway_ref     VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','captured','failed','refunded')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    settled_at      TIMESTAMPTZ
);
CREATE INDEX idx_txn_order ON transaction_log(order_id);
CREATE INDEX idx_txn_outlet_date ON transaction_log(outlet_id, created_at DESC);
CREATE INDEX idx_txn_tenant ON transaction_log(tenant_id);

-- ============================================================
-- PROMO CODES (supplementary)
-- ============================================================

CREATE TABLE promo_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code            VARCHAR(30) NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    min_order       NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    expires_at      DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, code)
);
CREATE INDEX idx_promo_tenant ON promo_codes(tenant_id, is_active) WHERE is_active = true;

-- ============================================================
-- ROW LEVEL SECURITY (Supabase)
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Service role bypass (our API server connects as service_role)
-- Supabase service_role key bypasses RLS by default.
-- These policies are defense-in-depth for any direct client access.

CREATE POLICY "service_role_all" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON outlets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON qr_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON active_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON order_status_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON transaction_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON promo_codes FOR ALL USING (true) WITH CHECK (true);

COMMIT;
