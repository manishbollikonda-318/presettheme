import { query } from '../../config/db.js';
import { NotFoundError, ConflictError } from '../../shared/errors.js';
import type { CreateTableInput, UpdateTableInput } from './tables.schema.js';

export interface TableDetails {
  id: string;
  outlet_id: string;
  table_number: string;
  capacity: number;
  is_active: boolean;
  active_session_id: string | null;
  active_order_id: string | null;
  active_order_number: string | null;
  order_status: string | null;
  order_total: number | null;
}

export async function listTables(tenantId: string, outletId?: string): Promise<TableDetails[]> {
  const conditions = ['o.tenant_id = $1'];
  const values: unknown[] = [tenantId];

  if (outletId) {
    conditions.push('t.outlet_id = $2');
    values.push(outletId);
  }

  const sql = `
    SELECT
      t.id,
      t.outlet_id,
      t.table_number,
      t.capacity,
      t.is_active,
      s.id AS active_session_id,
      ord.id AS active_order_id,
      ord.order_number AS active_order_number,
      ord.status AS order_status,
      ord.total AS order_total
    FROM tables t
    JOIN outlets o ON o.id = t.outlet_id
    LEFT JOIN active_sessions s ON s.table_id = t.id AND s.status = 'active'
    LEFT JOIN LATERAL (
      SELECT id, order_number, status, total
      FROM orders
      WHERE table_id = t.id AND status NOT IN ('completed', 'cancelled')
      ORDER BY created_at DESC
      LIMIT 1
    ) ord ON true
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.table_number ASC
  `;

  const result = await query<any>(sql, values);
  return result.rows.map((r: any) => ({
    id: r.id,
    outlet_id: r.outlet_id,
    table_number: r.table_number,
    capacity: r.capacity,
    is_active: r.is_active,
    active_session_id: r.active_session_id || null,
    active_order_id: r.active_order_id || null,
    active_order_number: r.active_order_number || null,
    order_status: r.order_status || null,
    order_total: r.order_total ? parseFloat(r.order_total) : null,
  }));
}

export async function createTable(tenantId: string, input: CreateTableInput) {
  const outlet = await query(
    `SELECT id FROM outlets WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
    [input.outlet_id, tenantId]
  );
  if (!outlet.rows[0]) {
    throw new NotFoundError('Outlet');
  }

  const existing = await query(
    `SELECT id FROM tables WHERE outlet_id = $1 AND table_number = $2`,
    [input.outlet_id, input.table_number]
  );
  if (existing.rows[0]) {
    throw new ConflictError(`Table ${input.table_number} already exists in this outlet`);
  }

  const result = await query(
    `INSERT INTO tables (outlet_id, table_number, capacity, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id, outlet_id, table_number, capacity, is_active, created_at`,
    [input.outlet_id, input.table_number, input.capacity ?? 4, input.is_active ?? true]
  );
  return result.rows[0];
}

export async function updateTable(tenantId: string, tableId: string, input: UpdateTableInput) {
  const tableCheck = await query(
    `SELECT t.id, t.outlet_id FROM tables t JOIN outlets o ON o.id = t.outlet_id WHERE t.id = $1 AND o.tenant_id = $2`,
    [tableId, tenantId]
  );
  if (!tableCheck.rows[0]) {
    throw new NotFoundError('Table');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.table_number !== undefined) {
    fields.push(`table_number = $${idx++}`);
    values.push(input.table_number);
  }
  if (input.capacity !== undefined) {
    fields.push(`capacity = $${idx++}`);
    values.push(input.capacity);
  }
  if (input.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(input.is_active);
  }

  if (fields.length === 0) {
    const fresh = await query(`SELECT * FROM tables WHERE id = $1`, [tableId]);
    return fresh.rows[0];
  }

  values.push(tableId);
  const sql = `
    UPDATE tables
    SET ${fields.join(', ')}
    WHERE id = $${idx++}
    RETURNING id, outlet_id, table_number, capacity, is_active
  `;

  const result = await query(sql, values);
  return result.rows[0];
}

export async function closeActiveSession(tenantId: string, tableId: string, reason: string) {
  const result = await query(
    `UPDATE active_sessions s
     SET status = $1, closed_at = now()
     FROM tables t, outlets o
     WHERE s.table_id = t.id AND t.outlet_id = o.id AND o.tenant_id = $2
       AND s.table_id = $3 AND s.status = 'active'
     RETURNING s.id`,
    [reason === 'abandoned' ? 'abandoned' : 'closed', tenantId, tableId]
  );

  if (!result.rows[0]) {
    throw new NotFoundError('Active table session');
  }

  return { session_id: result.rows[0].id, status: reason };
}
