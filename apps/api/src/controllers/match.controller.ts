import { Request, Response, NextFunction } from 'express';
import { MatchService } from '../services/match.service';
import { ApiResponse } from '../utils/ApiResponse';

export class MatchController {
  static async getPendingMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const matches = await MatchService.getPendingMatches(userId);
      res.status(200).json(ApiResponse.success(matches));
    } catch (error) {
      next(error);
    }
  }

  static async swipe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const { targetUserId, action } = req.body;
      const result = await MatchService.performSwipe(userId, targetUserId, action);
      res.status(200).json(ApiResponse.success(result, 'Swipe recorded'));
    } catch (error) {
      if ((error as Error).message.includes('limit')) {
        return res.status(429).json(ApiResponse.error((error as Error).message));
      }
      next(error);
    }
  }
}
