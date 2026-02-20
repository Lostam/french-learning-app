import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

// CORS first - allow all for now
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check - minimal, no dependencies
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  }});
});

// Import routes (require to avoid hoisting issues in error handling)
try {
  const authRoutes = require('./routes/auth.routes').default;
  const storiesRoutes = require('./routes/stories.routes').default;
  const vocabularyRoutes = require('./routes/vocabulary.routes').default;
  const { errorHandler } = require('./middleware/errorHandler');

  // Routes
  app.use('/auth', authRoutes);
  app.use('/stories', storiesRoutes);
  app.use('/vocabulary', vocabularyRoutes);

  // Error handler
  app.use(errorHandler);
} catch (error: any) {
  console.error('Failed to load routes:', error);

  // Fallback error route
  app.use('/auth', (_req: Request, res: Response) => {
    res.status(500).json({ error: 'Auth routes failed to load', message: error.message });
  });
  app.use('/stories', (_req: Request, res: Response) => {
    res.status(500).json({ error: 'Stories routes failed to load', message: error.message });
  });
  app.use('/vocabulary', (_req: Request, res: Response) => {
    res.status(500).json({ error: 'Vocabulary routes failed to load', message: error.message });
  });
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Generic error handler (fallback)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
