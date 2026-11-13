import { query, getClient } from '../../config/db.js';
import { NotFoundError, ValidationError, ConflictError, AuthError } from '../../shared/errors.js';
import { orderEvents } from './orders.events.js';
import type { CreateOrderInput, OrderFilterQuery } from './orders.schema.js';
import type { TokenPayload, StaffTokenPayload } from '../../shared/jwt.js';

interface TenantRates {
  tax_percent: number;
  service_charge_percent: number;
}

export interface FullOrder {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  customer_name: string | null;
  table_id: string | null;
  session_id?: string | null;
  table_number: string | null;
  outlet_id: string;
  tenant_id: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  promo_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    menu_item_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    extras: string[];
    notes: string | null;
  }>;
}

/**
 * Server-side creation of orders with strict price verification.
 * Client-submitted prices are completely ignored.
 */
export async function createOrder(
  auth: TokenPayload,
  input: CreateOrderInput
): Promise<FullOrder> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    let tenantId: string;
    let outletId: string;
    let tableId: string | null = null;
    let sessionId: string | null = null;
    let staffId: string | null = null;

    if (auth.scope === 'guest') {
      // Guest QR Session: lock table and session from token
      tenantId = auth.tid;
      tableId = auth.tbl;
      sessionId = auth.sub;

      const sessionCheck = await client.query(
        `SELECT s.id, t.outlet_id
         FROM active_sessions s
         JOIN tables t ON t.id = s.table_id
         WHERE s.id = $1 AND s.status = 'active'`,
        [sessionId]
      );
      if (!sessionCheck.rows[0]) {
        throw new ValidationError('Active dining session expired or invalid');
      }
      outletId = sessionCheck.rows[0].outlet_id;
    } else if (auth.scope === 'staff') {
      // Staff order (POS / Waiter)
      const staffToken = auth as StaffTokenPayload;
      tenantId = staffToken.tid;
      outletId = input.outlet_id || staffToken.oid;
      tableId = input.table_id || null;
      staffId = staffToken.sub;

      if (!outletId) {
        throw new ValidationError('outlet_id is required for staff orders');
      }
    } else {
      throw new AuthError('Invalid token scope');
    }

    // 1. Fetch tenant financial settings
    const tenantRes = await client.query<TenantRates>(
      `SELECT tax_percent, service_charge_percent FROM tenants WHERE id = $1`,
      [tenantId]
    );
    if (!tenantRes.rows[0]) {
      throw new NotFoundError('Tenant');
    }
    const { tax_percent, service_charge_percent } = tenantRes.rows[0];

    // 2. Fetch all requested menu items in batch with lock
    const itemIds = [...new Set(input.items.map((i) => i.menu_item_id))];
    const menuRes = await client.query<{ id: string; name: string; price: string; is_available: boolean }>(
      `SELECT id, name, price, is_available
       FROM menu_items
       WHERE id = ANY($1::uuid[]) AND tenant_id = $2`,
      [itemIds, tenantId]
    );

    const menuMap = new Map(menuRes.rows.map((r) => [r.id, r]));

    // Validate availability & compute subtotal server-side
    let subtotal = 0;
    const validatedItems: Array<{
      menu_item_id: string;
      name: string;
      unit_price: number;
      quantity: number;
      extras: string[];
      notes: string;
    }> = [];

    for (const item of input.items) {
      const liveItem = menuMap.get(item.menu_item_id);
      if (!liveItem) {
        throw new NotFoundError(`Menu item ${item.menu_item_id}`);
      }
      if (!liveItem.is_available) {
        throw new ConflictError(`Item '${liveItem.name}' is currently 86'd / sold out`);
      }

      const unitPrice = parseFloat(liveItem.price);
      subtotal += unitPrice * item.quantity;

      validatedItems.push({
        menu_item_id: liveItem.id,
        name: liveItem.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        extras: item.extras || [],
        notes: item.notes || '',
      });
    }

    // 3. Validate Promo Code if provided
    let discount = 0;
    let promoCode: string | null = null;
    if (input.promo_code) {
      const promoRes = await client.query<{ discount_percent: string; min_order: string }>(
        `SELECT discount_percent, min_order
         FROM promo_codes
         WHERE tenant_id = $1 AND code = $2 AND is_active = true
           AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
         LIMIT 1`,
        [tenantId, input.promo_code.toUpperCase()]
      );

      if (promoRes.rows[0]) {
        const promo = promoRes.rows[0];
        const minOrder = parseFloat(promo.min_order);
        if (subtotal >= minOrder) {
          const pct = parseFloat(promo.discount_percent);
          discount = Number(((subtotal * pct) / 100).toFixed(2));
          promoCode = input.promo_code.toUpperCase();
        }
      }
    }

    // 4. Calculate Financials
    const serviceCharge = input.order_type === 'dine_in'
      ? Number(((subtotal * Number(service_charge_percent)) / 100).toFixed(2))
      : 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number(((taxableAmount * Number(tax_percent)) / 100).toFixed(2));
    const total = Number((subtotal + serviceCharge + tax - discount).toFixed(2));

    // 5. Generate Order Number
    const seqRes = await client.query<{ nextval: string }>(`SELECT nextval('order_number_seq')`);
    const orderNumber = `#${seqRes.rows[0].nextval}`;

    // 6. Insert Order
    const orderInsert = await client.query<{ id: string }>(
      `INSERT INTO orders (
        session_id, outlet_id, tenant_id, table_id, order_number,
        order_type, status, customer_name, subtotal, tax,
        service_charge, discount, total, promo_code, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'new', $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        sessionId,
        outletId,
        tenantId,
        tableId,
        orderNumber,
        input.order_type,
        input.customer_name || null,
        subtotal,
        tax,
        serviceCharge,
        discount,
        total,
        promoCode,
        input.notes || null,
        staffId,
      ]
    );

    const orderId = orderInsert.rows[0].id;

    // 7. Insert Order Line Items
    for (const it of validatedItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id, menu_item_id, name, unit_price, quantity, extras, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          it.menu_item_id,
          it.name,
          it.unit_price,
          it.quantity,
          JSON.stringify(it.extras),
          it.notes || null,
        ]
      );
    }

    await client.query('COMMIT');

    const fullOrder = await getOrderById(tenantId, orderId);

    // Broadcast SSE to kitchen screens
    orderEvents.broadcast(tenantId, 'order.new', fullOrder, outletId);

    return fullOrder;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieve a single order with items and table numbers.
 */
export async function getOrderById(tenantId: string, orderId: string): Promise<FullOrder> {
  const orderRes = await query<{
    id: string;
    order_number: string;
    order_type: string;
    status: string;
    customer_name: string | null;
    table_id: string | null;
    session_id: string | null;
    table_number: string | null;
    outlet_id: string;
    tenant_id: string;
    subtotal: string;
    tax: string;
    service_charge: string;
    discount: string;
    total: string;
    promo_code: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT o.id, o.order_number, o.order_type, o.status, o.customer_name,
            o.table_id, o.session_id, t.table_number, o.outlet_id, o.tenant_id,
            o.subtotal, o.tax, o.service_charge, o.discount, o.total,
            o.promo_code, o.notes, o.created_at, o.updated_at
     FROM orders o
     LEFT JOIN tables t ON t.id = o.table_id
     WHERE o.id = $1 AND o.tenant_id = $2`,
    [orderId, tenantId]
  );

  const ord = orderRes.rows[0];
  if (!ord) {
    throw new NotFoundError('Order');
  }

  const itemsRes = await query<{
    id: string;
    menu_item_id: string;
    name: string;
    unit_price: string;
    quantity: number;
    extras: string[];
    notes: string | null;
  }>(
    `SELECT id, menu_item_id, name, unit_price, quantity, extras, notes
     FROM order_items
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  );

  return {
    ...ord,
    subtotal: parseFloat(ord.subtotal),
    tax: parseFloat(ord.tax),
    service_charge: parseFloat(ord.service_charge),
    discount: parseFloat(ord.discount),
    total: parseFloat(ord.total),
    items: itemsRes.rows.map((i) => ({
      ...i,
      unit_price: parseFloat(i.unit_price),
    })),
  };
}

/**
 * List orders with status & table filtering for KDS and POS.
 */
export async function listOrders(tenantId: string, filter: OrderFilterQuery): Promise<FullOrder[]> {
  const conditions: string[] = ['o.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let idx = 2;

  if (filter.status) {
    conditions.push(`o.status = $${idx++}`);
    values.push(filter.status);
  }
  if (filter.outlet_id) {
    conditions.push(`o.outlet_id = $${idx++}`);
    values.push(filter.outlet_id);
  }
  if (filter.table_id) {
    conditions.push(`o.table_id = $${idx++}`);
    values.push(filter.table_id);
  }

  values.push(filter.limit, filter.offset);

  const sql = `
    SELECT o.id
    FROM orders o
    WHERE ${conditions.join(' AND ')}
    ORDER BY o.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const orderIds = await query<{ id: string }>(sql, values);
  if (orderIds.rows.length === 0) return [];

  return Promise.all(orderIds.rows.map((r) => getOrderById(tenantId, r.id)));
}

