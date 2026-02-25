import { createServer } from 'http';
import app from './app';
import { logger } from './utils/logger';
import { setupSocket } from './socket';

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

setupSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
