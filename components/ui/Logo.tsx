import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Clean Copy</span>
    </Link>
  );
}
