import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/ApiResponse';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error processing request: ${err.message}`, { stack: err.stack, url: req.url });
  res.status(500).json(ApiResponse.error('Internal Server Error', err.message));
};
