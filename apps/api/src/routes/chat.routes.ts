import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { sendMessageSchema } from '../schemas/chat.schema';

const router = Router();

// GET /api/v1/chat/conversations — list all conversations for the authenticated user
router.get('/conversations', protect, ChatController.getConversations);

// GET /api/v1/chat/:matchId/messages — get paginated messages for a match
router.get('/:matchId/messages', protect, ChatController.getMessages);

// POST /api/v1/chat/:matchId/messages — send a message in a match
router.post('/:matchId/messages', protect, validateRequest(sendMessageSchema), ChatController.sendMessage);

// PATCH /api/v1/chat/:matchId/read — mark all messages in a match as read
router.patch('/:matchId/read', protect, ChatController.markAsRead);

// GET /api/v1/chat/:matchId/media/upload-url — Generate S3 presigned PUT URL
router.get('/:matchId/media/upload-url', protect, ChatController.getMediaUploadUrl);

// GET /api/v1/chat/media/read — Generate S3 presigned GET URL (uses ?key= query param)
router.get('/media/read', protect, ChatController.getMediaReadUrl);

// DELETE /api/v1/chat/:matchId/messages/:messageId — Soft delete a message
router.delete('/:matchId/messages/:messageId', protect, ChatController.deleteMessage);

// PATCH /api/v1/chat/:matchId/messages/:messageId — Edit a message
router.patch('/:matchId/messages/:messageId', protect, ChatController.updateMessage);

export default router;
