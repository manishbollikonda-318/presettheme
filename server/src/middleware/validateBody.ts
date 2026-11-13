/**
 * Zod-based request body validation middleware.
 * Rejects malformed payloads with structured error details.
 */
import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/errors.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        next(new ValidationError('Request validation failed', details));
        return;
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        next(new ValidationError('Query validation failed', details));
        return;
      }
      next(err);
    }
  };
}
