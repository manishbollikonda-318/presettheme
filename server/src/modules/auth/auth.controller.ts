import type { Request, Response, NextFunction } from 'express';
import { loginStaff, refreshAccessToken } from './auth.service.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const tokens = await loginStaff(email, password);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refresh_token } = req.body;
    const tokens = await refreshAccessToken(refresh_token);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.token;
    res.status(200).json({ authenticated: true, token });
  } catch (err) {
    next(err);
  }
}
