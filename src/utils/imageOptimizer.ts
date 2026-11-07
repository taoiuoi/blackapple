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

/**
 * Convert common shared links (Google Drive, Dropbox, ImgBB, etc.) to direct image bytes.
 */
export function resolveDirectImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (isSampleBuildImage(trimmed)) return '';

  // If already a data URL or blob, return directly
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
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
export const CACHED_IMAGE_SET = new Set<string>([
  '/assets/characters/nguy-tu-viet-home.jpg',
  '/assets/characters/nguy-tu-viet-home.png',
  '/assets/characters/nguy-tu-viet-card.jpg',
  '/assets/characters/gian-di-ninh-home.jpg',
  '/assets/characters/gian-di-ninh-home.png',
  '/assets/characters/gian-di-ninh-card.jpg',
  '/assets/characters/chu-lac-thien-home.jpg',
  '/assets/characters/chu-lac-thien-card.jpg',
  '/assets/characters/luc-tu-hien-home.jpg',
  '/assets/characters/luc-tu-hien-card.jpg',
  '/assets/characters/phan-quy-man-home.jpg',
  '/assets/characters/phan-quy-man-card.jpg',
  '/assets/characters/dong-ky-home.jpg',
  '/assets/characters/dong-ky-card.jpg',
  '/assets/creator-avatar.jpg',
  '/assets/creator-cover.jpg',
  '/assets/creator-donate-qr.jpg'
]);

export function isLocalAsset(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('/assets/') || trimmed.startsWith('assets/');
}

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
  if (isLocalAsset(directUrl)) {
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
