import type { Request, Response, NextFunction } from 'express';
import * as txnService from './transactions.service.js';
import type { StaffTokenPayload } from '../../shared/jwt.js';

export async function settle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = req.token as StaffTokenPayload;
    const transaction = await txnService.settlePayment(staff.tid, staff.sub, req.body);
    res.status(201).json({ transaction, message: 'Payment settled successfully' });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = req.token as StaffTokenPayload;
    const transactions = await txnService.listTransactions(staff.tid, req.query as any);
    res.status(200).json({ transactions, count: transactions.length });
  } catch (err) {
    next(err);
  }
}
