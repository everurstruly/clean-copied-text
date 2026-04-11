# System Architecture

## Overview
AI Text Cleaner is a modern web application built on Next.js. It leverages client-side React for a highly responsive UI and server-side/API integrations for AI processing. The application is designed to be fast, accessible, and easily extensible.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion (`motion/react`)
- **Components**: `react-resizable-panels` for the split-pane layout
- **AI Integration**: `@google/genai` (Gemini API)
- **Utilities**: `diff` for text comparison

## Core Components
- **`app/page.tsx`**: The main application interface. It manages the state for input text, output text, cleaning options, and UI preferences (like view mode and count mode). It also handles keyboard shortcuts and responsive layout shifts.
- **`lib/cleaner.ts`**: The core logic for interfacing with the Gemini API. It takes the raw text and user-selected options, constructs a structured prompt, and returns the cleaned text.

## Data Flow
1. **User Input**: User pastes text into the left panel (`inputPanelRef`).
2. **Configuration**: User selects cleaning rules from the sidebar (e.g., "Remove Emojis", "Fix Spacing").
3. **Processing**: Upon triggering the clean action (via button or `Cmd+Enter`), the `handleClean` function is called.
4. **AI Inference**: The text and options are sent to `cleanText()`, which formats a prompt and calls the Gemini API.
5. **Output**: The cleaned text is returned and displayed in the right panel (`outputPanelRef`).
6. **Diff Calculation**: If the user switches to "Diff" view, the `diff` library calculates the differences asynchronously to prevent UI blocking on large text payloads.

## State Management
The application primarily relies on React's `useState` and `useEffect` hooks for state management. 
- **UI State**: Manages sidebar visibility, active tabs (Result vs. Diff), and theme (Dark/Light via `next-themes`).
- **Data State**: Manages the raw input text, the cleaned output text, and the history of applied options to detect "Unapplied Changes".
