import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Chrome, Download, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { FadeIn, FadeInHeader, FadeInLink } from '@/components/landing/FadeIn';

const sponsors = [
  {
    name: 'Oghenetefa O. O.',
    desc: 'The creator. Building affordable, sustainable solutions for real problems.',
    img: 'https://picsum.photos/seed/creator/400/400',
    delay: 0.1
  },
  {
    name: 'Chat Clarity',
    desc: 'A elegant sidebar to cleanup and export your AI chat history across multiple platforms.',
    img: 'https://picsum.photos/seed/cluely/400/400',
    delay: 0.2
  }
];

export default function LandingPage() {
  const systemSans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
  const systemSerif = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

  return (
    <div
      className="min-h-screen bg-white text-black selection:bg-black selection:text-white antialiased transition-colors duration-500 dark:bg-black dark:text-white dark:selection:bg-white dark:selection:text-black"
      style={{ fontFamily: systemSans }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black transition-colors duration-500">
        <div className="max-w-5xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between border-b border-neutral-50 dark:border-neutral-900">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center gap-10">
            <Link href="/">
              <PremiumButton size="sm">
                <Download className="size-[14px]" strokeWidth={2.5} />
                Open App
              </PremiumButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 md:px-8">
        {/* Hero Section */}
        <section className="pt-36 pb-16 text-center flex flex-col items-center">
          <FadeInHeader
            className="text-[clamp(2.5rem,10vw,4.5rem)] font-bold leading-[1.05] mb-4"
            style={{
              fontFamily: systemSerif,
              letterSpacing: '-0.022em'
            }}
          >
            Clean copy for <br />
            your messy text
          </FadeInHeader>

          <FadeIn
            delay={0.1}
            className="flex flex-col items-center"
          >
            <p className="text-base md:text-lg text-neutral-500 leading-relaxed mb-12 max-w-2xl" style={{ letterSpacing: '0' }}>
              Fix AI messages, copy pastes, and broken formatting in seconds. Turn rough text into something clean, structured, and ready to use.
            </p>

            <Link href="/">
              <PremiumButton className="shadow-[0_20px_50px_rgba(37,99,235,0.3)]">
                <Chrome className="size-[20px]" strokeWidth={2.5} />
                Open Clean Copy
              </PremiumButton>
            </Link>
          </FadeIn>

          {/* Showcase Mockup */}
          <FadeIn
            delay={0.4}
            duration={1}
            y={40}
            animateY={4}
            className="mt-26 w-full max-w-5xl aspect-[16/9] bg-neutral-50 dark:bg-neutral-900/30 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-900 shadow-2xl overflow-hidden p-4 relative"
          >
            <div className="absolute top-0 left-0 right-0 h-10 flex items-center px-6 gap-2 border-b border-neutral-100 dark:border-neutral-900 bg-white/50 dark:bg-black/50 backdrop-blur">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="size-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="size-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
            <div className="mt-10 h-full w-full bg-white dark:bg-black rounded-2xl flex border border-neutral-100 dark:border-neutral-900 overflow-hidden shadow-sm">
              <div className="flex-1 bg-neutral-50 dark:bg-neutral-900/20 flex items-center justify-center">
                <div className="max-w-xs w-full space-y-4 opacity-5">
                  <div className="h-6 bg-black dark:bg-white rounded w-3/4" />
                  <div className="h-24 bg-black dark:bg-white rounded" />
                </div>
              </div>
              <div className="w-[280px] border-l border-neutral-50 dark:border-neutral-900 p-4 space-y-4">
                <div className="h-5 w-1/2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 w-full border border-neutral-50 dark:border-neutral-900 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Feature Cards */}
        <section id="features" className="py-24 border-t border-neutral-100 dark:border-neutral-900">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-semibold tracking-tight" style={{ fontFamily: systemSerif }}>How it helps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <FadeIn
              delay={0.2}
              className="bg-neutral-50 dark:bg-neutral-900/30 rounded-[2.5rem] p-12 flex flex-col items-center text-center overflow-hidden h-[520px]"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 text-indigo-600">Precision</span>
              <h2 className="text-[32px] font-semibold mb-4 tracking-[-0.022em] leading-tight">Deep Cleaning</h2>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed mb-10 max-w-md">
                Strip away zero-width spaces, BOMs, and invisible formatting artifacts that break your code and documents.
              </p>
              <div className="mt-auto w-full max-w-[320px] bg-white dark:bg-black rounded-t-3xl shadow-lg border border-neutral-100 dark:border-neutral-900 p-8 h-52 relative">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-8 w-full border border-neutral-50 dark:border-neutral-900 rounded-xl flex items-center px-4 gap-3 ${i === 2 ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-900' : ''}`}>
                      <div className={`size-3 rounded-full border ${i === 2 ? 'bg-indigo-600 border-indigo-600' : 'border-neutral-200 dark:border-neutral-800'}`} />
                      <div className={`h-2 rounded-full w-3/4 ${i === 2 ? 'bg-indigo-200 dark:bg-indigo-300/30' : 'bg-neutral-100 dark:bg-neutral-800'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn
              delay={0.3}
              className="bg-neutral-50 dark:bg-neutral-900/30 rounded-[2.5rem] p-12 flex flex-col items-center text-center overflow-hidden h-[520px]"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 text-indigo-600">Formatting</span>
              <h2 className="text-[32px] font-semibold mb-4 tracking-[-0.022em] leading-tight">Smart Formatting</h2>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed mb-10 max-w-md">
                Instantly structure your text into perfectly formatted Markdown, HTML, or plain text. Ready to paste anywhere.
              </p>
              <div className="mt-auto w-full max-w-md bg-white dark:bg-black rounded-t-3xl shadow-lg border border-neutral-100 dark:border-neutral-900 h-52 p-8 flex flex-col items-center justify-center relative gap-6">
                <div className="flex gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-[10px] font-bold text-neutral-400 dark:text-neutral-600">.MD</div>
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900 text-[10px] font-bold text-indigo-600">.JSON</div>
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-[10px] font-bold text-neutral-400 dark:text-neutral-600">.TXT</div>
                </div>
                <div className="w-12 h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-indigo-600" />
                </div>
              </div>
            </FadeIn>

          </div>
        </section>

        {/* Sponsored by Ecosystem Grid */}
        <section className="py-24 border-t border-neutral-100 dark:border-neutral-900">
          <div className="flex flex-col gap-12">
            <div className="text-center">
              <h2 className="text-[32px] font-semibold tracking-tight" style={{ fontFamily: systemSerif }}>Partners & Supporters</h2>
            </div>

            <div className="flex overflow-x-auto pb-10 gap-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-6 px-6 md:mx-0 md:px-0 md:flex md:flex-wrap md:justify-center md:gap-8 md:overflow-visible">
              {sponsors.map((item) => (
                <FadeInLink
                  key={item.name}
                  href="#"
                  delay={item.delay}
                  className="flex-shrink-0 w-[260px] md:w-[280px] bg-neutral-50/50 dark:bg-neutral-900/40 rounded-[2rem] overflow-hidden group transition-all flex flex-col snap-center"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Image
                      src={item.img}
                      alt={item.name}
                      fill
                      className="object-cover grayscale-[0.8] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 dark:from-neutral-900/90 to-transparent opacity-40" />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-[17px] font-semibold mb-1.5 tracking-tight group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                      {item.name}
                      <ExternalLink size={13} className="opacity-45 group-hover:opacity-60 transition-opacity" />
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </FadeInLink>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Theme Toggle */}
      <footer className="max-w-5xl mx-auto px-6 md:px-8 py-16 border-t border-neutral-50 dark:border-neutral-900 flex flex-row justify-between items-center gap-8 transition-colors duration-500">
        <div className="text-[11px] font-medium tracking-wide opacity-40">
          © 2026 {APP_CONFIG.brandEmail}. All rights reserved.
        </div>

        <div className="flex items-center gap-6">
          <ThemeToggle />

          <div className="flex gap-8 ml-4">
            <Link href="/terms" className="text-[10px] font-bold tracking-widest uppercase text-neutral-300 dark:text-neutral-700 hover:text-black dark:hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[10px] font-bold tracking-widest uppercase text-neutral-300 dark:text-neutral-700 hover:text-black dark:hover:text-white transition-colors">Privacy</Link>
            <a href="https://github.com/everurstruly/clean-copy" className="text-[10px] font-bold tracking-widest uppercase text-neutral-300 dark:text-neutral-700 hover:text-black dark:hover:text-white transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
