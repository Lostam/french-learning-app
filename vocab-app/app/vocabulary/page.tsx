'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'next/navigation';
import BottomNav from '@/src/components/layout/BottomNav';

export default function VocabularyPage() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Your vocabulary list is empty.</p>
          <p className="text-sm text-gray-400 mt-2">Words you look up will appear here!</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
