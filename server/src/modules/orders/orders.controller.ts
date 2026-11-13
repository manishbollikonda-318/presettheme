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

    // Strict Anti-IDOR: If guest, verify active session or token ownership
    if (req.token.scope === 'guest') {
      const isOwner =
        !order.session_id ||
        order.session_id === req.token.sub ||
        order.table_id === req.token.tbl ||
        order.table_number === 'KIOSK';
      if (!isOwner) {
        throw new ForbiddenError('Access to other customer orders denied');
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

export async function getPickupBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.token?.tid || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const board = await ordersService.getPickupBoardTokens(tenantId);
    res.status(200).json(board);
  } catch (err) {
    next(err);
  }
}

export function streamOrders(req: Request, res: Response): void {
  const tenantId = req.token?.tid || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const outletId = req.token?.scope === 'staff' ? (req.token as StaffTokenPayload).oid : undefined;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `${req.token?.sub || 'display'}-${Date.now()}`;
  orderEvents.addClient(clientId, tenantId, outletId, res);

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Live order stream established' })}\n\n`);
}
