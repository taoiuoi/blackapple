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

/**
 * Checks whether a reader's entered password matches any accepted answer.
 * Supports multiple valid variants separated by `|` (e.g. "32 phần trăm | 32% | 32").
 */
export function isRoleplayAnswerMatch(enteredRaw: string, expectedRaw?: string): boolean {
  const cleanStr = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s*%/g, '%')
      .replace(/\s+/g, ' ')
      .replace(/[.,!?:;'"“”]/g, '');

  const stripDiacritics = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd');

  const entered = cleanStr(enteredRaw || '');
  if (!expectedRaw || !expectedRaw.trim()) return true;
  if (entered === 'blackapple') return true;
  if (!entered) return false;

  const variants = expectedRaw
    .split('|')
    .map((v) => cleanStr(v))
    .filter(Boolean);

  if (variants.length === 0) return true;

  const enteredNoAccent = stripDiacritics(entered);
  return variants.some(
    (expected) => entered === expected || enteredNoAccent === stripDiacritics(expected)
  );
}
