'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface StoryCardProps {
  id: string;
  title: string;
  language: string;
  wordCount: number;
  createdAt: string;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  he: '🇮🇱',
};

export default function StoryCard({
  id,
  title,
  language,
  wordCount,
  createdAt,
}: StoryCardProps) {
  const router = useRouter();
  const flag = LANGUAGE_FLAGS[language.toLowerCase()] || '🌐';

  const handleClick = () => {
    router.push(`/stories/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.98]"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-base">{flag}</span>
              <span className="capitalize">{language}</span>
            </span>
            <span>{wordCount} words</span>
          </div>
          <span>{formatDate(createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
