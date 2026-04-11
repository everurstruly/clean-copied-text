import { marked } from 'marked';

export async function cleanText(
  text: string,
  options: {
    removeHiddenChars: boolean;
    fixSpacing: boolean;
    fixFormatting: boolean;
    removeLinks: boolean;
    removeEmojis: boolean;
    format: 'markdown' | 'html' | 'plain';
  }
): Promise<string> {
  // Simulate a tiny delay so the UI doesn't feel broken/too instantaneous
  await new Promise(resolve => setTimeout(resolve, 400));

  let result = text;

  if (options.removeHiddenChars) {
    // Remove zero-width spaces, BOM, and other non-printable characters
    // \u200B-\u200D: Zero width spaces
    // \uFEFF: Byte Order Mark
    // \u200E-\u200F: Left-to-right / Right-to-left marks
    // \u0000-\u001F\u007F-\u009F: Control characters (excluding newlines/tabs)
    result = result.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '');
    result = result.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  }

  if (options.removeLinks) {
    // Remove URLs
    result = result.replace(/https?:\/\/[^\s]+/g, '');
    // Remove Emails
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  }

  if (options.removeEmojis) {
    // Remove emojis using the Extended_Pictographic property
    result = result.replace(/\p{Extended_Pictographic}/gu, '');
  }

  if (options.fixSpacing) {
    // Replace multiple spaces with a single space
    result = result.replace(/ {2,}/g, ' ');
    // Fix spaces before punctuation (e.g., "word ," -> "word,") - only match spaces/tabs, not newlines
    result = result.replace(/[ \t]+([.,!?;\)])/g, '$1');
    // Ensure space after punctuation (e.g., "word,word" -> "word, word")
    result = result.replace(/([.,!?;\)])(?=[a-zA-Z])/g, '$1 ');
    // Remove trailing/leading whitespace per line
    result = result.split('\n').map(line => line.trim()).join('\n');
    // Replace 3+ newlines with 2 newlines (max one empty line)
    result = result.replace(/\n{3,}/g, '\n\n');
  }

  if (options.fixFormatting) {
    // Capitalize first letter of sentences
    result = result.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    // Standardize bullet points (e.g., replace * or + with - at the start of lines)
    result = result.replace(/^[\*\+]\s+/gm, '- ');
  }

  // Format output
  if (options.format === 'html') {
    // Convert markdown to proper HTML using marked
    result = await marked.parse(result, { async: true, breaks: true });
  } else if (options.format === 'plain') {
    // Strip any markdown-like syntax if plain text is requested
    result = result.replace(/[*_~`#]/g, '');
  }

  return result.trim();
}
