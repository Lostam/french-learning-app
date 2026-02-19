import express from 'express';
import cors from 'cors';

const app = express();

// Log startup
console.log('Starting app initialization...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);

// Lazy import routes to avoid crashes during module load
let authRoutes: any;
let storiesRoutes: any;
let vocabularyRoutes: any;
let errorHandler: any;

try {
  errorHandler = require('./middleware/errorHandler').errorHandler;
  authRoutes = require('./routes/auth.routes').default;
  storiesRoutes = require('./routes/stories.routes').default;
  vocabularyRoutes = require('./routes/vocabulary.routes').default;
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Failed to load routes:', error);
}

// CORS must be first - allow all origins for now to debug
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight

// Other middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes (only if loaded successfully)
if (authRoutes) app.use('/auth', authRoutes);
if (storiesRoutes) app.use('/stories', storiesRoutes);
if (vocabularyRoutes) app.use('/vocabulary', vocabularyRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
if (errorHandler) app.use(errorHandler);

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
