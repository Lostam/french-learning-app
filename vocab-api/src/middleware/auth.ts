import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

/**
 * JWT authentication middleware
 * Extracts token from Authorization header, verifies it, and attaches userId to request
 */
export const authenticateToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('No authorization header provided', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid authorization format. Expected "Bearer <token>"', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Verify token and extract payload
    const payload = AuthService.verifyToken(token);

    // Attach userId to request object
    req.userId = payload.userId;

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};