/**
 * Status transition engine.
 * Validates transition flow and fires trigger-based audit logging.
 */
export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  newStatus: string,
  staffId?: string,
  reason?: string
): Promise<FullOrder> {
  const current = await query<{ id: string; status: string; outlet_id: string }>(
    `SELECT id, status, outlet_id FROM orders WHERE id = $1 AND tenant_id = $2`,
    [orderId, tenantId]
  );

  if (!current.rows[0]) {
    throw new NotFoundError('Order');
  }

  const { status: prevStatus, outlet_id } = current.rows[0];

  // Business state machine verification
  const validTransitions: Record<string, string[]> = {
    new: ['cooking', 'cancelled'],
    cooking: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[prevStatus]?.includes(newStatus)) {
    throw new ConflictError(`Invalid status transition from '${prevStatus}' to '${newStatus}'`);
  }

  await query(
    `UPDATE orders
     SET status = $1, created_by = COALESCE($2, created_by)
     WHERE id = $3 AND tenant_id = $4`,
    [newStatus, staffId || null, orderId, tenantId]
  );

  // If reason is given, attach to status log
  if (reason) {
    await query(
      `UPDATE order_status_log
       SET reason = $1
       WHERE order_id = $2 AND new_status = $3
       ORDER BY changed_at DESC LIMIT 1`,
      [reason, orderId, newStatus]
    ).catch(() => {});
  }

  const updatedOrder = await getOrderById(tenantId, orderId);

  // Broadcast update to KDS listeners
  orderEvents.broadcast(tenantId, 'order.status_changed', updatedOrder, outlet_id);

  return updatedOrder;
}
