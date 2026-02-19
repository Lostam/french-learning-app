'use client';

import { memo } from 'react';

interface HighlightableTextProps {
  sentence: string;
  sentenceId: string;
  savedWords: Set<string>;
  onWordClick: (word: string, sentenceId: string) => void;
}

// Strip punctuation for matching while keeping it for display
function stripPunctuation(word: string): string {
  // Keep apostrophes for contractions like "don't", "c'est"
  // Remove trailing/leading punctuation but keep dots in abbreviations like "M."
  return word.replace(/^[^\w']+|[^\w'.]+$/g, '').toLowerCase();
}

function splitIntoWords(text: string): Array<{ original: string; normalized: string }> {
  // Split by spaces while preserving the original text
  const words = text.split(/(\s+)/);
  return words.map((word) => ({
    original: word,
    normalized: stripPunctuation(word),
  }));
}

export const HighlightableText = memo(function HighlightableText({
  sentence,
  sentenceId,
  savedWords,
  onWordClick,
}: HighlightableTextProps) {
  const words = splitIntoWords(sentence);

  return (
    <p className="text-lg leading-relaxed text-gray-800">
      {words.map((wordObj, index) => {
        // Skip whitespace
        if (!wordObj.normalized) {
          return <span key={index}>{wordObj.original}</span>;
        }

        const isSaved = savedWords.has(wordObj.normalized);

        return (
          <span
            key={index}
            onClick={() => onWordClick(wordObj.normalized, sentenceId)}
            className={`
              inline-block cursor-pointer transition-all duration-200
              hover:bg-blue-50 active:bg-blue-100 rounded-sm
              min-h-[44px] min-w-[44px] py-1 px-0.5
              ${isSaved ? 'border-b-2 border-blue-500 font-medium text-blue-700' : ''}
            `}
            style={{
              // Ensure minimum tap target of 44px
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            }}
          >
            {wordObj.original}
          </span>
        );
      })}
    </p>
  );
});
