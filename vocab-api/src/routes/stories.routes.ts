import { Router, Response } from 'express';
import { StoryService } from '../services/story.service';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /stories
 * List all stories for the current user
 */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.userId!;

    const stories = await StoryService.listStories(userId);

    res.status(200).json({
      status: 'success',
      data: {
        stories,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /stories
 * Create a new story
 */
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const { title, content, language, source, difficultyLevel } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Title is required', 400);
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError('Content is required', 400);
    }

    if (!language || typeof language !== 'string' || language.trim().length === 0) {
      throw new AppError('Language is required', 400);
    }

    // Validate source if provided
    if (source && !['USER_ADDED', 'AI_GENERATED'].includes(source)) {
      throw new AppError('Invalid source. Must be USER_ADDED or AI_GENERATED', 400);
    }

    const story = await StoryService.createStory({
      userId,
      title: title.trim(),
      content: content.trim(),
      language: language.trim(),
      source,
      difficultyLevel: difficultyLevel?.trim(),
    });

    res.status(201).json({
      status: 'success',
      data: {
        story,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stories/:id
 * Get a single story with all sentences
 */
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    if (!id) {
      throw new AppError('Story ID is required', 400);
    }

    const story = await StoryService.getStoryById(id, userId);

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        story,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /stories/:id
 * Delete a story
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    if (!id) {
      throw new AppError('Story ID is required', 400);
    }

    const deleted = await StoryService.deleteStory(id, userId);

    if (!deleted) {
      throw new AppError('Story not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Story deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
