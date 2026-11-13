import { query, getClient } from '../../config/db.js';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors.js';
import type { SettleTransactionInput, TransactionFilterInput } from './transactions.schema.js';

export interface TransactionRecord {
  id: string;
  order_id: string;
  order_number: string;
  outlet_id: string;
  tenant_id: string;
  payment_method: string;
  amount: number;
  currency: string;
  gateway_ref: string | null;
  status: string;
  created_at: string;
  settled_at: string | null;
}

export async function settlePayment(
  tenantId: string,
  staffId: string,
  input: SettleTransactionInput
): Promise<TransactionRecord> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Fetch and lock order
    const orderRes = await client.query<{
      id: string;
      outlet_id: string;
      order_number: string;
      total: string;
      status: string;
    }>(
      `SELECT id, outlet_id, order_number, total, status
       FROM orders
       WHERE id = $1 AND tenant_id = $2
       FOR UPDATE`,
      [input.order_id, tenantId]
    );

    const ord = orderRes.rows[0];
    if (!ord) {
      throw new NotFoundError('Order');
    }

    if (ord.status === 'cancelled') {
      throw new ConflictError('Cannot settle a cancelled order');
    }

    const orderTotal = parseFloat(ord.total);

    // Sum existing captured payments
    const paidRes = await client.query<{ total_paid: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM transaction_log
       WHERE order_id = $1 AND status = 'captured'`,
      [ord.id]
    );
    const existingPaid = parseFloat(paidRes.rows[0].total_paid);

    if (existingPaid + input.amount > orderTotal + 0.01) {
      throw new ValidationError(
        `Settlement amount ₹${input.amount} exceeds pending balance ₹${(orderTotal - existingPaid).toFixed(2)}`
      );
    }

    // 2. Insert transaction log
    const txnRes = await client.query<{ id: string; created_at: string; settled_at: string }>(
      `INSERT INTO transaction_log (
        order_id, outlet_id, tenant_id, payment_method, amount, currency, gateway_ref, status, settled_at
      )
      VALUES ($1, $2, $3, $4, $5, 'INR', $6, 'captured', now())
      RETURNING id, created_at, settled_at`,
      [
        ord.id,
        ord.outlet_id,
        tenantId,
        input.payment_method,
        input.amount,
        input.gateway_ref || null,
      ]
    );

    const txnId = txnRes.rows[0].id;

    // 3. If fully paid, transition order to 'completed'
    if (existingPaid + input.amount >= orderTotal - 0.01) {
      await client.query(
        `UPDATE orders
         SET status = 'completed', created_by = COALESCE($1, created_by)
         WHERE id = $2`,
        [staffId, ord.id]
      );
    }

    await client.query('COMMIT');

    return {
      id: txnId,
      order_id: ord.id,
      order_number: ord.order_number,
      outlet_id: ord.outlet_id,
      tenant_id: tenantId,
      payment_method: input.payment_method,
      amount: input.amount,
      currency: 'INR',
      gateway_ref: input.gateway_ref || null,
      status: 'captured',
      created_at: txnRes.rows[0].created_at,
      settled_at: txnRes.rows[0].settled_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listTransactions(tenantId: string, filter: TransactionFilterInput) {
  const conditions = ['t.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let idx = 2;

  if (filter.outlet_id) {
    conditions.push(`t.outlet_id = $${idx++}`);
    values.push(filter.outlet_id);
  }
  if (filter.status) {
    conditions.push(`t.status = $${idx++}`);
    values.push(filter.status);
  }

  values.push(filter.limit, filter.offset);

  const sql = `
    SELECT
      t.id, t.order_id, o.order_number, t.outlet_id, t.tenant_id,
      t.payment_method, t.amount, t.currency, t.gateway_ref,
      t.status, t.created_at, t.settled_at
    FROM transaction_log t
    JOIN orders o ON o.id = t.order_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const result = await query(sql, values);
  return result.rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));
}
