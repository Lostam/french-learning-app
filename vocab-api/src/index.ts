import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import storiesRoutes from './routes/stories.routes';
import vocabularyRoutes from './routes/vocabulary.routes';

const app = express();
const PORT = env.PORT;

// Middleware
app.use(express.json());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/stories', storiesRoutes);
app.use('/vocabulary', vocabularyRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    console.log(`Auth routes available at http://localhost:${PORT}/auth`);
    console.log(`Stories routes available at http://localhost:${PORT}/stories`);
    console.log(`Vocabulary routes available at http://localhost:${PORT}/vocabulary`);
  });
}

// Export for Vercel serverless
export default app;
