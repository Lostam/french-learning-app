import { Router } from 'express';
import { VocabularyService } from '../services/vocabulary.service';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All vocabulary routes require authentication
router.use(authenticateToken);

/**
 * POST /vocabulary/lookup
 * Get contextual definition from Claude API
 * Body: { word: string, sentenceId: string }
 */
router.post('/lookup', async (req: AuthRequest, res, next) => {
  try {
    const { word, sentenceId } = req.body;
    const userId = req.userId!;

    // Validate request body
    if (!word || typeof word !== 'string') {
      throw new AppError('word is required and must be a string', 400);
    }

    if (!sentenceId || typeof sentenceId !== 'string') {
      throw new AppError('sentenceId is required and must be a string', 400);
    }

    // Call service to lookup word
    const definition = await VocabularyService.lookupWord({
      word: word.trim(),
      sentenceId,
      userId,
    });

    res.status(200).json(definition);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /vocabulary
 * Save word to database with automatic ReviewCard creation
 * Body: { word, sentenceId, definition, translation, contextNote?, partOfSpeech? }
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { word, sentenceId, definition, translation, contextNote, partOfSpeech } = req.body;
    const userId = req.userId!;

    // Validate required fields
    if (!word || typeof word !== 'string') {
      throw new AppError('word is required and must be a string', 400);
    }

    if (!sentenceId || typeof sentenceId !== 'string') {
      throw new AppError('sentenceId is required and must be a string', 400);
    }

    if (!definition || typeof definition !== 'string') {
      throw new AppError('definition is required and must be a string', 400);
    }

    if (!translation || typeof translation !== 'string') {
      throw new AppError('translation is required and must be a string', 400);
    }

    // Validate optional fields if provided
    if (contextNote !== undefined && typeof contextNote !== 'string') {
      throw new AppError('contextNote must be a string', 400);
    }

    if (partOfSpeech !== undefined && typeof partOfSpeech !== 'string') {
      throw new AppError('partOfSpeech must be a string', 400);
    }

    // Save word
    const vocabularyWord = await VocabularyService.saveWord({
      userId,
      word: word.trim(),
      sentenceId,
      definition: definition.trim(),
      translation: translation.trim(),
      contextNote: contextNote?.trim(),
      partOfSpeech: partOfSpeech?.trim(),
    });

    res.status(201).json(vocabularyWord);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /vocabulary
 * List all words for user with sentence context
 * Query params: ?storyId=<id> (optional)
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const storyIdParam = req.query.storyId;

    // Handle storyId query parameter - ensure it's a string
    let storyId: string | undefined;
    if (storyIdParam) {
      if (Array.isArray(storyIdParam)) {
        storyId = storyIdParam[0] as string;
      } else if (typeof storyIdParam === 'string') {
        storyId = storyIdParam;
      }
    }

    const words = await VocabularyService.listWords(userId, storyId);

    res.status(200).json({ words });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /vocabulary/:id
 * Delete word (cascades to review card)
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const idParam = req.params.id;
    const userId = req.userId!;

    if (!idParam) {
      throw new AppError('Word ID is required', 400);
    }

    // Handle id parameter - ensure it's a string
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    await VocabularyService.deleteWord(id, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * GET /vocabulary/:id
 * Get word details by ID
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const idParam = req.params.id;
    const userId = req.userId!;

    if (!idParam) {
      throw new AppError('Word ID is required', 400);
    }

    // Handle id parameter (can be string or string[])
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const word = await VocabularyService.getWordById(id, userId);

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    res.status(200).json(word);
  } catch (error) {
    next(error);
  }
});

export default router;
