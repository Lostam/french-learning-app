'use client';

import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X } from 'lucide-react';
import apiClient from '@/src/lib/api';

interface WordDefinition {
  word: string;
  definition: string;
  translation: string;
  partOfSpeech: string;
  contextNote?: string;
}

interface SavedVocabularyWord extends WordDefinition {
  id: string;
  sentenceId: string;
  storyId: string;
}

interface WordBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  word: string | null;
  sentenceId: string | null;
  storyId: string;
  savedWord?: SavedVocabularyWord | null;
  onWordSaved: (word: SavedVocabularyWord) => void;
}

export function WordBottomSheet({
  isOpen,
  onClose,
  word,
  sentenceId,
  storyId,
  savedWord,
  onWordSaved,
}: WordBottomSheetProps) {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when word changes
  useEffect(() => {
    if (!isOpen || !word) {
      setDefinition(null);
      setLoading(false);
      setSaving(false);
      setSaved(false);
      setError(null);
      return;
    }

    // If word is already saved, show it immediately
    if (savedWord) {
      setDefinition({
        word: savedWord.word,
        definition: savedWord.definition,
        translation: savedWord.translation,
        partOfSpeech: savedWord.partOfSpeech,
        contextNote: savedWord.contextNote,
      });
      setSaved(true);
      return;
    }

    // Otherwise, fetch definition from API
    const fetchDefinition = async () => {
      if (!sentenceId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post('/vocabulary/lookup', {
          word,
          sentenceId,
        });

        // API returns the definition directly without a data wrapper
        const data = response.data;
        setDefinition({
          word: word, // Word is not in response, use the original word
          definition: data.definition,
          translation: data.translation,
          partOfSpeech: data.partOfSpeech,
          contextNote: data.contextNote,
        });
      } catch (err: any) {
        console.error('Error fetching word definition:', err);
        setError(err.response?.data?.message || 'Failed to fetch definition');
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [isOpen, word, sentenceId, savedWord]);

  const handleSave = async () => {
    if (!definition || !sentenceId || saved) return;

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.post('/vocabulary', {
        word: definition.word,
        definition: definition.definition,
        translation: definition.translation,
        partOfSpeech: definition.partOfSpeech,
        contextNote: definition.contextNote,
        sentenceId,
        storyId,
      });

      // API returns the vocabulary word directly
      const savedVocabWord = response.data;
      setSaved(true);
      onWordSaved(savedVocabWord);

      // Show success feedback
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving word:', err);
      setError(err.response?.data?.message || 'Failed to save word');
    } finally {
      setSaving(false);
    }
  };

  const getPartOfSpeechColor = (pos: string) => {
    const lower = pos.toLowerCase();
    if (lower.includes('noun')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('verb')) return 'bg-green-100 text-green-800';
    if (lower.includes('adj')) return 'bg-purple-100 text-purple-800';
    if (lower.includes('adv')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 outline-none"
          style={{
            maxHeight: '85vh',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="px-6 pb-8 overflow-y-auto max-h-[calc(85vh-60px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500">Loading definition...</p>
              </div>
            ) : error ? (
              <div className="py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
            ) : definition ? (
              <div className="space-y-6">
                {/* Word and part of speech */}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {definition.word}
                  </h2>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPartOfSpeechColor(
                      definition.partOfSpeech
                    )}`}
                  >
                    {definition.partOfSpeech}
                  </span>
                </div>

                {/* Definition */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Definition
                  </h3>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {definition.definition}
                  </p>
                </div>

                {/* Translation */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Translation
                  </h3>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {definition.translation}
                  </p>
                </div>

                {/* Context note */}
                {definition.contextNote && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-700 mb-2">
                      Context Note
                    </h3>
                    <p className="text-blue-900 leading-relaxed">
                      {definition.contextNote}
                    </p>
                  </div>
                )}

                {/* Save button */}
                {saved ? (
                  <Button
                    disabled
                    className="w-full bg-green-500 hover:bg-green-500 text-white"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Saved to Vocabulary
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save to Vocabulary'
                    )}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
