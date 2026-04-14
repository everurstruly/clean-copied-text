'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Sparkles, Copy, Check, X, FileText, Code, AlignLeft, Moon, Sun, RefreshCw, GripVertical, GripHorizontal, ChevronsUpDown, Download, Keyboard, Command, ClipboardPaste, Undo2, Redo2, CircleHelp, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cleanText } from '@/lib/cleaner';
import { diffWordsWithSpace, Change } from 'diff';
import { Panel, Group, Separator, PanelImperativeHandle } from 'react-resizable-panels';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { marked } from 'marked';

function stripHtml(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerText || '';
}

function normalizePastedHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;

  body.querySelectorAll('script, style, meta, link').forEach((el) => el.remove());

  body.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = el.getAttribute('style');
    
    // remove invisible elements completely
    if (style) {
      if (
        /display\s*:\s*none/i.test(style) ||
        /visibility\s*:\s*hidden/i.test(style) ||
        /opacity\s*:\s*0(?!\.)/i.test(style) ||
        /font-size\s*:\s*0/i.test(style)
      ) {
        el.remove();
        return;
      }
    }

    if (!style) return;

    // remove pasted text/background colors that break dark/light preview
    const cleaned = style
      .replace(/(?:^|;)\s*color\s*:\s*[^;]+/gi, '')
      .replace(/(?:^|;)\s*background(?:-color)?\s*:\s*[^;]+/gi, '')
      .replace(/^\s*;\s*|\s*;\s*$/g, '')
      .replace(/\s*;\s*;/g, ';')
      .trim();

    if (cleaned) {
      el.setAttribute('style', cleaned);
    } else {
      el.removeAttribute('style');
    }
  });

  return body.innerHTML.trim();
}

