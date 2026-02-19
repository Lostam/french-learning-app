'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/src/lib/api';
import { StoryReader } from '@/src/components/reader/StoryReader';

interface Sentence {
  id: string;
  text: string;
  position: number;
  storyId: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  language: string;
  source: string;
  createdAt: string;
  sentences: Sentence[];
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

export default function StoryReaderPage() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !storyId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch story with sentences
        const storyResponse = await apiClient.get(`/stories/${storyId}`);
        const storyData = storyResponse.data.data?.story || storyResponse.data.story;
        setStory(storyData);

        // Fetch saved vocabulary for this story
        const vocabResponse = await apiClient.get(`/vocabulary?storyId=${storyId}`);
        const vocabData = vocabResponse.data.words || [];
        setVocabularyWords(vocabData);
      } catch (err: any) {
        console.error('Error fetching story data:', err);
        setError(err.response?.data?.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, storyId]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/stories')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 line-clamp-1">
              {story?.title || 'Story'}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => router.push('/stories')}>
              Back to Stories
            </Button>
          </div>
        ) : story ? (
          <StoryReader story={story} vocabularyWords={vocabularyWords} />
        ) : null}
      </main>
    </div>
  );
}
