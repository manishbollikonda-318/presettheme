import type { Request, Response, NextFunction } from 'express';
import * as tablesService from './tables.service.js';
import type { StaffTokenPayload } from '../../shared/jwt.js';

export async function getTables(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = req.token as StaffTokenPayload;
    const outletId = (req.query.outlet_id as string) || staff.oid;
    const tables = await tablesService.listTables(staff.tid, outletId);
    res.status(200).json({ tables, count: tables.length });
  } catch (err) {
    next(err);
  }
}

export async function createTable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = req.token as StaffTokenPayload;
    const table = await tablesService.createTable(staff.tid, req.body);
    res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
}

export async function updateTable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = req.token as StaffTokenPayload;
    const id = String(req.params.id);
    const table = await tablesService.updateTable(staff.tid, id, req.body);
    res.status(200).json({ table });
  } catch (err) {
    next(err);
  }
}

export async function closeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = req.token as StaffTokenPayload;
    const id = String(req.params.id);
    const { reason } = req.body;
    const result = await tablesService.closeActiveSession(staff.tid, id, reason);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
