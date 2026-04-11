# Local Development Guide

This guide explains how to set up the Text Cleaner project on your local machine for development.

## Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-text-cleaner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   Navigate to `http://localhost:3000` in your browser.

## Project Structure
- `/app`: Next.js App Router pages and layouts.
  - `page.tsx`: The main application UI.
  - `layout.tsx`: Root layout and theme providers.
  - `globals.css`: Global styles and Tailwind imports.
- `/components`: Reusable UI components (if extracted).
- `/lib`: Utility functions and core logic.
  - `cleaner.ts`: Text processing and formatting engine.
- `/docs`: Project documentation and guides.

## Build for Production
To create an optimized production build:
```bash
npm run build
npm start
```
