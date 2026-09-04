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
      const userId = (req as any).user.sub;
      const cursor = req.query.cursor as string | undefined;
      const since = req.query.since as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const result = await ChatService.getMessages(matchId, userId, cursor, limit, since);
      res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const matchId = req.params.matchId as string;
      const { content, mediaKey, mediaKeys } = req.body;
      
      // Additional validation at controller level
      if (mediaKeys && !Array.isArray(mediaKeys)) {
        return res.status(400).json(ApiResponse.error('mediaKeys must be an array'));
      }
      
      if (mediaKeys && mediaKeys.length > 10) {
        return res.status(400).json(ApiResponse.error('Maximum 10 media files per message'));
      }
      
      const message = await ChatService.sendMessage(userId, matchId, content, mediaKey, mediaKeys);
      res.status(201).json(ApiResponse.success(message, 'Message sent'));
    } catch (error) {
      if ((error as Error).message.includes('not part of this match')) {
        return res.status(403).json(ApiResponse.error((error as Error).message));
      }
      if ((error as Error).message.includes('required')) {
        return res.status(400).json(ApiResponse.error((error as Error).message));
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

  static async getMediaUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const ObjectChatMediaService = require('../services/chat-media.service').ChatMediaService;
      const userId = (req as any).user.sub;
      const matchId = req.params.matchId as string;
      const ext = req.query.ext as string || 'jpeg';
      
      const payload = await ObjectChatMediaService.generateUploadUrl(userId, matchId, ext);
      res.status(200).json(ApiResponse.success(payload));
    } catch (error) {
      next(error);
    }
  }

  static async getMediaReadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const ObjectChatMediaService = require('../services/chat-media.service').ChatMediaService;
      const mediaKey = req.query.key as string;
      
      if (!mediaKey) {
        return res.status(400).json(ApiResponse.error('Missing media key'));
      }
      
      const readUrl = await ObjectChatMediaService.generateReadUrl(mediaKey);
      res.status(200).json(ApiResponse.success(readUrl));
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const messageId = req.params.messageId as string;
      const { mode } = req.body; // 'me' or 'everyone'
      
      await ChatService.deleteMessage(messageId, userId, mode);

      // Emit socket event for real-time removal
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        // We catch matchId from the route or service if needed, but here we can emit to the match room
        // Since we don't have matchId here directly, let's fetch it from the service or just use req.params.matchId
        const matchId = req.params.matchId;
        io.to(matchId).emit('message_deleted', { messageId, matchId });
      }

      res.status(200).json(ApiResponse.success({ id: messageId }, 'Message deleted'));
    } catch (error) {
      if ((error as Error).message.includes('Not authorized')) {
        return res.status(403).json(ApiResponse.error((error as Error).message));
      }
      next(error);
    }
  }

  static async updateMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.sub;
      const messageId = req.params.messageId as string;
      const { content } = req.body;
      
      const updated = await ChatService.updateMessage(messageId, userId, content);
      res.status(200).json(ApiResponse.success(updated, 'Message updated'));
    } catch (error) {
      if ((error as Error).message.includes('Not authorized') || (error as Error).message.includes('deleted')) {
         return res.status(403).json(ApiResponse.error((error as Error).message));
      }
      next(error);
    }
  }
}
