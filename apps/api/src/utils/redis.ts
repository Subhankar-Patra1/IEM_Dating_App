import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const isTls = redisUrl.startsWith('rediss://');

// Defensive logging of the host (safely masked)
const hostInfo = redisUrl.split('@')[1] || 'localhost';
logger.info(`Initializing Redis client for host: ${hostInfo}`);

export const redisClient = new Redis(redisUrl, {
  lazyConnect: true,
  tls: isTls ? {} : undefined,
  connectTimeout: 20000, // Increased to 20s for Windows environments
  keepAlive: 1000 * 60 * 3, // Keep the connection alive for up to 3 minutes
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    // Reconnect after
    const delay = Math.min(times * 200, 5000);
    logger.info(`Redis reconnecting in ${delay}ms... (attempt ${times})`);
    return delay;
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
