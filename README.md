# Clean Copy

Clean Copy is a web-based tool for sanitizing, formatting, and standardizing messy text.

It provides a precise, elegant interface to strip hidden characters, fix formatting artifacts, and transform rough text into structured formats ready for reuse. This makes it easier to clean up AI-generated messages, messy copy-pastes, and broken documents in seconds.

Everything runs locally on your machine. No server. No login. No data leaves your browser.

## Overview

Copying responses from AI platforms often carries over unwanted formatting—like background colors, inline styles, and rigid spacing rules—making the text frustrating to paste and use elsewhere. Furthermore, it's often difficult to retain the *correct* structural formatting (like bolding, lists, and headers) when moving these responses into rich-text editors like Google Docs or email clients.

Clean Copy was built to solve this exact problem. It acts as a bridge between platforms, stripping away the unwanted styling baggage while preserving the core structure. By allowing you to seamlessly convert and export your text into Markdown, HTML, or Plain Text, Clean Copy ensures your content retains its integrity and works perfectly across any tool or environment.

## What it does

- **Deep Cleaning:** Strip away zero-width spaces, BOMs, and invisible formatting artifacts that break your code and documents.
- **Smart Formatting:** Fix double spaces, correct punctuation, and standardize capitalization and bullet points.
- **Content Filtering:** Easily remove links, emails, emojis, or apply custom Regex patterns to strip specific content.
- **Universal Export:** Transform your cleaned text into perfectly formatted Markdown, HTML, Plain Text, or JSON with a single click.
- **Visual Diffing:** Compare your original and cleaned text side-by-side to see exactly what changed.

## Scope

This repository contains the codebase for the Clean Copy web application, including the Next.js interface, Tailwind CSS styling, and the client-side logic used to process, analyze, and operate on text directly within the browser.
