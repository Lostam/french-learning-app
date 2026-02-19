import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export interface ContextualDefinitionRequest {
  word: string;
  sentence: string;
  nativeLanguage: string;
}

export interface ContextualDefinitionResponse {
  definition: string;
  translation: string;
  partOfSpeech: string;
  contextNote: string;
}

/**
 * LLM Service - Wrapper for Anthropic Claude API
 */
export class LLMService {
  /**
   * Get contextual definition for a word within a sentence
   * Uses Claude Haiku for cost efficiency
   */
  static async getContextualDefinition(
    request: ContextualDefinitionRequest
  ): Promise<ContextualDefinitionResponse> {
    try {
      const { word, sentence, nativeLanguage } = request;

      // Build prompt that asks for contextual (not generic) definition
      const prompt = `You are a language learning assistant. Given a word and the sentence it appears in, provide a contextual definition that explains how the word is being used in that specific context.

Word: "${word}"
Sentence: "${sentence}"
User's native language: ${nativeLanguage}

Please provide:
1. A contextual definition (how the word is used in THIS sentence, not a generic dictionary definition)
2. Translation to ${nativeLanguage}
3. Part of speech (noun, verb, adjective, etc.)
4. A brief context note explaining any nuances, idioms, or special usage in this sentence

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "definition": "contextual definition explaining usage in this sentence",
  "translation": "translation to ${nativeLanguage}",
  "partOfSpeech": "part of speech",
  "contextNote": "brief note about usage in this context"
}`;

      // Call Claude Haiku for fast, cost-efficient response
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from response
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const responseText = content.text.trim();

      // Parse and validate JSON response
      const parsed = this.parseAndValidateResponse(responseText);

      return parsed;
    } catch (error) {
      console.error('LLM Service Error:', error);

      // Re-throw with context for upstream error handling
      if (error instanceof Error) {
        throw new Error(`Failed to get contextual definition: ${error.message}`);
      }
      throw new Error('Failed to get contextual definition: Unknown error');
    }
  }

  /**
   * Parse and validate JSON response from Claude
   */
  private static parseAndValidateResponse(responseText: string): ContextualDefinitionResponse {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(responseText);

      // Validate required fields
      if (
        typeof parsed.definition !== 'string' ||
        typeof parsed.translation !== 'string' ||
        typeof parsed.partOfSpeech !== 'string' ||
        typeof parsed.contextNote !== 'string'
      ) {
        throw new Error('Response missing required fields or fields have wrong type');
      }

      // Validate fields are not empty
      if (
        !parsed.definition.trim() ||
        !parsed.translation.trim() ||
        !parsed.partOfSpeech.trim()
      ) {
        throw new Error('Response contains empty required fields');
      }

      return {
        definition: parsed.definition.trim(),
        translation: parsed.translation.trim(),
        partOfSpeech: parsed.partOfSpeech.trim(),
        contextNote: parsed.contextNote.trim(),
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Claude API returned invalid JSON');
      }
      throw error;
    }
  }

  /**
   * Generate a story using Claude Sonnet
   * (Placeholder for future implementation)
   */
  static async generateStory(_params: {
    topic: string;
    difficulty: string;
    length: string;
    language: string;
  }): Promise<{ title: string; content: string }> {
    // TODO: Implement story generation with Claude Sonnet
    throw new Error('Story generation not yet implemented');
  }
}
