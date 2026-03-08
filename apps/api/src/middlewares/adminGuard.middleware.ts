import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Admin Guard Middleware — Restricts access to admin-only endpoints.
 * Checks the JWT payload for role === 'admin'.
 * Must be used AFTER the `protect` middleware (which sets req.user).
 */
export const adminGuard = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json(
      ApiResponse.error('Forbidden: Admin access required')
    );
    return;
  }

  next();
};
