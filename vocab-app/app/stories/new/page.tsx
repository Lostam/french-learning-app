'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import StoryForm from '@/src/components/stories/StoryForm';
import apiClient from '@/src/lib/api';

const LANGUAGES = [
  { value: 'fr', label: 'French 🇫🇷' },
  { value: 'en', label: 'English 🇬🇧' },
  { value: 'es', label: 'Spanish 🇪🇸' },
  { value: 'he', label: 'Hebrew 🇮🇱' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const LENGTHS = ['Short', 'Medium', 'Long'];

export default function NewStoryPage() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('paste');

  // AI Generation form state
  const [aiTopic, setAiTopic] = useState('');
  const [aiLanguage, setAiLanguage] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('');
  const [aiLength, setAiLength] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleStoryCreated = (storyId: string) => {
    router.push(`/stories/${storyId}`);
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!aiTopic.trim()) {
      setAiError('Topic is required');
      return;
    }
    if (!aiLanguage) {
      setAiError('Language is required');
      return;
    }
    if (!aiDifficulty) {
      setAiError('Difficulty is required');
      return;
    }
    if (!aiLength) {
      setAiError('Story length is required');
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);

      const response = await apiClient.post('/stories/generate', {
        topic: aiTopic.trim(),
        language: aiLanguage,
        difficulty: aiDifficulty,
        length: aiLength,
      });

      const storyId = response.data.data.story.id;
      router.push(`/stories/${storyId}`);
    } catch (err: any) {
      console.error('Error generating story:', err);
      setAiError(
        err.response?.data?.message || 'Failed to generate story. Please try again.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Add Story</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
            <TabsTrigger value="generate">Generate with AI</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <StoryForm onSuccess={handleStoryCreated} />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <form onSubmit={handleGenerateAI} className="space-y-4">
                {aiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {aiError}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Topic
                  </label>
                  <Input
                    id="topic"
                    type="text"
                    placeholder="e.g., A day at the beach, A visit to Paris..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={aiLoading}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ai-language" className="text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <Select value={aiLanguage} onValueChange={setAiLanguage} disabled={aiLoading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="difficulty" className="text-sm font-medium text-gray-700">
                    Difficulty Level
                  </label>
                  <Select value={aiDifficulty} onValueChange={setAiDifficulty} disabled={aiLoading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((difficulty) => (
                        <SelectItem
                          key={difficulty}
                          value={difficulty.toLowerCase()}
                        >
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="length" className="text-sm font-medium text-gray-700">
                    Story Length
                  </label>
                  <Select value={aiLength} onValueChange={setAiLength} disabled={aiLoading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTHS.map((length) => (
                        <SelectItem key={length} value={length.toLowerCase()}>
                          {length}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={aiLoading || !aiTopic.trim() || !aiLanguage || !aiDifficulty || !aiLength}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Story...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Story
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  AI will generate a story based on your topic and preferences
                </p>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
