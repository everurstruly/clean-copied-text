import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function PremiumButton({ size = 'md', className, children, ...props }: PremiumButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-medium text-white rounded-full",
        "bg-gradient-to-b from-[#1e6cf0] to-[#0a4ad0] transition-all duration-300",
        "hover:brightness-110 hover:shadow-[0_12px_30px_-4px_rgba(10,74,208,0.5)]",
        "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]",
        size === 'sm' && "px-4 py-2 text-sm",
        size === 'md' && "px-6 py-3 text-base",
        size === 'lg' && "px-8 py-4 text-lg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
