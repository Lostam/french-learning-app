'use client';

import { useState, useMemo, useCallback } from 'react';
import { HighlightableText } from './HighlightableText';
import { WordBottomSheet } from './WordBottomSheet';

interface Sentence {
  id: string;
  text: string;
  position: number;
  storyId: string;
}

interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  translation: string;
  partOfSpeech: string;
  contextNote?: string;
  sentenceId: string;
  storyId: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  language: string;
  sentences: Sentence[];
}

interface StoryReaderProps {
  story: Story;
  vocabularyWords: VocabularyWord[];
}

// Strip punctuation for matching (same logic as HighlightableText)
function normalizeWord(word: string): string {
  return word.replace(/^[^\w']+|[^\w'.]+$/g, '').toLowerCase();
}

export function StoryReader({ story, vocabularyWords }: StoryReaderProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Create a map of normalized words to saved vocabulary for quick lookup
  const savedWordsMap = useMemo(() => {
    const map = new Map<string, VocabularyWord>();
    vocabularyWords.forEach((vocabWord) => {
      const normalized = normalizeWord(vocabWord.word);
      map.set(normalized, vocabWord);
    });
    return map;
  }, [vocabularyWords]);

  // Create a Set of saved word strings for quick highlighting checks
  const savedWordsSet = useMemo(() => {
    return new Set(vocabularyWords.map((w) => normalizeWord(w.word)));
  }, [vocabularyWords]);

  const handleWordClick = useCallback(
    (word: string, sentenceId: string) => {
      setSelectedWord(word);
      setSelectedSentenceId(sentenceId);
      setIsBottomSheetOpen(true);
    },
    []
  );

  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetOpen(false);
    // Delay clearing selected word to allow smooth close animation
    setTimeout(() => {
      setSelectedWord(null);
      setSelectedSentenceId(null);
    }, 300);
  }, []);

  const handleWordSaved = useCallback(
    (savedWord: VocabularyWord) => {
      // Update the saved words map and set
      const normalized = normalizeWord(savedWord.word);
      savedWordsMap.set(normalized, savedWord);
      savedWordsSet.add(normalized);

      // Force re-render by creating new Set
      // This will trigger the useMemo dependencies
      vocabularyWords.push(savedWord);
    },
    [savedWordsMap, savedWordsSet, vocabularyWords]
  );

  // Get the saved word object if the selected word is already saved
  const savedWordObject = useMemo(() => {
    if (!selectedWord) return null;
    return savedWordsMap.get(selectedWord) || null;
  }, [selectedWord, savedWordsMap]);

  return (
    <div className="space-y-6">
      {/* Story title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.title}</h1>
        <p className="text-sm text-gray-500">
          <span className="capitalize">{story.language}</span> • {story.sentences.length} sentences
        </p>
      </div>

      {/* Sentences */}
      <div className="space-y-6">
        {story.sentences.map((sentence) => (
          <div
            key={sentence.id}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <HighlightableText
              sentence={sentence.text}
              sentenceId={sentence.id}
              savedWords={savedWordsSet}
              onWordClick={handleWordClick}
            />
          </div>
        ))}
      </div>

      {/* Word bottom sheet */}
      <WordBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleCloseBottomSheet}
        word={selectedWord}
        sentenceId={selectedSentenceId}
        storyId={story.id}
        savedWord={savedWordObject}
        onWordSaved={handleWordSaved}
      />
    </div>
  );
}
