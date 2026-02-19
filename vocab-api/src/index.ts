import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

// CORS first
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check - minimal
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  }});
});

// Lazy load routes only when needed
app.use('/auth', (req, res, next) => {
  try {
    const authRoutes = require('./routes/auth.routes').default;
    authRoutes(req, res, next);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load auth routes', message: error.message });
  }
});

app.use('/stories', (req, res, next) => {
  try {
    const storiesRoutes = require('./routes/stories.routes').default;
    storiesRoutes(req, res, next);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load stories routes', message: error.message });
  }
});

app.use('/vocabulary', (req, res, next) => {
  try {
    const vocabularyRoutes = require('./routes/vocabulary.routes').default;
    vocabularyRoutes(req, res, next);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load vocabulary routes', message: error.message });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
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
