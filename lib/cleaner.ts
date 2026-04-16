import { marked } from 'marked';

type CleanOptions = {
  removeLinks?: boolean;
  fixSpacing?: boolean;
  removeHiddenChars?: boolean;
};

export async function cleanText(
  input: string,
  options: CleanOptions = {}
): Promise<string> {
  if (!input) return '';

  const {
    removeLinks = false,
    fixSpacing = true,
    removeHiddenChars = true,
  } = options;

  // 1. Normalize line endings
  let text = input.replace(/\r\n/g, '\n');

  // 2. Extract code blocks (```...```)
  const codeBlocks: string[] = [];
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 3. Extract inline code (`...`)
  const inlineCodes: string[] = [];
  text = text.replace(/`[^`\n]+`/g, (match) => {
    inlineCodes.push(match);
    return `__INLINE_CODE_${inlineCodes.length - 1}__`;
  });

  // 4. Process line-by-line
  const lines = text.split('\n').map((line) => {
    const isTable = /^\s*\|.*\|\s*$/.test(line);

    // Always remove hidden chars
    if (removeHiddenChars) {
      line = line.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
    }

    if (isTable) {
      // DO NOT TOUCH TABLE STRUCTURE
      return line.replace(/[ \t]+$/, '');
    }

    // Safe spacing rules
    if (fixSpacing) {
      line = line
        .replace(/ {2,}/g, ' ')                // collapse spaces
        .replace(/[ \t]+([.,!?;:])/g, '$1')    // no space before punctuation
        .replace(/([,!?;:])(?=[a-zA-Z])/g, '$1 ') // ensure space after punctuation
        .replace(/[ \t]+$/, '');               // trim end only
    }

    return line;
  });

  let result = lines.join('\n');

  // --- Optional link removal ---
  if (removeLinks) {
    result = result
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
      .replace(/https?:\/\/[^\s]+/g, '');      // raw URLs
  }

  // 5. Limit excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  // 6. Restore inline code
  inlineCodes.forEach((code, i) => {
    result = result.replace(new RegExp(`__INLINE_CODE_${i}__`, 'g'), code);
  });

  // 7. Restore code blocks
  codeBlocks.forEach((block, i) => {
    result = result.replace(new RegExp(`__CODE_BLOCK_${i}__`, 'g'), block);
  });

  return result.trim();
}
