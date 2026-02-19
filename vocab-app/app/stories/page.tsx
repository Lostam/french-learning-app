'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'next/navigation';
import BottomNav from '@/src/components/layout/BottomNav';
import StoryCard from '@/src/components/stories/StoryCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import apiClient from '@/src/lib/api';

interface Story {
  id: string;
  title: string;
  content: string;
  language: string;
  source: string;
  createdAt: string;
}

export default function StoriesPage() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
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
    const fetchStories = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/stories');
        setStories(response.data.data.stories);
      } catch (err: any) {
        console.error('Error fetching stories:', err);
        setError(err.response?.data?.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const getWordCount = (content?: string) => {
    if (!content) return 0;
    return content.trim().split(/\s+/).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">No stories yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Get started by adding your first story!
            </p>
            <Button onClick={() => router.push('/stories/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Story
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                id={story.id}
                title={story.title}
                language={story.language}
                wordCount={getWordCount(story.content)}
                createdAt={story.createdAt}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!loading && stories.length > 0 && (
        <Button
          size="lg"
          className="fixed bottom-24 right-6 rounded-full shadow-lg h-14 w-14 p-0 z-20"
          onClick={() => router.push('/stories/new')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <BottomNav />
    </div>
  );
}
