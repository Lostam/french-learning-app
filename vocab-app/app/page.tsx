'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.push('/stories');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VocabReader</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
