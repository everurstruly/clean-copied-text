'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  animateY?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FadeIn({ children, delay = 0, duration = 0.5, y = 20, animateY = 0, className, style }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: animateY }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function FadeInHeader({ children, delay = 0, duration = 0.7, className, style }: FadeInProps) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      style={style}
    >
      {children}
    </motion.h1>
  );
}

interface FadeInLinkProps extends FadeInProps {
  href: string;
}

export function FadeInLink({ children, href, delay = 0, duration = 0.5, className, style }: FadeInLinkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      style={style}
    >
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    </motion.div>
  );
}
