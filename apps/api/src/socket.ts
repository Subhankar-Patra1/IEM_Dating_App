import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from './utils/redis';
import { Server as HttpServer } from 'http';
import { logger } from './utils/logger';
import { verifyAccessToken } from './utils/jwt';
import { ChatService } from './services/chat.service';
import { prisma } from './utils/prisma';

let ioInstance: Server | null = null;

export const getIO = () => ioInstance;

export const setupSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' }
  });

  ioInstance = io;

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  pubClient.on('error', (err) => logger.error('Redis pubClient error:', err.message));
  subClient.on('error', (err) => logger.error('Redis subClient error:', err.message));

  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).user?.sub;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Auto-join all of the user's active match rooms
    if (userId) {
      try {
        const matches = await prisma.match.findMany({
          where: {
            status: 'active',
            OR: [
              { user1Id: userId },
              { user2Id: userId },
            ],
          },
          select: { id: true },
        });

        for (const match of matches) {
          socket.join(match.id);
          logger.info(`Socket ${socket.id} auto-joined room ${match.id}`);
        }
      } catch (err) {
        logger.error('Error auto-joining match rooms:', err);
      }
    }

    // Manual room join (for new matches that happen while connected)
    socket.on('join_match_room', (matchId: string) => {
      socket.join(matchId);
      logger.info(`Socket ${socket.id} joined room ${matchId}`);
    });

    // Send message via socket — saves to DB and broadcasts to the match room
    socket.on('send_message', async (data: { matchId: string; content: string }, callback?: (response: any) => void) => {
      try {
        if (!userId) throw new Error('Not authenticated');

        const message = await ChatService.sendMessage(userId, data.matchId, data.content);

        // Broadcast the message to everyone in the match room (including sender)
        io.to(data.matchId).emit('new_message', message);

        // Acknowledge to the sender
        if (callback) callback({ success: true, message });
      } catch (err) {
        logger.error('Error sending message via socket:', err);
        if (callback) callback({ success: false, error: (err as Error).message });
      }
    });

    // Mark messages as read
    socket.on('message_read', async (data: { matchId: string }) => {
      try {
        if (!userId) return;
        await ChatService.markAsRead(data.matchId, userId);
        // Notify the other user that messages have been read
        socket.to(data.matchId).emit('messages_read', { matchId: data.matchId, readBy: userId });
      } catch (err) {
        logger.error('Error marking messages as read:', err);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data: { matchId: string }) => {
      socket.to(data.matchId).emit('typing_start', { senderId: userId, matchId: data.matchId });
    });
    
    socket.on('typing_stop', (data: { matchId: string }) => {
      socket.to(data.matchId).emit('typing_stop', { senderId: userId, matchId: data.matchId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
