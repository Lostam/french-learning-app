import express, { Request, Response, NextFunction, Router } from 'express';
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

// Cache for loaded routes
const routeCache: { [key: string]: Router } = {};

// Helper to lazily load routes
const lazyRoute = (routePath: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!routeCache[routePath]) {
        const module = await import(routePath);
        routeCache[routePath] = module.default;
      }
      routeCache[routePath](req, res, next);
    } catch (error: any) {
      console.error(`Failed to load route ${routePath}:`, error);
      res.status(500).json({
        error: 'Route loading failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
};

// Routes with lazy loading
app.use('/auth', lazyRoute('./routes/auth.routes'));
app.use('/stories', lazyRoute('./routes/stories.routes'));
app.use('/vocabulary', lazyRoute('./routes/vocabulary.routes'));

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Generic error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
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
