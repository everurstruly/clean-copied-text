import { marked } from 'marked';

export async function cleanText(
  text: string,
  options: {
    removeHiddenChars: boolean;
    fixSpacing: boolean;
    fixFormatting: boolean;
    removeLinks: boolean;
    removeEmojis: boolean;
    humanize?: boolean;
    customRegex?: string;
    format: 'markdown' | 'html' | 'plain';
  }
): Promise<string> {
  // Simulate a tiny delay so the UI doesn't feel broken/too instantaneous
  await new Promise(resolve => setTimeout(resolve, 400));

  let result = text;

  if (options.customRegex && options.customRegex.trim() !== '') {
    try {
      const regex = new RegExp(options.customRegex, 'g');
      result = result.replace(regex, '');
    } catch (e) {
      console.error("Invalid custom regex:", e);
      // Ignore invalid regex and continue
    }
  }

  if (options.humanize) {
    // Remove common AI phrases
    const aiPhrases = [
      'In conclusion,?',
      'Ultimately,?',
      'Furthermore,?',
      'Moreover,?',
      'Additionally,?',
      'It is important to note that',
      'It is worth noting that',
      'As an AI language model,?',
      'It goes without saying',
      'Needless to say',
      'In summary,?',
      'To summarize,?',
      'In a nutshell,?',
      'All things considered,?'
    ];
    
    for (const phrase of aiPhrases) {
      const regex = new RegExp(`(^|\\.\\s+|\\n\\s*)${phrase}\\s*`, 'gi');
      result = result.replace(regex, '$1');
    }

    // Replace common AI hyphenated compound words with space-separated or unhyphenated versions
    const hyphenatedWords: Record<string, string> = {
      'ever-evolving': 'constantly changing',
      'fast-paced': 'fast paced',
      'cutting-edge': 'advanced',
      'state-of-the-art': 'modern',
      'thought-provoking': 'interesting',
      'game-changer': 'major shift',
      'game-changing': 'transformative',
      'paradigm-shifting': 'transformative',
      'deep-dive': 'detailed look',
      'must-have': 'essential'
    };

    for (const [hyphenated, replacement] of Object.entries(hyphenatedWords)) {
      const regex = new RegExp(`\\b${hyphenated}\\b`, 'gi');
      result = result.replace(regex, replacement);
    }

    // Replace common AI buzzwords
    const buzzwords: Record<string, string> = {
      'delve into': 'explore',
      'delving into': 'exploring',
      'a tapestry of': 'a mix of',
      'rich tapestry': 'complex mix',
      'testament to': 'proof of',
      'a myriad of': 'many',
      'in the realm of': 'in',
      'shed light on': 'explain',
      'foster': 'encourage',
      'navigating the complexities': 'handling the details',
      'in today\'s fast-paced world': 'today'
    };

    for (const [buzzword, replacement] of Object.entries(buzzwords)) {
      const regex = new RegExp(`\\b${buzzword}\\b`, 'gi');
      result = result.replace(regex, replacement);
    }
  }

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

  const protectedItems: string[] = [];
  if (!options.removeLinks && (options.fixSpacing || options.fixFormatting)) {
    // Temporarily mask URLs and Emails to protect them from spacing and formatting changes
    const urlRegex = /https?:\/\/[^\s]+/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    result = result.replace(urlRegex, (match) => {
      protectedItems.push(match);
      return `__PROTECTED_ITEM_${protectedItems.length - 1}__`;
    });
    
    result = result.replace(emailRegex, (match) => {
      protectedItems.push(match);
      return `__PROTECTED_ITEM_${protectedItems.length - 1}__`;
    });
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
    // Exclude period to avoid breaking URLs, emails, domains, and decimals.
    result = result.replace(/([,!?;\)])(?=[a-zA-Z])/g, '$1 ');
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

  // Restore protected items
  if (protectedItems.length > 0) {
    protectedItems.forEach((item, index) => {
      result = result.replace(`__PROTECTED_ITEM_${index}__`, item);
    });
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
