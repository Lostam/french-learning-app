import { prisma } from '../lib/prisma';
import { LLMService, ContextualDefinitionResponse } from './llm.service';

export interface LookupWordRequest {
  word: string;
  sentenceId: string;
  userId: string;
}

export interface SaveWordRequest {
  userId: string;
  word: string;
  sentenceId: string;
  definition: string;
  translation: string;
  contextNote?: string;
  partOfSpeech?: string;
}

export interface VocabularyWordWithContext {
  id: string;
  word: string;
  definition: string;
  translation: string;
  contextNote: string | null;
  partOfSpeech: string | null;
  createdAt: Date;
  sentence: {
    id: string;
    text: string;
    position: number;
  };
  story: {
    id: string;
    title: string;
    language: string;
  };
}

/**
 * Vocabulary Service - Manages vocabulary words and integrates with Claude API
 */
export class VocabularyService {
  /**
   * Lookup word definition using Claude API for contextual definition
   */
  static async lookupWord(
    request: LookupWordRequest
  ): Promise<ContextualDefinitionResponse> {
    const { word, sentenceId, userId } = request;

    // Get sentence and related data
    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      include: {
        story: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!sentence) {
      throw new Error('Sentence not found');
    }

    // Verify user owns this story
    if (sentence.story.userId !== userId) {
      throw new Error('Unauthorized: You do not own this story');
    }

    // Get user's native language
    const nativeLanguage = sentence.story.user.nativeLanguage;

    // Call Claude API for contextual definition
    const definition = await LLMService.getContextualDefinition({
      word,
      sentence: sentence.text,
      nativeLanguage,
    });

    return definition;
  }

  /**
   * Save word to database with automatic ReviewCard creation
   * Uses transaction to ensure data integrity
   * Enforces unique constraint on (userId, word, sentenceId)
   */
  static async saveWord(request: SaveWordRequest) {
    const {
      userId,
      word,
      sentenceId,
      definition,
      translation,
      contextNote,
      partOfSpeech,
    } = request;

    // Verify sentence exists and get storyId
    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      include: {
        story: true,
      },
    });

    if (!sentence) {
      throw new Error('Sentence not found');
    }

    // Verify user owns this story
    if (sentence.story.userId !== userId) {
      throw new Error('Unauthorized: You do not own this story');
    }

    // Check for duplicate word (same user, word, and sentence)
    const existingWord = await prisma.vocabularyWord.findFirst({
      where: {
        userId,
        word,
        sentenceId,
      },
    });

    if (existingWord) {
      throw new Error('Word already saved for this sentence');
    }

    // Use transaction to create VocabularyWord and ReviewCard atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create vocabulary word
      const vocabularyWord = await tx.vocabularyWord.create({
        data: {
          userId,
          storyId: sentence.storyId,
          sentenceId,
          word,
          definition,
          translation,
          contextNote: contextNote || null,
          partOfSpeech: partOfSpeech || null,
        },
      });

      // Create review card with default SM-2 values
      const reviewCard = await tx.reviewCard.create({
        data: {
          userId,
          vocabularyWordId: vocabularyWord.id,
          easeFactor: 2.5,
          intervalDays: 0,
          repetitions: 0,
          nextReviewAt: new Date(), // Due immediately for first review
        },
      });

      return { vocabularyWord, reviewCard };
    });

    return result.vocabularyWord;
  }

  /**
   * List all words for a user with sentence context
   * Optionally filter by storyId
   */
  static async listWords(
    userId: string,
    storyId?: string
  ): Promise<VocabularyWordWithContext[]> {
    const words = await prisma.vocabularyWord.findMany({
      where: {
        userId,
        ...(storyId && { storyId }),
      },
      include: {
        sentence: {
          select: {
            id: true,
            text: true,
            position: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
            language: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return words;
  }

  /**
   * Delete word (cascades to review card automatically via Prisma schema)
   */
  static async deleteWord(wordId: string, userId: string): Promise<void> {
    // Verify word exists and belongs to user
    const word = await prisma.vocabularyWord.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new Error('Word not found');
    }

    if (word.userId !== userId) {
      throw new Error('Unauthorized: You do not own this word');
    }

    // Delete word (review card will be cascade deleted automatically)
    await prisma.vocabularyWord.delete({
      where: { id: wordId },
    });
  }

  /**
   * Get word details by ID
   */
  static async getWordById(
    wordId: string,
    userId: string
  ): Promise<VocabularyWordWithContext | null> {
    const word = await prisma.vocabularyWord.findUnique({
      where: { id: wordId },
      include: {
        sentence: {
          select: {
            id: true,
            text: true,
            position: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
            language: true,
          },
        },
      },
    });

    if (!word) {
      return null;
    }

    // Verify ownership
    if (word.userId !== userId) {
      throw new Error('Unauthorized: You do not own this word');
    }

    return word;
  }
}
