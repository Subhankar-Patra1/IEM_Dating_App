import { createServer } from 'http';
import app from './app';
import { logger } from './utils/logger';
import { setupSocket } from './socket';
import { prisma } from './utils/prisma';

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

setupSocket(httpServer);

// Startup sequence
const bootstrap = async () => {
  try {
    // 1. Check Database Connection
    await prisma.$connect();
    logger.info('Database connection established successfully');

    // 2. Start HTTP Server
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

bootstrap();

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
