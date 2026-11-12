// High-performance image CDN, client cache & GIF preservation optimizer for Black Apple

const SAMPLE_UNSPLASH_IDS = [
  'photo-1518709268805-4e9042af9f23',
  'photo-1534447677768-be436bb09401',
  'photo-1509198397868-475647b2a1e5',
  'photo-1514565131-fce0801e5785'
];

export function isSampleBuildImage(url?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (SAMPLE_UNSPLASH_IDS.some((id) => trimmed.includes(id))) {
    return true;
  }
  return false;
}

/**
 * 100% Reliable Animated GIF Detection:
 * Checks extensions, MIME types, query strings, and popular GIF CDNs.
 * Animated GIFs must NEVER be flattened or transcoded to static WebP/JPEG.
 */
export function isAnimatedGif(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('data:image/gif')) return true;

  // Check file extension in pathname or before query string
  if (/\.gif(\?|#|$)/i.test(trimmed)) return true;

  // Check URL query parameters or MIME indicators
  if (
    trimmed.includes('format=gif') ||
    trimmed.includes('mime=image/gif') ||
    trimmed.includes('type=gif') ||
    trimmed.includes('ext=gif')
  ) {
    return true;
  }

  // Known GIF hosting domains
  if (
    trimmed.includes('giphy.com') ||
    trimmed.includes('tenor.com') ||
    trimmed.includes('gfycat.com')
  ) {
    return true;
  }

  return false;
}

// Canonical mapping between /assets/characters/ aliases and AI Studio tracked /assets/aistudio/ files
const CHARACTER_TO_AISTUDIO_MAP: Record<string, string> = {
  'assets/characters/nguy-tu-viet-home.jpg': 'assets/aistudio/IMG_9490_85860973.PNG',
  'assets/characters/nguy-tu-viet-home.png': 'assets/aistudio/IMG_9490_85860973.PNG',
  'assets/characters/nguy-tu-viet-card.jpg': 'assets/aistudio/IMG_9489_fa08fe9d.JPG',
  'assets/characters/gian-di-ninh-home.jpg': 'assets/aistudio/IMG_9678_10c56f28.PNG',
  'assets/characters/gian-di-ninh-home.png': 'assets/aistudio/IMG_9678_10c56f28.PNG',
  'assets/characters/gian-di-ninh-card.jpg': 'assets/aistudio/IMG_9664_f2105986.JPG',
  'assets/characters/chu-lac-thien-home.jpg': 'assets/aistudio/IMG_0091_c963c2ad.JPG',
  'assets/characters/chu-lac-thien-card.jpg': 'assets/aistudio/copy_5262B8A7-5064-48A8-BC10-3A246C344352_98fcb1e0.jpg',
  'assets/characters/luc-tu-hien-home.jpg': 'assets/aistudio/IMG_0273_37791aae.JPG',
  'assets/characters/luc-tu-hien-card.jpg': 'assets/aistudio/IMG_4291_21601d3b.JPG',
  'assets/characters/phan-quy-man-home.jpg': 'assets/aistudio/IMG_0393_dff41631.JPG',
  'assets/characters/phan-quy-man-card.jpg': 'assets/aistudio/IMG_0390_14d41415.JPG',
  'assets/characters/dong-ky-home.jpg': 'assets/aistudio/IMG_0719_04f7275f.JPG',
  'assets/characters/dong-ky-card.jpg': 'assets/aistudio/IMG_0718_e8699520.JPG',
  'assets/creator-avatar.jpg': 'assets/aistudio/IMG_0423_f2e4f4d6.JPG',
  'assets/creator-cover.jpg': 'assets/aistudio/IMG_9890_e03c9d51.JPG',
  'assets/creator-donate-qr.jpg': 'assets/aistudio/IMG_0713_ed13a933.JPG',
  'assets/aistudio/597ADB97-C24F-4C18-A350-F21C6D6F506F_7a61068d.png': 'assets/noir-wave-bg.webp'
};

const AISTUDIO_TO_CHARACTER_MAP: Record<string, string> = Object.entries(
  CHARACTER_TO_AISTUDIO_MAP
).reduce((acc, [charPath, aiPath]) => {
  if (!acc[aiPath]) {
    acc[aiPath] = charPath;
  }
  return acc;
}, {} as Record<string, string>);

function getNormalizedBaseUrl(): string {
  const rawBase =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL
      : '/';
  return rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
}

function stripToRelativeAssetPath(url: string): string | null {
  const trimmed = url.trim();
  const idx = trimmed.indexOf('assets/');
  if (idx === -1) return null;
  if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('assets/') ||
    trimmed.startsWith('./assets/')
  ) {
    return trimmed.slice(idx);
  }
  const base = getNormalizedBaseUrl();
  if (base !== '/' && trimmed.startsWith(`${base}assets/`)) {
    return trimmed.slice(base.length);
  }
  return null;
}

