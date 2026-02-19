import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authenticateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  nativeLanguage: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /auth/signup
 * Create a new user account
 */
router.post('/signup', async (req: AuthRequest, res: Response, next): Promise<void> => {
  try {
    // Validate request body
    const validatedData = signupSchema.parse(req.body);

    // Create user and generate token
    const result = await AuthService.createUser(validatedData);

    res.status(201).json({
      message: 'User created successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      const message = issues.length > 0 ? issues[0].message : 'Validation error';
      next(new AppError(message, 400));
    } else {
      next(error);
    }
  }
});

/**
 * POST /auth/login
 * Authenticate user and return token
 */
router.post('/login', async (req: AuthRequest, res: Response, next): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Authenticate user
    const result = await AuthService.login(validatedData);

    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      const message = issues.length > 0 ? issues[0].message : 'Validation error';
      next(new AppError(message, 400));
    } else {
      next(error);
    }
  }
});

/**
 * GET /auth/me
 * Get current authenticated user (protected route)
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next): Promise<void> => {
  try {
    if (!req.userId) {
      throw new AppError('User ID not found in request', 401);
    }

    // Get user by ID
    const user = await AuthService.getUserById(req.userId);

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
