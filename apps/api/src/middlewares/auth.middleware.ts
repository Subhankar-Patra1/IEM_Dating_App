import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiResponse } from '../utils/ApiResponse';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json(ApiResponse.error('Not authorized, no token provided'));
  }

  try {
    const decoded = verifyAccessToken(token) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(ApiResponse.error('Not authorized, token validation failed'));
  }
};
