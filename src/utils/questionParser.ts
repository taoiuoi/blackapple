/**
 * Utility to parse roleplay unlock questions that contain embedded hints.
 * Separates the primary question from the hint so they can be rendered
 * as distinct, elegant visual cards in the UI without futuristic/monospace clutter.
 */
export interface ParsedQuestion {
  question: string;
  hint: string;
}

export function parseQuestionAndHint(rawText?: string): ParsedQuestion {
  if (!rawText || !rawText.trim()) {
    return {
      question: 'Vui lòng nhập mật khẩu Canon để mở khóa cổng tương tác của nhân vật:',
      hint: ''
    };
  }

  const text = rawText.trim();

  // Regex matches:
  // - (Gợi ý: ...)
  // - Gợi ý: ...
  // - (Gợi ý: ...
  const hintPattern = /(?:\(|\n|\r)?\s*gợi\s*ý\s*:\s*([^)]*)\)?/i;
  const match = text.match(hintPattern);

  if (match) {
    const hint = match[1].replace(/\)$/, '').trim();
    const question = text
      .replace(match[0], '')
      .replace(/[()\n\r]+/g, ' ')
      .trim();

    return {
      question: question || text,
      hint: hint
    };
  }

  return {
    question: text,
    hint: ''
  };
}
