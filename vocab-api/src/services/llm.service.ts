import Anthropic from '@anthropic-ai/sdk';

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
};

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
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-3-5-haiku-latest',
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
   */
  static async generateStory(params: {
    topic: string;
    difficulty: string;
    length: string;
    language: string;
  }): Promise<{ title: string; content: string }> {
    try {
      const { topic, difficulty, length, language } = params;

      // Map length to approximate word counts
      const lengthMap: Record<string, string> = {
        short: '150-250 words',
        medium: '300-500 words',
        long: '600-900 words',
      };
      const wordCount = lengthMap[length] || lengthMap.medium;

      // Map difficulty to language complexity guidance
      const difficultyMap: Record<string, string> = {
        beginner: 'Use simple vocabulary, short sentences, present tense, and common everyday words. Avoid idioms and complex grammar.',
        intermediate: 'Use moderate vocabulary, varied sentence structures, and some idiomatic expressions. Include past and future tenses.',
        advanced: 'Use rich vocabulary, complex sentences, idioms, and varied tenses. Include nuanced expressions and literary devices.',
      };
      const complexityGuidance = difficultyMap[difficulty] || difficultyMap.intermediate;

      const prompt = `You are a language learning content creator. Generate an engaging story in ${language} for language learners.

Topic: ${topic}
Target length: ${wordCount}
Difficulty level: ${difficulty}

Language complexity guidance:
${complexityGuidance}

Requirements:
1. The story should be interesting and engaging
2. Use natural, authentic ${language} language
3. Include dialogue where appropriate
4. The story should have a clear beginning, middle, and end
5. Make the content culturally appropriate and educational

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "title": "Story title in ${language}",
  "content": "The full story text in ${language}"
}`;

      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const responseText = content.text.trim();
      const parsed = this.parseStoryResponse(responseText);

      return parsed;
    } catch (error) {
      console.error('Story Generation Error:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to generate story: ${error.message}`);
      }
      throw new Error('Failed to generate story: Unknown error');
    }
  }

  /**
   * Parse and validate story generation response from Claude
   */
  private static parseStoryResponse(responseText: string): { title: string; content: string } {
    try {
      const parsed = JSON.parse(responseText);

      if (typeof parsed.title !== 'string' || typeof parsed.content !== 'string') {
        throw new Error('Response missing required fields or fields have wrong type');
      }

      if (!parsed.title.trim() || !parsed.content.trim()) {
        throw new Error('Response contains empty required fields');
      }

      return {
        title: parsed.title.trim(),
        content: parsed.content.trim(),
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Claude API returned invalid JSON');
      }
      throw error;
    }
  }
}
