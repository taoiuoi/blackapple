import { Character } from '../types';

/**
 * Converts Vietnamese text to an ASCII URL-safe slug (no diacritics, lowercase, hyphenated).
 * Example: "Phan Quý Mẫn" -> "phan-quy-man"
 * Example: "Ngụy Tứ Việt" -> "nguy-tu-viet"
 * Example: "Đường Tử Vi" -> "duong-tu-vi"
 */
export function slugifyVietnamese(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip diacritic marks
    .replace(/[^a-z0-9\s-]/g, '') // Keep letters, numbers, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}

/**
 * Generates a unique URL slug for a character based on their name.
 * If another character already uses the slug, appends '-2', '-3', etc.
 */
export function generateCharacterSlug(
  name: string,
  existingCharacters: Character[] = [],
  currentId?: string
): string {
  const baseSlug = slugifyVietnamese(name);
  if (!baseSlug) {
    return currentId && !currentId.startsWith('char-')
      ? currentId
      : `nhan-vat-${Date.now()}`;
  }

  // Check if baseSlug is already taken by a different character
  let slug = baseSlug;
  let counter = 2;

  const isTaken = (testSlug: string) =>
    existingCharacters.some((c) => {
      if (currentId && c.id === currentId) return false;
      const cSlug = c.slug || (c.id && !c.id.startsWith('char-') ? c.id : slugifyVietnamese(c.name));
      return cSlug === testSlug || c.id === testSlug;
    });

  while (isTaken(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Resolves the primary URL identifier for a character:
 * Prefers explicit slug > slugified name > clean character ID > fallback ID.
 */
export function getCharacterSlug(char: Partial<Character> | null | undefined): string {
  if (!char) return '';
  if (char.slug && char.slug.trim()) return char.slug.trim();

  // If character has a name, generate slug from name
  const nameSlug = slugifyVietnamese(char.name || '');
  if (nameSlug) return nameSlug;

  // If character ID is already a slug (not generic timestamp 'char-...')
  if (char.id && !char.id.startsWith('char-')) return char.id;

  // Fallback to code or id
  if (char.code) return slugifyVietnamese(char.code);
  return char.id || '';
}

/**
 * Returns the full web application path for viewing a character profile.
 * Example: "/character/phan-quy-man"
 */
export function getCharacterPath(char: Partial<Character> | null | undefined): string {
  const slug = getCharacterSlug(char);
  return slug ? `/character/${slug}` : '/characters';
}

/**
 * Robust matching function: resolves whether a URL param matches a given Character.
 * Supports:
 *  - Direct doc ID (e.g. 'nguy-tu-viet' or legacy 'char-1793882572040')
 *  - Explicit slug
 *  - Slugified character name (e.g. 'phan-quy-man')
 *  - Character code (e.g. 'BA-01')
 *  - Exact character name (e.g. 'Phan Quý Mẫn' or decoded URI)
 */
export function matchesCharacter(char: Character, identifier: string): boolean {
  if (!identifier || !char) return false;
  let decoded = identifier.trim().toLowerCase();
  try {
    decoded = decodeURIComponent(identifier).trim().toLowerCase();
  } catch (_) {}

  if (decoded.endsWith('/')) {
    decoded = decoded.slice(0, -1);
  }

  const slugifiedParam = slugifyVietnamese(decoded);

  // 1. Direct ID match
  if (char.id && char.id.toLowerCase() === decoded) return true;

  // 2. Explicit slug match
  if (char.slug && char.slug.toLowerCase() === decoded) return true;

  // 3. Name slug match
  const nameSlug = slugifyVietnamese(char.name || '');
  if (nameSlug) {
    if (nameSlug === decoded || nameSlug === slugifiedParam) return true;
  }

  // 4. Code match (e.g. 'BA-01' or 'ba-01')
  if (char.code && char.code.toLowerCase() === decoded) return true;

  // 5. Name match (exact or without accents)
  if (char.name && char.name.toLowerCase() === decoded) return true;
  if (char.name && slugifyVietnamese(char.name) === slugifiedParam) return true;

  return false;
}
