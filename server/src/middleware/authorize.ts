/**
 * RBAC authorization middleware.
 * Must be used AFTER authenticate/authenticateStaff.
 * Checks the staff token's role against allowed roles.
 */
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '../shared/errors.js';
import type { StaffTokenPayload } from '../shared/jwt.js';

type StaffRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

/**
 * Returns middleware that restricts access to the listed roles.
 * Usage: authorize('admin', 'manager')
 */
export function authorize(...allowedRoles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = req.token;
    if (!token) {
      next(new AuthError('Authentication required before authorization'));
      return;
    }
    if (token.scope !== 'staff') {
      next(new ForbiddenError('Staff access required'));
      return;
    }

    const staffToken = token as StaffTokenPayload;
    if (!allowedRoles.includes(staffToken.role as StaffRole)) {
      next(new ForbiddenError(`Role '${staffToken.role}' does not have access. Required: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Ensures the request is scoped to the correct tenant.
 * Prevents cross-tenant data access via URL param manipulation.
 */
export function enforceTenant(paramName = 'tenantId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = req.token;
    if (!token || !('tid' in token)) {
      next(new AuthError('Tenant-scoped token required'));
      return;
    }
    const paramTid = req.params[paramName];
    if (paramTid && paramTid !== token.tid) {
      next(new ForbiddenError('Cross-tenant access denied'));
      return;
    }
    next();
  };
}
