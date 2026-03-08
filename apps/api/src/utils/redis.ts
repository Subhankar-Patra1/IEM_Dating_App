import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(redisUrl, {
  lazyConnect: true,
  keepAlive: 1000 * 60 * 3, // Keep the connection alive for up to 3 minutes
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    // Reconnect after
    return Math.min(times * 50, 2000);
  },
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
  }
};
