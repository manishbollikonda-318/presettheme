import type { Request, Response, NextFunction } from 'express';
import * as ordersService from './orders.service.js';
import { orderEvents } from './orders.events.js';
import { AuthError, ForbiddenError } from '../../shared/errors.js';
import type { StaffTokenPayload } from '../../shared/jwt.js';

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.token) {
      throw new AuthError('Authentication required');
    }
    const order = await ordersService.createOrder(req.token, req.body);
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.token) {
      throw new AuthError('Authentication required');
    }
    const tenantId = req.token.tid;
    const id = String(req.params.id);
    const order = await ordersService.getOrderById(tenantId, id);

    // Strict Anti-IDOR: If guest, verify table AND active session ownership
    if (req.token.scope === 'guest') {
      if (order.table_id !== req.token.tbl || (order.session_id && order.session_id !== req.token.sub)) {
        throw new ForbiddenError('Access to other table orders denied');
      }
    }

    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.token || req.token.scope !== 'staff') {
      throw new ForbiddenError('Staff clearance required');
    }
    const tenantId = req.token.tid;
    const orders = await ordersService.listOrders(tenantId, req.query as any);
    res.status(200).json({ orders, count: orders.length });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.token || req.token.scope !== 'staff') {
      throw new ForbiddenError('Staff clearance required to update status');
    }
    const staff = req.token as StaffTokenPayload;
    const id = String(req.params.id);
    const { status, reason } = req.body;
    const order = await ordersService.updateOrderStatus(staff.tid, id, status, staff.sub, reason);
    res.status(200).json({ order, message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
}

export function streamOrders(req: Request, res: Response): void {
  if (!req.token || req.token.scope !== 'staff') {
    res.status(403).json({ error: 'Staff access required for live order stream' });
    return;
  }

  const staff = req.token as StaffTokenPayload;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `${staff.sub}-${Date.now()}`;
  orderEvents.addClient(clientId, staff.tid, staff.oid, res);

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'KDS Live stream established' })}\n\n`);
}
