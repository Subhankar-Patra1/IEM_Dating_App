import { Request, Response, NextFunction } from 'express';
import { SafetyService } from '../services/safety.service';
import { ApiResponse } from '../utils/ApiResponse';

export class SafetyController {
  static async report(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const report = await SafetyService.fileReport(userId, req.body);
      res.status(201).json(ApiResponse.success(report, 'Report submitted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
