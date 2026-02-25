import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalErrorHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Add context/correlation ID if needed later

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import matchRoutes from './routes/match.routes';
import safetyRoutes from './routes/safety.routes';

// Main routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/match', matchRoutes);
app.use('/api/v1/safety', safetyRoutes);

app.use(globalErrorHandler);

export default app;
