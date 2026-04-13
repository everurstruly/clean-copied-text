'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Sparkles, Copy, Check, X, FileText, Code, AlignLeft, Moon, Sun, RefreshCw, GripVertical, GripHorizontal, ChevronsUpDown, Download, Keyboard, Command, ClipboardPaste, Undo2, Redo2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cleanText } from '@/lib/cleaner';
import { diffWordsWithSpace, Change } from 'diff';
import { Panel, Group, Separator, PanelImperativeHandle } from 'react-resizable-panels';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

export default function Page() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasteError, setPasteError] = useState(false);
  
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
    }
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    setFuture(prev => [inputText, ...prev]);
    setPast(newPast);
    setInputText(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, inputText]);
    setFuture(newFuture);
    setInputText(next);
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
  
  const inputPanelRef = useRef<PanelImperativeHandle>(null);
  const outputPanelRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [options, setOptions] = useState({
    removeHiddenChars: true,
    fixSpacing: true,
    fixFormatting: true,
    removeLinks: false,
    removeEmojis: false,
    customRegex: '',
    format: 'markdown' as 'markdown' | 'html' | 'plain',
  });

  const statuses = [
    "Analyzing text structure...",
    "Removing hidden characters...",
    "Fixing spacing and punctuation...",
    "Standardizing formatting...",
    "Generating final output..."
  ];

  const handleClean = async () => {
    if (!inputText.trim()) return;
    setIsCleaning(true);
    
    setLastCleanedOptions(options);
    setLastCleanedInput(inputText);

    try {
      const result = await cleanText(inputText, options);
      setOutputText(result);
    } catch (error) {
      console.error(error);
      alert('Failed to clean text. Please try again.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (options.format === 'html') {
        const blobHtml = new Blob([outputText], { type: 'text/html' });
        // Create a temporary element to extract plain text from HTML
        const tempEl = document.createElement('div');
        tempEl.innerHTML = outputText;
        const plainTextFallback = tempEl.innerText || tempEl.textContent || '';
        
        const blobText = new Blob([plainTextFallback], { type: 'text/plain' });
        const data = [new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        })];
        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(outputText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
      // Fallback to plain text
      try {
        await navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy plain text fallback: ', fallbackErr);
        alert('Failed to copy to clipboard. Your browser might be blocking it.');
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleInputTextChange(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      setPasteError(true);
      setTimeout(() => setPasteError(false), 3000);
    }
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        if (!isDesktop) {
          setIsSidebarOpen(prev => !prev);
        }
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
      const formatNames = { markdown: 'Markdown', html: 'Rich Text', plain: 'Plain Text' };
      changes.push(`Output format changed to ${formatNames[options.format]}`);
    }
    if (options.removeHiddenChars !== lastCleanedOptions.removeHiddenChars) {
      changes.push(`Hidden Characters removal ${options.removeHiddenChars ? 'enabled' : 'disabled'}`);
    }
    if (options.fixSpacing !== lastCleanedOptions.fixSpacing) {
      changes.push(`Fix Spacing ${options.fixSpacing ? 'enabled' : 'disabled'}`);
    }
    if (options.fixFormatting !== lastCleanedOptions.fixFormatting) {
      changes.push(`Standardize Formatting ${options.fixFormatting ? 'enabled' : 'disabled'}`);
    }
    if (options.removeLinks !== lastCleanedOptions.removeLinks) {
      changes.push(`Remove Links/Emails ${options.removeLinks ? 'enabled' : 'disabled'}`);
    }
    if (options.removeEmojis !== lastCleanedOptions.removeEmojis) {
      changes.push(`Remove Emojis ${options.removeEmojis ? 'enabled' : 'disabled'}`);
    }
    if (options.customRegex !== lastCleanedOptions.customRegex) {
      changes.push(`Custom Regex changed`);
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header inside Sidebar */}
      <div className="hidden lg:flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Text Cleaner</h1>
        </div>
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Output Format Section */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Output Format</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'markdown', label: 'MD', icon: Code },
              { id: 'html', label: 'HTML', icon: FileText },
              { id: 'plain', label: 'TXT', icon: AlignLeft },
            ].map((fmt) => (
              <label key={fmt.id} className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all ${options.format === fmt.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 bg-transparent'}`}>
                <input type="radio" name="format" value={fmt.id} checked={options.format === fmt.id} onChange={(e) => setOptions({...options, format: e.target.value as any})} className="sr-only" />
                <fmt.icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{fmt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cleaning Rules Section */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Cleaning Rules</h3>
          <div className="space-y-1">
            {[
              { id: 'removeHiddenChars', label: 'Hidden Characters', desc: 'Remove zero-width spaces, BOM' },
              { id: 'fixSpacing', label: 'Fix Spacing', desc: 'Remove double spaces, fix punctuation' },
              { id: 'fixFormatting', label: 'Standardize Formatting', desc: 'Fix capitalization, bullet points' },
              { id: 'removeLinks', label: 'Remove Links/Emails', desc: 'Strip URLs and email addresses' },
              { id: 'removeEmojis', label: 'Remove Emojis', desc: 'Strip all emojis from the text' },
            ].map((rule) => (
              <label key={rule.id} className="flex items-start justify-between py-2.5 cursor-pointer group">
                <div className="pr-4">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{rule.label}</span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-0.5 leading-tight">{rule.desc}</p>
                </div>
                <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full mt-0.5">
                  <input 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={options[rule.id as keyof typeof options] as boolean} 
                    onChange={e => setOptions({...options, [rule.id]: e.target.checked})} 
                  />
                  <div className="h-5 w-9 rounded-full bg-neutral-200 dark:bg-neutral-700 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-200 ease-in-out"></div>
                  <div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Regex Section */}
        <div className="p-5">
          <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Custom Regex</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="e.g. \d+ to remove numbers"
              value={options.customRegex}
              onChange={(e) => setOptions({ ...options, customRegex: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono shadow-sm"
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Matches will be removed from the text.</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <button 
          onClick={() => setShowShortcuts(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
          Keyboard Shortcuts
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a] flex flex-col lg:flex-row font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-neutral-50 dark:bg-[#0a0a0a] border-r border-neutral-200 dark:border-neutral-800 h-full shrink-0 transition-colors duration-200 z-10">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-neutral-50 dark:bg-[#0a0a0a] shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 min-h-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-[#111111] border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Text Cleaner</h1>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 relative min-h-0">
          <Group key={isDesktop ? 'desktop' : 'mobile'} orientation={isDesktop ? 'horizontal' : 'vertical'} className="flex-1 w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-[#111111] min-h-0">
            
            {/* Input Area */}
            <Panel panelRef={inputPanelRef} defaultSize={50} minSize={20} className="relative bg-white dark:bg-[#111111] transition-colors duration-200" style={{ overflow: 'hidden' }}>
              <div className="absolute inset-0 flex flex-col">
                <div className="bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Original Text</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={handlePaste}
                      className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 px-2 py-1 rounded-md shadow-sm"
                      title="Paste from clipboard"
                    >
                      {pasteError ? <X className="w-3.5 h-3.5 text-red-500" /> : <ClipboardPaste className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{pasteError ? 'Use Ctrl+V' : 'Paste'}</span>
                    </button>
                    <button
                      onClick={handleUndo}
                      disabled={past.length === 0}
                      className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Undo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={future.length === 0}
                      className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Redo"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button onClick={() => setCountMode(m => m === 'chars' ? 'words' : 'chars')} className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                  <span>{getCount(inputText)}</span>
                  <ChevronsUpDown className="w-3 h-3" />
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => handleInputTextChange(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Paste your messy text here..."
                className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-neutral-700 dark:text-neutral-200 leading-relaxed bg-transparent min-h-0"
              />
              </div>
            </Panel>

            <Separator className="w-full h-4 lg:w-4 lg:h-full bg-neutral-200/80 dark:bg-neutral-800/80 border-y lg:border-y-0 lg:border-x border-neutral-300 dark:border-neutral-700 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center cursor-row-resize lg:cursor-col-resize z-10">
              <div className="flex lg:flex-col gap-1 text-neutral-400 dark:text-neutral-500">
                {isDesktop ? <GripVertical className="w-3 h-3" /> : <GripHorizontal className="w-3 h-3" />}
              </div>
            </Separator>

            {/* Output Area */}
            <Panel panelRef={outputPanelRef} defaultSize={50} minSize={20} className="relative bg-white dark:bg-[#111111] transition-colors duration-200" style={{ overflow: 'hidden' }}>
              <div className="absolute inset-0 flex flex-col">
                <div className="bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 shrink-0">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Cleaned Result</span>
                  
                  {outputText && (
                    <div className="flex bg-neutral-200/50 dark:bg-neutral-800 rounded-md p-0.5 ml-2">
                      <button
                        onClick={() => setViewMode('result')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'result' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                        Result
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'preview' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => setViewMode('diff')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'diff' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                        Diff
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="sm:hidden p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm ml-auto"
                    aria-label="Settings"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="flex items-center gap-3">
                    {outputText && (
                      <button onClick={() => setCountMode(m => m === 'chars' ? 'words' : 'chars')} className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <span>{getCount(outputText)}</span>
                        <ChevronsUpDown className="w-3 h-3" />
                      </button>
                    )}
                    {outputText && (
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 px-2.5 py-1.5 rounded-md shadow-sm"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    )}
                    {outputText && (
                      <button 
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 px-2.5 py-1.5 rounded-md shadow-sm"
                        title="Download as .txt"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="hidden sm:flex lg:hidden p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm"
                      aria-label="Settings"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
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
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Format: {options.format}</span>
                              {options.removeHiddenChars && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Remove Hidden Chars</span>}
                              {options.fixSpacing && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Fix Spacing</span>}
                              {options.fixFormatting && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Fix Formatting</span>}
                              {options.removeLinks && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Remove Links</span>}
                              {options.removeEmojis && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Remove Emojis</span>}
                              {options.customRegex && <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Custom Regex</span>}
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
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {options.format === 'html' ? (
                        <div dangerouslySetInnerHTML={{ __html: outputText || 'Cleaned text will appear here...' }} />
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
    </div>
  );
}
