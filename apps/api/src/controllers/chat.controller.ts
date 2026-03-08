import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { ApiResponse } from '../utils/ApiResponse';

export class ChatController {
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      console.log('[ChatController] FULL JWT USER:', JSON.stringify((req as any).user));
      console.log('[ChatController] getConversations for userId:', userId);
      const conversations = await ChatService.getConversations(userId);
      console.log('[ChatController] Found conversations:', conversations.length);
      res.status(200).json(ApiResponse.success(conversations));
    } catch (error) {
      console.error('[ChatController] Error in getConversations:', error);
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = req.params.matchId as string;
      const cursor = req.query.cursor as string | undefined;
      const since = req.query.since as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const result = await ChatService.getMessages(matchId, cursor, limit, since);
      res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const matchId = req.params.matchId as string;
      const { content } = req.body;
      const message = await ChatService.sendMessage(userId, matchId, content);
      res.status(201).json(ApiResponse.success(message, 'Message sent'));
    } catch (error) {
      if ((error as Error).message.includes('not part of this match')) {
        return res.status(403).json(ApiResponse.error((error as Error).message));
      }
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const matchId = req.params.matchId as string;
      const result = await ChatService.markAsRead(matchId, userId);
      res.status(200).json(ApiResponse.success(result, 'Messages marked as read'));
    } catch (error) {
      next(error);
    }
  }
}