export default function Page() {
  const [inputText, setInputText] = useState('');
  const [inputHtml, setInputHtml] = useState<string | null>(null);
  const [lastPasteWasRich, setLastPasteWasRich] = useState(false);
  const [outputText, setOutputText] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasteError, setPasteError] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Track last cleaned state to show "Apply Latest Preferences" CTA
  const [lastCleanedOptions, setLastCleanedOptions] = useState<any>(null);
  const [lastCleanedInput, setLastCleanedInput] = useState('');
  
  // Diff view state
  const [viewMode, setViewMode] = useState<'result' | 'diff' | 'preview'>('result');
  const [diffParts, setDiffParts] = useState<Change[]>([]);

  // History state for undo/redo
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const handleInputTextChange = (newText: string) => {
    if (newText !== inputText) {
      setPast(prev => [...prev, inputText]);
      setFuture([]);
      setInputText(newText);
      setInputHtml(null);
      setLastPasteWasRich(false);
    }
  };

  const applyPastedInput = (text: string, html: string | null) => {
    if (text !== inputText) {
      setPast(prev => [...prev, inputText]);
      setFuture([]);
      setInputText(text);
    }

    setInputHtml(html);
    setLastPasteWasRich(Boolean(html && html.trim()));
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    setFuture(prev => [inputText, ...prev]);
    setPast(newPast);
    setInputText(previous);
    setInputHtml(null);
    setLastPasteWasRich(false);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, inputText]);
    setFuture(newFuture);
    setInputText(next);
    setInputHtml(null);
    setLastPasteWasRich(false);
  };

  useEffect(() => {
    if (viewMode === 'diff' && outputText) {
      // Compute diff asynchronously to avoid blocking UI on huge texts
      setTimeout(() => {
        try {
          setDiffParts(diffWordsWithSpace(lastCleanedInput, outputText));
        } catch (err) {
          console.error('Failed to compute diff:', err);
        }
      }, 0);
    }
  }, [viewMode, outputText, lastCleanedInput]);
  
  // Loading state enhancements
  // Removed complex progress bar since local cleaning is instant
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default to true for SSR, or handle properly
  const [countMode, setCountMode] = useState<'chars' | 'words'>('chars');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const inputPanelRef = useRef<PanelImperativeHandle>(null);
  const outputPanelRef = useRef<PanelImperativeHandle>(null);
  const lastPanelSizeRef = useRef<number>(50);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [options, setOptions] = useState({
    format: 'markdown' as 'markdown' | 'html' | 'plain',
    removeLinks: false,
    fixSpacing: true,
    removeHiddenChars: true,
  });
  const [formatTouched, setFormatTouched] = useState(false);

  const statuses = [
    "Analyzing text structure...",
    "Removing hidden characters...",
    "Fixing spacing and punctuation...",
    "Standardizing formatting...",
    "Generating final output..."
  ];

  const handleClean = async () => {
    if (!inputText.trim() && !inputHtml) return;
    setIsCleaning(true);
    
    setLastCleanedOptions(options);
    setLastCleanedInput(inputText);

    try {
      let result = '';

      // preserve rich structure for rich pastes when html output is selected
      if (options.format === 'html' && inputHtml && lastPasteWasRich) {
        result = inputHtml;
      } else {
        result = await cleanText(inputText, options);
      }

      setOutputText(result);
    } catch (error) {
      console.error(error);
      showToast('Failed to clean text. Please try again.');
    } finally {
      setIsCleaning(false);
    }
  };

  const getFormattedText = async (targetFormat: 'html' | 'plain' | 'markdown') => {
    if (targetFormat === options.format) {
      return outputText;
    }
    if (targetFormat === 'html' && inputHtml && lastPasteWasRich) {
      return inputHtml;
    }
    return await cleanText(inputText, { ...options, format: targetFormat });
  };

  const handleCopy = async (overrideFormat?: 'html' | 'plain' | 'markdown') => {
    try {
      if (overrideFormat) {
        setOptions(prev => ({ ...prev, format: overrideFormat }));
        setFormatTouched(true);
      }
      
      let targetFormat = overrideFormat;
      if (!targetFormat) {
        targetFormat = (lastPasteWasRich && inputHtml) ? 'html' : 'markdown';
      }
      
      const contentToCopy = await getFormattedText(targetFormat);
      
      let html = '';
      let text = '';

      if (targetFormat === 'html') {
        html = contentToCopy;
        const temp = document.createElement('div');
        temp.innerHTML = html;
        text = temp.innerText;
      } else if (targetFormat === 'markdown') {
        text = contentToCopy;
        html = await marked.parse(contentToCopy, { breaks: false });
      } else {
        text = contentToCopy;
        html = text.replace(/\n/g, '<br>');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowCopyMenu(false);
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
      // Fallback to plain text
      try {
        let targetFormat = overrideFormat;
        if (!targetFormat) {
          targetFormat = (lastPasteWasRich && inputHtml) ? 'html' : 'markdown';
        }
        const contentToCopy = await getFormattedText(targetFormat);
        await navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setShowCopyMenu(false);
      } catch (fallbackErr) {
        console.error('Failed to copy plain text fallback: ', fallbackErr);
        showToast('Failed to copy. Your browser might be blocking it.');
      }
    }
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();

      let html: string | null = null;
      let text = '';

      for (const item of items) {
        if (!html && item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          html = await blob.text();
        }

        if (!text && item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          text = await blob.text();
        }
      }

      const normalizedHtml = html ? normalizePastedHtml(html) : null;
      if (!text) text = normalizedHtml ? stripHtml(normalizedHtml) : '';

      applyPastedInput(text, normalizedHtml);

      // auto-pick the most likely correct output mode
      if (!formatTouched) {
        setOptions(prev => ({
          ...prev,
          format: normalizedHtml ? 'html' : 'markdown',
        }));
      }
    } catch (err: any) {
      // Suppress the console error for expected permission blocks in iframes
      const errMsg = err?.message || '';
      if (err?.name !== 'NotAllowedError' && !errMsg.includes('permissions policy')) {
        console.error('Failed to read clipboard contents: ', err);
      }
      setPasteError(true);
      showToast('Clipboard access blocked. Please use Ctrl+V / Cmd+V to paste.');
      setTimeout(() => setPasteError(false), 3000);
    }
  };

  const handleNativePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html || text) {
      e.preventDefault();
      
      const normalizedHtml = html ? normalizePastedHtml(html) : null;
      const pastedText = text || (normalizedHtml ? stripHtml(normalizedHtml) : '');
      
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newText = inputText.substring(0, start) + pastedText + inputText.substring(end);
      
      const isReplacingAll = (start === 0 && end === inputText.length);
      const isBoxEmpty = inputText.length === 0;
      const shouldKeepHtml = (isBoxEmpty || isReplacingAll) && normalizedHtml;
      
      setPast(prev => [...prev, inputText]);
      setFuture([]);
      setInputText(newText);
      
      if (shouldKeepHtml) {
        setInputHtml(normalizedHtml);
        setLastPasteWasRich(true);
        if (!formatTouched) {
          setOptions(prev => ({ ...prev, format: 'html' }));
        }
      } else {
        setInputHtml(null);
        setLastPasteWasRich(false);
        if ((isBoxEmpty || isReplacingAll) && !formatTouched) {
          setOptions(prev => ({ ...prev, format: 'markdown' }));
        }
      }
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + pastedText.length;
      }, 0);
    }
  };

  const handleDownload = async (format: 'txt' | 'md' | 'html' = 'txt') => {
    if (!outputText) return;
    
    let content = outputText;
    let mimeType = 'text/plain';
    let extension = format;

    if (format === 'html') {
      content =
        options.format === 'html'
          ? outputText
          : await marked.parse(outputText, { breaks: false });
      mimeType = 'text/html';
    } else if (format === 'md') {
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned-text.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to clean
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (inputText.trim()) {
          handleClean();
        }
      }
      // Cmd/Ctrl + Shift + C to copy output
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
      // Cmd/Ctrl + , to toggle settings (on mobile) or focus it
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        // Settings are now always visible
      }
      // Cmd/Ctrl + / to toggle shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, outputText, options, isDesktop]);

  const getPendingChanges = () => {
    if (!lastCleanedOptions) return [];
    const changes = [];
    if (inputText !== lastCleanedInput) changes.push("Original text was edited");
    if (options.format !== lastCleanedOptions.format) {
      const formatNames = { markdown: 'Markdown', html: 'Document', plain: 'Message' };
      changes.push(`Output format changed to ${formatNames[options.format]}`);
    }
    if (options.removeHiddenChars !== lastCleanedOptions.removeHiddenChars) {
      changes.push(`Remove hidden text ${options.removeHiddenChars ? 'enabled' : 'disabled'}`);
    }
    if (options.fixSpacing !== lastCleanedOptions.fixSpacing) {
      changes.push(`Fix spacing ${options.fixSpacing ? 'enabled' : 'disabled'}`);
    }
    if (options.removeLinks !== lastCleanedOptions.removeLinks) {
      changes.push(`Remove links ${options.removeLinks ? 'enabled' : 'disabled'}`);
    }
    return changes;
  };

  const getCount = (text: string) => {
    if (countMode === 'chars') return `${text.length} chars`;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return `${words} words`;
  };

  const pendingChanges = getPendingChanges();
  const hasUnappliedChanges = outputText && !isCleaning && pendingChanges.length > 0;
  const isReadyToClean = inputText.trim().length > 0 && !outputText && !isCleaning;

  useEffect(() => {
    // Auto-resize on mobile to show more of the output panel when ready to clean
    if (!isDesktop && (isReadyToClean || hasUnappliedChanges) && !isInputFocused) {
      // Small delay to allow keyboard to close and layout to settle
      const timer = setTimeout(() => {
        inputPanelRef.current?.resize(25);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReadyToClean, hasUnappliedChanges, isDesktop, isInputFocused]);

  const handleDismissChanges = () => {
    setLastCleanedOptions(options);
    setLastCleanedInput(inputText);
  };

  const handleResizeDoubleClick = () => {
    const inputPanel = inputPanelRef.current;
    if (!inputPanel) return;
    const currentSize = inputPanel.getSize();
    const sizeValue = typeof currentSize === 'number' ? currentSize : currentSize.asPercentage;
    
    if (sizeValue >= 45 && sizeValue <= 55) {
      // We are currently at ~50/50. Toggle back to the last size if it was not 50.
      if (lastPanelSizeRef.current && (lastPanelSizeRef.current < 45 || lastPanelSizeRef.current > 55)) {
        inputPanel.resize(lastPanelSizeRef.current);
      } else {
        // Fallback if there was no meaningful last size
        inputPanel.resize(100);
      }
    } else {
      // Not at 50/50. Save current size and go to 50/50.
      lastPanelSizeRef.current = sizeValue;
      inputPanel.resize(50);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a] flex flex-col font-sans transition-colors duration-200">
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 min-h-0">
        {/* Header & Pill Strip */}
        <header className="bg-white dark:bg-[#111111] border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 transition-colors duration-200 gap-3 sm:gap-0">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Clean Copy</h1>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              {mounted && (
                <>
                  <Link
                    href="/welcome"
                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    aria-label="Help & Welcome"
                  >
                    <CircleHelp className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { id: 'removeHiddenChars', label: 'Remove hidden text' },
              { id: 'fixSpacing', label: 'Fix spacing' },
              { id: 'removeLinks', label: 'Remove links' },
            ].map((rule) => (
              <button
                key={rule.id}
                onClick={() => setOptions(prev => ({ ...prev, [rule.id]: !prev[rule.id as keyof typeof options] }))}
                className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-colors border ${
                  options[rule.id as keyof typeof options] 
                    ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' 
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                {rule.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {mounted && (
              <>
                <Link
                  href="/welcome"
                  className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                  aria-label="Help & Welcome"
                >
                  <CircleHelp className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 relative min-h-0">
          <Group key={isDesktop ? 'desktop' : 'mobile'} orientation={isDesktop ? 'horizontal' : 'vertical'} className="flex-1 w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-[#111111] min-h-0">
            
            {/* Input Area */}
            <Panel panelRef={inputPanelRef} defaultSize={50} minSize={isDesktop ? 25 : 10} className="relative bg-white dark:bg-[#111111] transition-colors duration-200" style={{ overflow: 'hidden' }}>
              <div className="absolute inset-0 flex flex-col">
                <div className="bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center shrink-0 h-12 sm:h-14">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Original Text</span>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <button 
                      onClick={handlePaste}
                      className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-2 sm:py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-md shadow-sm"
                      title="Paste from clipboard"
                    >
                      {pasteError ? <X className="w-3.5 h-3.5 text-red-500" /> : <ClipboardPaste className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline ml-1.5">{pasteError ? 'Use Ctrl+V' : 'Paste'}</span>
                    </button>
                    <button
                      onClick={handleUndo}
                      disabled={past.length === 0}
                      className="p-1 sm:p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Undo"
                    >
                      <Undo2 className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={future.length === 0}
                      className="p-1 sm:p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Redo"
                    >
                      <Redo2 className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
                <button onClick={() => setCountMode(m => m === 'chars' ? 'words' : 'chars')} className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                  <span className="hidden sm:inline">{getCount(inputText)}</span>
                  <span className="sm:hidden">{getCount(inputText).split(' ')[0]}</span>
                  <ChevronsUpDown className="w-3 h-3" />
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => handleInputTextChange(e.target.value)}
                onPaste={handleNativePaste}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Paste your text here..."
                className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-neutral-700 dark:text-neutral-200 leading-relaxed bg-transparent min-h-0"
              />
              </div>
            </Panel>

            <Separator onDoubleClick={handleResizeDoubleClick} className="w-full h-4 lg:w-4 lg:h-full bg-neutral-200/80 dark:bg-neutral-800/80 border-y lg:border-y-0 lg:border-x border-neutral-300 dark:border-neutral-700 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center cursor-row-resize lg:cursor-col-resize z-10">
              <div className="flex lg:flex-col gap-1 text-neutral-400 dark:text-neutral-500">
                {isDesktop ? <GripVertical className="w-3 h-3" /> : <GripHorizontal className="w-3 h-3" />}
              </div>
            </Separator>

            {/* Output Area */}
            <Panel panelRef={outputPanelRef} defaultSize={50} minSize={isDesktop ? 25 : 10} className="relative bg-white dark:bg-[#111111] transition-colors duration-200" style={{ overflow: 'hidden' }}>
              <div className="absolute inset-0 flex flex-col">
                <div className="bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center shrink-0 h-12 sm:h-14">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-sm font-medium text-neutral-700 dark:text-neutral-300 ${outputText ? 'hidden sm:inline' : ''}`}>Cleaned Result</span>
                    
                    {outputText && (
                      <div className="flex bg-neutral-200/50 dark:bg-neutral-800 rounded-md p-0.5">
                        <button
                          onClick={() => setViewMode('result')}
                          className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-sm transition-colors ${viewMode === 'result' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                          Result
                        </button>
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-sm transition-colors ${viewMode === 'preview' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setViewMode('diff')}
                          className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-sm transition-colors ${viewMode === 'diff' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                          Diff
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    {outputText && (
                      <button onClick={() => setCountMode(m => m === 'chars' ? 'words' : 'chars')} className="flex items-center gap-1 text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <span className="hidden sm:inline">{getCount(outputText)}</span>
                        <span className="sm:hidden">{getCount(outputText).split(' ')[0]}</span>
                        <ChevronsUpDown className="w-3 h-3" />
                      </button>
                    )}
                    {outputText && (
                      <div className="relative inline-flex">
                        <button 
                          onClick={() => handleCopy()}
                          className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-l-md shadow-sm"
                          title="Copy"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline ml-1.5">{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => setShowCopyMenu(!showCopyMenu)}
                          className="flex items-center justify-center px-1.5 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border-y border-r border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-r-md shadow-sm border-l-0"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {showCopyMenu && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg z-50 py-1">
                            <div className="px-3 py-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Copy as</div>
                            <button onClick={() => handleCopy('html')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Document</button>
                            <button onClick={() => handleCopy('plain')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Message</button>
                            <button onClick={() => handleCopy('markdown')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Markdown</button>
                          </div>
                        )}
                      </div>
                    )}
                    {outputText && (
                      <div className="relative">
                        <button 
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-md shadow-sm"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline ml-1.5">Export</span>
                        </button>
                        {showExportMenu && (
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg z-50 py-1">
                            <button onClick={() => handleDownload('txt')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Text (.txt)</button>
                            <button onClick={() => handleDownload('md')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">Markdown (.md)</button>
                            <button onClick={() => handleDownload('html')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">HTML (.html)</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              
              <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                <AnimatePresence>
                  {(hasUnappliedChanges || isReadyToClean) && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                    >
                      <div className="bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 max-w-sm w-full shadow-xl flex flex-col items-center text-center shrink-0 max-h-full overflow-y-auto">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3 sm:mb-4 shrink-0">
                          {isReadyToClean ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" /> : <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-1 sm:mb-2">
                          {isReadyToClean ? 'Ready to Clean' : 'Unapplied Changes'}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-3 sm:mb-4 hidden sm:block">
                          {isReadyToClean ? 'The following settings will be applied:' : 'You have modified the following settings since your last clean:'}
                        </p>
                        
                        <div className="w-full flex flex-wrap justify-center gap-1.5 mb-4 sm:mb-6 max-h-24 overflow-y-auto">
                          {isReadyToClean ? (
                            <>
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Format: {options.format === 'html' ? 'Document' : options.format === 'plain' ? 'Message' : 'Markdown'}</span>
                              {options.removeHiddenChars && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Remove hidden text</span>}
                              {options.fixSpacing && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Fix spacing</span>}
                              {options.removeLinks && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Remove links</span>}
                            </>
                          ) : (
                            pendingChanges.map((change, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                {change}
                              </span>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2 sm:gap-3 w-full mt-auto">
                          {!isReadyToClean && (
                            <button 
                              onClick={handleDismissChanges}
                              className="flex-1 px-3 sm:px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs sm:text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                              Dismiss
                            </button>
                          )}
                          <button 
                            onClick={handleClean}
                            className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {isReadyToClean ? 'Clean Text' : 'Apply Now'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isCleaning && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center z-30 transition-colors duration-200">
                    <div className="flex flex-col items-center gap-4 w-full max-w-xs p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="absolute inset-0 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
                        <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        Cleaning text...
                      </span>
                    </div>
                  </div>
                )}
                
                {viewMode === 'result' ? (
                  <textarea
                    readOnly
                    value={outputText}
                    placeholder="Cleaned text will appear here..."
                    className={`flex-1 w-full p-4 resize-none focus:outline-none text-neutral-700 dark:text-neutral-200 leading-relaxed bg-transparent ${(hasUnappliedChanges || isReadyToClean) ? 'opacity-50' : ''} transition-opacity duration-300 min-h-0`}
                  />
                ) : viewMode === 'preview' ? (
                  <div className={`flex-1 w-full p-4 overflow-auto bg-transparent ${(hasUnappliedChanges || isReadyToClean) ? 'opacity-50' : ''} transition-opacity duration-300 min-h-0`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_*]:max-w-full">
                      {options.format === 'html' ? (
                        <div className="clean-copy-html-preview" dangerouslySetInnerHTML={{ __html: outputText || 'Cleaned text will appear here...' }} />
                      ) : (
                        <Markdown remarkPlugins={[remarkBreaks]}>{outputText || 'Cleaned text will appear here...'}</Markdown>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`flex-1 w-full p-4 overflow-auto text-neutral-700 dark:text-neutral-200 leading-relaxed font-mono text-sm whitespace-pre-wrap bg-transparent ${(hasUnappliedChanges || isReadyToClean) ? 'opacity-50' : ''} transition-opacity duration-300 min-h-0`}>
                    {diffParts.length > 0 ? diffParts.map((part, i) => {
                      if (part.added) {
                        return <span key={i} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-sm">{part.value}</span>;
                      }
                      if (part.removed) {
                        return <span key={i} className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 line-through opacity-70 rounded-sm">{part.value}</span>;
                      }
                      return <span key={i}>{part.value}</span>;
                    }) : (
                      <span className="text-neutral-400 italic">Computing diff...</span>
                    )}
                  </div>
                )}
              </div>
              </div>
            </Panel>
          </Group>
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcuts(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Keyboard className="w-5 h-5" />
                  Keyboard Shortcuts
                </h3>
                <button 
                  onClick={() => setShowShortcuts(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: 'Clean Text', keys: ['⌘', 'Enter'] },
                  { label: 'Copy Output', keys: ['⌘', 'Shift', 'C'] },
                  { label: 'Toggle Settings (Mobile)', keys: ['⌘', ','] },
                  { label: 'Show Shortcuts', keys: ['⌘', '/'] },
                ].map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{shortcut.label}</span>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, j) => (
                        <kbd key={j} className="min-w-[24px] h-6 px-1.5 flex items-center justify-center text-xs font-sans font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-sm">
                          {key === '⌘' ? <Command className="w-3 h-3" /> : key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
                  Use Ctrl instead of ⌘ on Windows/Linux
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-full shadow-lg flex items-center gap-2"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
