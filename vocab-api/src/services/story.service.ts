import { prisma } from '../lib/prisma';
import { parseSentences, getWordCount } from '../lib/sentenceParser';
import { StorySource } from '@prisma/client';

export interface CreateStoryInput {
  userId: string;
  title: string;
  content: string;
  language: string;
  source?: StorySource;
  difficultyLevel?: string;
}

export interface StoryWithMetadata {
  id: string;
  title: string;
  language: string;
  source: StorySource;
  difficultyLevel: string | null;
  wordCount: number;
  sentenceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryWithSentences {
  id: string;
  title: string;
  content: string;
  language: string;
  source: StorySource;
  difficultyLevel: string | null;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  sentences: Array<{
    id: string;
    text: string;
    position: number;
  }>;
}

export class StoryService {
  /**
   * Create a new story with parsed sentences
   * Uses transaction to ensure atomicity
   */
  static async createStory(input: CreateStoryInput): Promise<StoryWithSentences> {
    const { userId, title, content, language, source = 'USER_ADDED', difficultyLevel } = input;

    // Parse content into sentences
    const sentences = parseSentences(content);

    if (sentences.length === 0) {
      throw new Error('Story content must contain at least one sentence');
    }

    // Create story and sentences in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the story
      const story = await tx.story.create({
        data: {
          userId,
          title,
          content,
          language,
          source,
          difficultyLevel,
        },
      });

      // Create all sentences
      const sentenceData = sentences.map((text, index) => ({
        storyId: story.id,
        text,
        position: index,
      }));

      await tx.sentence.createMany({
        data: sentenceData,
      });

      // Fetch created sentences
      const createdSentences = await tx.sentence.findMany({
        where: { storyId: story.id },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          text: true,
          position: true,
        },
      });

      return {
        ...story,
        sentences: createdSentences,
      };
    });

    // Calculate word count
    const wordCount = getWordCount(content);

    return {
      ...result,
      wordCount,
    };
  }

  /**
   * List all stories for a user with metadata
   */
  static async listStories(userId: string): Promise<StoryWithMetadata[]> {
    const stories = await prisma.story.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            sentences: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map((story) => ({
      id: story.id,
      title: story.title,
      language: story.language,
      source: story.source,
      difficultyLevel: story.difficultyLevel,
      wordCount: getWordCount(story.content),
      sentenceCount: story._count.sentences,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    }));
  }

  /**
   * Get a single story with all sentences
   */
  static async getStoryById(
    storyId: string,
    userId: string
  ): Promise<StoryWithSentences | null> {
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId, // Ensure user owns the story
      },
      include: {
        sentences: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            text: true,
            position: true,
          },
        },
      },
    });

    if (!story) {
      return null;
    }

    const wordCount = getWordCount(story.content);

    return {
      id: story.id,
      title: story.title,
      content: story.content,
      language: story.language,
      source: story.source,
      difficultyLevel: story.difficultyLevel,
      wordCount,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      sentences: story.sentences,
    };
  }

  /**
   * Delete a story (cascade deletes sentences automatically via Prisma schema)
   */
  static async deleteStory(storyId: string, userId: string): Promise<boolean> {
    try {
      // Verify ownership and delete
      const result = await prisma.story.deleteMany({
        where: {
          id: storyId,
          userId, // Ensure user owns the story
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw new Error('Failed to delete story');
    }
  }

  /**
   * Get sentence by ID (used for vocabulary context)
   */
  static async getSentenceById(sentenceId: string): Promise<{ text: string; storyId: string } | null> {
    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      select: {
        text: true,
        storyId: true,
      },
    });

    return sentence;
  }
}
