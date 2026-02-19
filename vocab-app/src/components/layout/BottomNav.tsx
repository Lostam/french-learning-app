'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Brain, BookMarked, BarChart3 } from 'lucide-react';

const navItems = [
  {
    name: 'Stories',
    href: '/stories',
    icon: BookOpen,
  },
  {
    name: 'Practice',
    href: '/practice',
    icon: Brain,
  },
  {
    name: 'Vocabulary',
    href: '/vocabulary',
    icon: BookMarked,
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: BarChart3,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
