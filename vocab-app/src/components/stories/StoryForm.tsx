'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/src/lib/api';

interface StoryFormProps {
  onSuccess: (storyId: string) => void;
}

const LANGUAGES = [
  { value: 'fr', label: 'French 🇫🇷' },
  { value: 'en', label: 'English 🇬🇧' },
  { value: 'es', label: 'Spanish 🇪🇸' },
  { value: 'he', label: 'Hebrew 🇮🇱' },
];

export default function StoryForm({ onSuccess }: StoryFormProps) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!language) {
      setError('Language is required');
      return;
    }
    if (!content.trim()) {
      setError('Story content is required');
      return;
    }
    if (wordCount < 10) {
      setError('Story must be at least 10 words');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/stories', {
        title: title.trim(),
        language,
        content: content.trim(),
        source: 'USER_ADDED',
      });

      const storyId = response.data.data.story.id;
      onSuccess(storyId);
    } catch (err: any) {
      console.error('Error creating story:', err);
      setError(
        err.response?.data?.message || 'Failed to create story. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Title
        </label>
        <Input
          id="title"
          type="text"
          placeholder="Enter story title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="language" className="text-sm font-medium text-gray-700">
          Language
        </label>
        <Select value={language} onValueChange={setLanguage} disabled={loading}>
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
        <div className="flex justify-between items-center">
          <label htmlFor="content" className="text-sm font-medium text-gray-700">
            Story Content
          </label>
          <span className="text-xs text-gray-500">
            {wordCount} words • {charCount} characters
          </span>
        </div>
        <Textarea
          id="content"
          placeholder="Paste or type your story here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          className="min-h-[300px] w-full resize-y"
        />
        <p className="text-xs text-gray-500">
          Minimum 10 words required
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !title.trim() || !language || !content.trim()}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Story...
          </>
        ) : (
          'Create Story'
        )}
      </Button>
    </form>
  );
}