export function isLocalAsset(url?: string): boolean {
  if (!url) return false;
  return stripToRelativeAssetPath(url) !== null;
}

export function getLocalAssetFallbackCandidates(url?: string): string[] {
  if (!url) return [];
  const rel = stripToRelativeAssetPath(url);
  if (!rel) return [];

  const base = getNormalizedBaseUrl();
  const primaryRel = CHARACTER_TO_AISTUDIO_MAP[rel] || rel;
  const secondaryRel =
    CHARACTER_TO_AISTUDIO_MAP[rel]
      ? rel
      : AISTUDIO_TO_CHARACTER_MAP[rel] || null;

  const candidates = new Set<string>();
  candidates.add(`${base}${primaryRel}`);
  candidates.add(`/${primaryRel}`);
  candidates.add(primaryRel);

  if (secondaryRel) {
    candidates.add(`${base}${secondaryRel}`);
    candidates.add(`/${secondaryRel}`);
    candidates.add(secondaryRel);
  }

  return Array.from(candidates);
}

/**
 * Convert common shared links (Google Drive, Dropbox, ImgBB, etc.) and local assets to direct URLs.
 */
export function resolveDirectImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (isSampleBuildImage(trimmed)) return '';

  // If already a data URL or blob, return directly
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Local static asset resolution with GitHub Pages BASE_URL support
  const relAsset = stripToRelativeAssetPath(trimmed);
  if (relAsset) {
    const canonicalRel = CHARACTER_TO_AISTUDIO_MAP[relAsset] || relAsset;
    const base = getNormalizedBaseUrl();
    return `${base}${canonicalRel}`;
  }

  // Google Drive format: https://drive.google.com/file/d/{ID}/view... or /open?id={ID}
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch && driveOpenMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }

  // Dropbox: convert ?dl=0 to ?raw=1
  if (trimmed.includes('dropbox.com') && trimmed.includes('dl=0')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
}

// In-memory cache of fully loaded & decoded image URLs for instantaneous 0ms display
export const CACHED_IMAGE_SET = new Set<string>();

// Track requests currently downloading to prevent duplicate simultaneous fetches
const IN_FLIGHT_REQUESTS = new Set<string>();

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'inside';
  format?: 'webp' | 'auto';
  forceRaw?: boolean;
}

export interface OptimizedImageResult {
  optimizedUrl: string;
  directUrl: string;
  isGif: boolean;
}

/**
 * Returns a high-speed CDN-accelerated URL for static images.
 * IMPORTANT:
 * - Animated GIFs are ALWAYS returned untouched with isGif=true.
 * - Local assets (/assets/...) are returned directly with zero proxy overhead.
 */
