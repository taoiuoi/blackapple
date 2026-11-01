import { useState, useEffect, useRef } from 'react';
import {
  isSampleBuildImage,
  resolveDirectImageUrl,
  getOptimizedImageUrl,
  CACHED_IMAGE_SET,
  preloadImage,
  isAnimatedGif
} from '../../utils/imageOptimizer';

export { isSampleBuildImage, resolveDirectImageUrl, preloadImage, isAnimatedGif };

export interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  objectPosition?: string;
  priority?: boolean;
  aspectRatio?: string;
  targetWidth?: number;
  isGif?: boolean;
  onUploadClick?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  objectPosition = 'center',
  priority = false,
  aspectRatio,
  targetWidth = 1200,
  isGif: forcedIsGif,
  onUploadClick
}: ImageWithFallbackProps) {
  const { optimizedUrl, directUrl, isGif: detectedIsGif } = getOptimizedImageUrl(src, {
    width: targetWidth,
    forceRaw: forcedIsGif
  });

  const isGif = Boolean(forcedIsGif || detectedIsGif || isAnimatedGif(src));

  const [currentUrl, setCurrentUrl] = useState<string>(optimizedUrl || directUrl);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Instant check: If the URL is already decoded in memory or browser cache, instant 0ms display
  const isPrecached =
    Boolean(currentUrl) &&
    (CACHED_IMAGE_SET.has(currentUrl) || CACHED_IMAGE_SET.has(directUrl));

  const [isLoading, setIsLoading] = useState(!isPrecached);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Sync state whenever src or width changes
  useEffect(() => {
    const next = getOptimizedImageUrl(src, { width: targetWidth, forceRaw: forcedIsGif });
    const target = next.optimizedUrl || next.directUrl;

    setHasError(false);
    setHasTriedFallback(false);
    setCurrentUrl(target);

    const alreadyCached =
      Boolean(target) &&
      (CACHED_IMAGE_SET.has(target) || CACHED_IMAGE_SET.has(next.directUrl));

    if (alreadyCached) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [src, targetWidth, forcedIsGif]);

  // Check if browser has already loaded & decoded image from previous cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoading(false);
      if (currentUrl) {
        CACHED_IMAGE_SET.add(currentUrl);
      }
      if (directUrl) {
        CACHED_IMAGE_SET.add(directUrl);
      }
    }
  }, [currentUrl, directUrl]);

  const isValid =
    Boolean(currentUrl) &&
    (currentUrl.startsWith('http://') ||
      currentUrl.startsWith('https://') ||
      currentUrl.startsWith('/') ||
      currentUrl.startsWith('data:image/') ||
      currentUrl.startsWith('blob:'));

  // Fallback UI when image URL is empty or failed loading
  if (!isValid || hasError) {
    return (
      <div
        className={`bg-gradient-to-b from-[#141419] to-[#0a0a0d] border border-white/[0.08] flex flex-col items-center justify-center text-center p-4 select-none relative group ${className}`}
        style={{ aspectRatio }}
      >
        <div className="w-10 h-10 rounded-full border border-white/[0.12] flex items-center justify-center mb-2.5 bg-white/[0.03]">
          <span className="font-serif text-xs italic text-neutral-300">BA</span>
        </div>
        <p className="font-serif text-xs text-neutral-300 tracking-wide font-normal max-w-[85%] truncate">
          {alt || 'BLACK APPLE'}
        </p>
        <span className="text-[10px] text-neutral-500 mt-1 font-serif italic">
          {hasError ? 'Không thể tải ảnh từ URL' : 'Chưa có ảnh'}
        </span>
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            type="button"
            className="mt-3 px-3 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-neutral-200 border border-white/[0.12] rounded-full text-[10px] font-serif transition-colors"
          >
            Tải ảnh lên
          </button>
        )}
      </div>
    );
  }

  const handleImageLoad = () => {
    setIsLoading(false);
    if (currentUrl) {
      CACHED_IMAGE_SET.add(currentUrl);
    }
    if (directUrl) {
      CACHED_IMAGE_SET.add(directUrl);
    }
  };

  const handleImageError = () => {
    // If optimized CDN URL failed, immediately fallback to raw direct original URL
    if (!hasTriedFallback && directUrl && currentUrl !== directUrl) {
      setHasTriedFallback(true);
      setCurrentUrl(directUrl);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      {/* Refined editorial shimmer loading skeleton (prevents CLS layout shift) */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0e0e13] flex items-center justify-center overflow-hidden pointer-events-none z-10 transition-opacity duration-300">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse"
            style={{ animationDuration: '1.4s' }}
          />
          <div className="flex flex-col items-center gap-1.5 opacity-40">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-ping" />
            <span className="text-[9px] text-neutral-400 font-mono tracking-widest uppercase">
              ARCHIVE
            </span>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        src={currentUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // For animated GIFs on Safari iOS, 'auto' decoding prevents animation freezing
        decoding={isGif ? 'auto' : 'async'}
        // Modern fetchpriority hint for browser LCP optimization
        {...({ fetchPriority: priority ? 'high' : 'auto' } as Record<string, unknown>)}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ objectPosition }}
        className={`w-full h-full object-cover ${
          isGif
            ? // Animated GIFs: render directly without blur/scale filter so Safari loops smoothly
              'opacity-100'
            : // Static images: smooth fade-in once loaded
              `transition-opacity duration-300 ease-out ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`
        }`}
      />
    </div>
  );
}
