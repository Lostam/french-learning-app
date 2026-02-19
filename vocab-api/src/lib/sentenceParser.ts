/**
 * Sentence Parser
 * Splits text into sentences with accurate boundary detection
 * Handles abbreviations, dialogue, ellipsis, and multiple punctuation
 */

// Common abbreviations that shouldn't end a sentence
const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
  'vs', 'etc', 'e.g', 'i.e', 'viz', 'al',
  'St', 'Ave', 'Blvd', 'Rd', 'Inc', 'Ltd', 'Co',
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  // French abbreviations
  'M', 'Mme', 'Mlle', 'Dr', 'Pr',
];

/**
 * Splits text into sentences
 * @param text - The text to parse
 * @returns Array of sentence strings
 */
export function parseSentences(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Normalize whitespace
  let processed = text.trim().replace(/\s+/g, ' ');

  // Protect abbreviations by temporarily replacing periods
  // Match abbreviation followed by period and then lowercase or another capital
  const abbrevRegex = new RegExp(`\\b(${ABBREVIATIONS.join('|')})\\.`, 'g');
  const placeholders: Map<string, string> = new Map();
  let placeholderIndex = 0;

  processed = processed.replace(abbrevRegex, (match) => {
    const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
    placeholders.set(placeholder, match);
    placeholderIndex++;
    return placeholder;
  });

  // DON'T protect ellipsis - let them act as sentence terminators when followed by capitals

  // Now split on sentence boundaries
  // Look for: [.!?]+ (or ellipsis) optionally followed by quotes, then whitespace, then uppercase or end
  const sentences: string[] = [];
  let start = 0;

  // Regex to find sentence terminators
  // Matches: one or more .!? (including ellipsis ...) followed by optional quotes, followed by space and capital letter
  const regex = /[.!?]+["']?\s+(?=[A-Z\u00C0-\u017F])/g;

  let match;
  while ((match = regex.exec(processed)) !== null) {
    const end = match.index + match[0].length;
    let sentence = processed.substring(start, end).trim();

    // Restore placeholders
    placeholders.forEach((original, placeholder) => {
      sentence = sentence.replace(new RegExp(placeholder, 'g'), original);
    });

    if (sentence.length > 0) {
      sentences.push(sentence);
    }

    start = end;
  }

  // Handle the last sentence (or only sentence if no matches)
  if (start < processed.length) {
    let sentence = processed.substring(start).trim();

    // Restore placeholders
    placeholders.forEach((original, placeholder) => {
      sentence = sentence.replace(new RegExp(placeholder, 'g'), original);
    });

    if (sentence.length > 0) {
      sentences.push(sentence);
    }
  }

  return sentences;
}

/**
 * Gets word count for a text
 * @param text - The text to count words in
 * @returns Number of words
 */
export function getWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Split on whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
