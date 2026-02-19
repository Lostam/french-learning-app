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
import { ArrowLeft } from 'lucide-react';
import StoryForm from '@/src/components/stories/StoryForm';

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

  const handleGenerateAI = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for AI generation - will be implemented later
    alert('AI story generation coming soon!');
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
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ai-language" className="text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <Select value={aiLanguage} onValueChange={setAiLanguage}>
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
                  <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
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
                  <Select value={aiLength} onValueChange={setAiLength}>
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

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                  <p className="text-sm text-blue-800">
                    <strong>Coming Soon:</strong> AI-powered story generation will
                    be available in a future update. For now, use the "Paste Text"
                    tab to add your own stories.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled
                >
                  Generate Story (Coming Soon)
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
