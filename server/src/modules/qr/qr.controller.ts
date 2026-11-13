import type { Request, Response, NextFunction } from 'express';
import { 
  generateQRToken, 
  verifyQRToken, 
  revokeQRToken, 
  listActiveTokens, 
  getDemoTableSession
} from './qr.service.js';
import type { StaffTokenPayload } from '../../shared/jwt.js';

export async function getDemoSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tableNumber = req.params.tableNumber ? String(req.params.tableNumber) : '01';
    const session = await getDemoTableSession(tableNumber);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

export async function generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.token as StaffTokenPayload;
    const { table_id, ttl_hours } = req.body;
    const result = await generateQRToken(table_id, token.tid, ttl_hours ?? 24);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function verify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const encryptedToken = decodeURIComponent(String(req.params.token));
    const session = await verifyQRToken(encryptedToken);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

export async function revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.token as StaffTokenPayload;
    const id = String(req.params.id);
    await revokeQRToken(id, token.tid);
    res.status(200).json({ success: true, message: 'QR token revoked' });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.token as StaffTokenPayload;
    const outletId = req.query.outlet_id as string | undefined;
    const tokens = await listActiveTokens(token.tid, outletId);
    res.status(200).json({ tokens, count: tokens.length });
  } catch (err) {
    next(err);
  }
}
