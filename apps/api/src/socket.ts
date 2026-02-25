import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from './utils/redis';
import { Server as HttpServer } from 'http';
import { logger } from './utils/logger';
import { verifyAccessToken } from './utils/jwt';

export const setupSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' }
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  pubClient.on('error', (err) => logger.error('Redis pubClient error:', err.message));
  subClient.on('error', (err) => logger.error('Redis subClient error:', err.message));

  io.adapter(createAdapter(pubClient, subClient));

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

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_match_room', (matchId) => {
      socket.join(matchId);
      logger.info(`Socket ${socket.id} joined room ${matchId}`);
    });

    socket.on('typing_start', (data) => {
      socket.to(data.matchId).emit('typing_start', { senderId: data.userId });
    });
    
    socket.on('typing_stop', (data) => {
      socket.to(data.matchId).emit('typing_stop', { senderId: data.userId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
