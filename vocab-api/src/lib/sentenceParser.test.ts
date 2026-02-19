/**
 * Unit tests for sentenceParser
 */

import { parseSentences, getWordCount } from './sentenceParser';

describe('parseSentences', () => {
  test('basic sentences with periods', () => {
    const text = 'Hello world. This is a test. How are you?';
    const result = parseSentences(text);
    expect(result).toEqual([
      'Hello world.',
      'This is a test.',
      'How are you?'
    ]);
  });

  test('handles abbreviations', () => {
    const text = 'Dr. Smith went to the store. He met Mrs. Jones there.';
    const result = parseSentences(text);
    expect(result).toEqual([
      'Dr. Smith went to the store.',
      'He met Mrs. Jones there.'
    ]);
  });

  test('handles dialogue with quotes', () => {
    const text = '"Hello," she said. "How are you?" He replied.';
    const result = parseSentences(text);
    // Quotes after periods may group together, then split on capital after quote
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toContain('Hello');
    expect(result.some(s => s.includes('He replied'))).toBe(true);
  });

  test('handles ellipsis', () => {
    // Ellipsis doesn't end a sentence unless followed by capital letter
    const text = 'I was thinking... Maybe we should go. What do you think?';
    const result = parseSentences(text);
    // Ellipsis followed by capital should split
    expect(result).toEqual([
      'I was thinking...',
      'Maybe we should go.',
      'What do you think?'
    ]);
  });

  test('handles multiple punctuation', () => {
    const text = 'Really!? That is amazing! Are you sure?!';
    const result = parseSentences(text);
    expect(result).toEqual([
      'Really!?',
      'That is amazing!',
      'Are you sure?!'
    ]);
  });

  test('handles French abbreviations', () => {
    const text = 'M. Dupont est allé au marché. Mme Martin était là aussi.';
    const result = parseSentences(text);
    expect(result).toEqual([
      'M. Dupont est allé au marché.',
      'Mme Martin était là aussi.'
    ]);
  });

  test('handles mixed punctuation and dialogue', () => {
    const text = '"Wait!" She exclaimed. "Don\'t go yet." He stopped.';
    const result = parseSentences(text);
    // Exclamation followed by capital splits
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toContain('Wait');
    expect(result.some(s => s.includes('stopped'))).toBe(true);
  });

  test('handles text without ending punctuation', () => {
    const text = 'This is the first sentence. This is incomplete';
    const result = parseSentences(text);
    expect(result).toEqual([
      'This is the first sentence.',
      'This is incomplete'
    ]);
  });

  test('handles empty text', () => {
    expect(parseSentences('')).toEqual([]);
    expect(parseSentences('   ')).toEqual([]);
  });

  test('handles single sentence', () => {
    const text = 'This is a single sentence.';
    const result = parseSentences(text);
    expect(result).toEqual(['This is a single sentence.']);
  });

  test('handles extra whitespace', () => {
    const text = 'First sentence.    Second sentence.   Third sentence.';
    const result = parseSentences(text);
    expect(result).toEqual([
      'First sentence.',
      'Second sentence.',
      'Third sentence.'
    ]);
  });

  test('complex story with multiple edge cases', () => {
    const text = `Dr. Johnson said, "I'll be there at 3 p.m." Mrs. Smith replied, "That's perfect!" Meanwhile, Mr. Brown was thinking... He wondered if he should go.`;

    const result = parseSentences(text);

    // Should handle abbreviations, quotes, ellipsis, and various punctuation
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toContain('Dr. Johnson');
    expect(result.some(s => s.includes('Mrs. Smith') || s.includes('Brown'))).toBe(true);
  });
});

describe('getWordCount', () => {
  test('counts words correctly', () => {
    expect(getWordCount('Hello world')).toBe(2);
    expect(getWordCount('This is a test sentence')).toBe(5);
  });

  test('handles extra whitespace', () => {
    expect(getWordCount('Hello    world')).toBe(2);
    expect(getWordCount('  Test  sentence  here  ')).toBe(3);
  });

  test('handles empty text', () => {
    expect(getWordCount('')).toBe(0);
    expect(getWordCount('   ')).toBe(0);
  });

  test('counts words with punctuation', () => {
    expect(getWordCount('Hello, world! How are you?')).toBe(5);
  });
});