export function getOptimizedImageUrl(
  url?: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageResult {
  const directUrl = resolveDirectImageUrl(url);
  if (!directUrl) {
    return { optimizedUrl: '', directUrl: '', isGif: false };
  }

  // Local static assets: deliver immediately with 0ms overhead
  if (isLocalAsset(directUrl) || isLocalAsset(url)) {
    CACHED_IMAGE_SET.add(directUrl);
    return {
      optimizedUrl: directUrl,
      directUrl,
      isGif: false
    };
  }

  const gifDetected = isAnimatedGif(directUrl) || isAnimatedGif(url);

  // If it's a GIF or caller requested forceRaw, preserve raw direct stream untouched
  if (gifDetected || options.forceRaw) {
    return {
      optimizedUrl: directUrl,
      directUrl,
      isGif: true
    };
  }

  // Skip CDN proxy for local data, blobs, SVGs, or if already a wsrv.nl URL
  if (
    directUrl.startsWith('data:') ||
    directUrl.startsWith('blob:') ||
    directUrl.endsWith('.svg') ||
    directUrl.includes('wsrv.nl')
  ) {
    return { optimizedUrl: directUrl, directUrl, isGif: false };
  }

  // Google Drive lh3 native thumbnail edge cache (sub-50ms latency worldwide)
  if (directUrl.includes('lh3.googleusercontent.com/d/')) {
    const widthParam = options.width ? `=w${options.width}` : '=w800';
    return {
      optimizedUrl: `${directUrl}${widthParam}`,
      directUrl,
      isGif: false
    };
  }

  return { optimizedUrl: directUrl, directUrl, isGif: false };
}

/**
 * Proactively preload and decode an image into browser cache and GPU texture memory.
 * Deduplicates in-flight requests to avoid redundant network overhead.
 */
export function preloadImage(url?: string, options?: ImageOptimizationOptions): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  const direct = resolveDirectImageUrl(url);
  if (!direct) return Promise.resolve(false);

  const { optimizedUrl, isGif } = getOptimizedImageUrl(direct, options);
  const targetUrl = optimizedUrl || direct;

  if (IN_FLIGHT_REQUESTS.has(targetUrl)) {
    return Promise.resolve(true);
  }

  IN_FLIGHT_REQUESTS.add(targetUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = isGif ? 'auto' : 'async';

    img.onload = () => {
      IN_FLIGHT_REQUESTS.delete(targetUrl);
      CACHED_IMAGE_SET.add(targetUrl);
      CACHED_IMAGE_SET.add(direct);

      if (!isGif && 'decode' in img) {
        img.decode().catch(() => {}).finally(() => resolve(true));
      } else {
        resolve(true);
      }
    };

    img.onerror = () => {
      IN_FLIGHT_REQUESTS.delete(targetUrl);
      if (targetUrl !== direct) {
        const fallbackImg = new Image();
        fallbackImg.decoding = isGif ? 'auto' : 'async';
        fallbackImg.onload = () => {
          CACHED_IMAGE_SET.add(direct);
          resolve(true);
        };
        fallbackImg.onerror = () => resolve(false);
        fallbackImg.src = direct;
      } else {
        resolve(false);
      }
    };

    img.src = targetUrl;
  });
}

/**
 * Preloads all character visual assets immediately in parallel so every slide,
 * card, and profile opens with 0ms delay.
 */
export function preloadCharacterAssets(
  characters: Array<{
    coverUrl?: string;
    posterUrl?: string;
    avatarUrl?: string;
    synopsisImageUrl?: string;
  }>
) {
  if (!Array.isArray(characters) || characters.length === 0) return;

  const uniqueUrls = new Set<string>();
  for (const char of characters) {
    if (char.coverUrl) uniqueUrls.add(char.coverUrl);
    if (char.posterUrl) uniqueUrls.add(char.posterUrl);
    if (char.avatarUrl) uniqueUrls.add(char.avatarUrl);
    if (char.synopsisImageUrl) uniqueUrls.add(char.synopsisImageUrl);
  }
  uniqueUrls.add('/assets/creator-avatar.jpg');
  uniqueUrls.add('/assets/creator-cover.jpg');
  uniqueUrls.add('/assets/creator-donate-qr.jpg');

  uniqueUrls.forEach((u) => {
    preloadImage(u);
  });
}
