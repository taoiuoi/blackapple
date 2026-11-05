import React, { useState, useEffect, useRef, useCallback } from 'react';

interface QuickScrollScrubberProps {
  /** Optional custom section anchors for smart tooltip labels */
  sectionLabels?: Array<{ id: string; label: string }>;
  className?: string;
}

export const QuickScrollScrubber: React.FC<QuickScrollScrubberProps> = ({
  sectionLabels = [],
  className = ''
}) => {
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string>('');
  const [isScrollable, setIsScrollable] = useState(true);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Compute scroll progress & current section label
  const updateScrollProgress = useCallback(() => {
    if (typeof window === 'undefined') return;
    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;

    if (maxScroll <= 40) {
      // Document is still loading or really short
      setIsScrollable(false);
      return;
    }
    setIsScrollable(true);

    const currentY = window.scrollY || window.pageYOffset || 0;
    const progress = Math.max(0, Math.min(1, currentY / maxScroll));
    setScrollProgress(progress);

    // Identify current section for tooltip feedback
    if (progress <= 0.05) {
      setCurrentLabel('Đầu trang');
    } else if (progress >= 0.95) {
      setCurrentLabel('Đáy trang');
    } else if (sectionLabels.length > 0) {
      let matchedLabel = `${Math.round(progress * 100)}%`;
      for (let i = sectionLabels.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionLabels[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= winHeight * 0.45) {
            matchedLabel = sectionLabels[i].label;
            break;
          }
        }
      }
      setCurrentLabel(matchedLabel);
    } else {
      setCurrentLabel(`${Math.round(progress * 100)}%`);
    }
  }, [sectionLabels]);

  // Window scroll listener + periodic recalculation to adapt as images & data load
  useEffect(() => {
    const handleScroll = () => {
      if (!isDragging) {
        updateScrollProgress();
        setIsScrolling(true);
        if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => {
          setIsScrolling(false);
        }, 1500);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    // Run immediately and poll for initial content loading
    updateScrollProgress();
    const intervalId = window.setInterval(updateScrollProgress, 600);
    const stopIntervalTimer = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 6000);

    // ResizeObserver on body if available
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      ro = new ResizeObserver(() => {
        updateScrollProgress();
      });
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollProgress);
      window.clearInterval(intervalId);
      window.clearTimeout(stopIntervalTimer);
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      if (ro) ro.disconnect();
    };
  }, [updateScrollProgress, isDragging]);

  // Scroll to a specific progress ratio (0 to 1)
  const scrollToRatio = useCallback((ratio: number, smooth = false) => {
    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const targetY = clampedRatio * maxScroll;

    setScrollProgress(clampedRatio);
    window.scrollTo({
      top: targetY,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Handle direct scrubber dragging (Touch & Mouse)
  const handleScrubFromClientY = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const ratio = relativeY / rect.height;
      scrollToRatio(ratio, false);
    },
    [scrollToRatio]
  );

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleScrubFromClientY(e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      handleScrubFromClientY(moveEvent.clientY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
  };

  // Touch Drag Handlers (Mobile / Tablets)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    handleScrubFromClientY(e.touches[0].clientY);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      moveEvent.preventDefault(); // Prevents rubber-banding while scrubbing
      handleScrubFromClientY(moveEvent.touches[0].clientY);
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  // Jump strictly to Top or Bottom
  const jumpToTop = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    scrollToRatio(0, true);
  };

  const jumpToBottom = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    scrollToRatio(1, true);
  };

  // Always keep in DOM once mounted unless page is completely static short screen
  if (!isScrollable) return null;

  const isActive = isDragging || isHovered || isScrolling;

  return (
    <aside
      className={`fixed right-1.5 sm:right-3 top-24 bottom-24 z-[70] select-none flex flex-col items-center pointer-events-auto transition-opacity duration-200 ${
        isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Thanh kéo cuộn nhanh hồ sơ"
    >
      {/* 1. TOP QUICK-JUMP CAP (▲ Lướt lên đỉnh) */}
      <button
        type="button"
        onClick={jumpToTop}
        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#18181A] hover:bg-black text-white border border-white/30 flex items-center justify-center text-[10px] sm:text-[11px] shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform active:scale-90 cursor-pointer mb-1.5"
        title="Lướt nhanh lên đỉnh trang"
      >
        ▲
      </button>

      {/* 2. MAIN VERTICAL SCRUBBER TRACK (Kéo trượt hoặc chạm để cuộn tức thì) */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative flex-1 w-8 sm:w-9 flex items-center justify-center cursor-pointer group touch-none"
      >
        {/* Crisp Vertical Track: Visible on both light (#FAF9F6) and dark backgrounds */}
        <div className="w-[4px] h-full rounded-full bg-black/25 dark:bg-white/25 group-hover:bg-black/35 dark:group-hover:bg-white/35 transition-colors relative overflow-hidden shadow-inner border border-black/10 dark:border-white/10">
          {/* Active Fill Level with Crimson highlight */}
          <div
            className="w-full bg-[#72121E] rounded-full transition-all duration-75"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* 3. DRAGGABLE SCRUBBER THUMB (Con trượt kéo thả nổi bật) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 sm:w-6 h-8 sm:h-9 rounded-full bg-[#18181A] text-white border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.55)] flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform"
          style={{
            top: `calc(${scrollProgress * 100}% - 16px)`
          }}
        >
          {/* Subtle tactile grip ridges */}
          <div className="w-2.5 h-[1.5px] bg-white/70 mb-0.5 rounded-full" />
          <div className="w-3 h-[2px] bg-[#9e1c2a] mb-0.5 rounded-full" />
          <div className="w-2.5 h-[1.5px] bg-white/70 rounded-full" />

          {/* FLOATING SCRUBBER TOOLTIP (Hiển thị vị trí mục đang kéo đến) */}
          {isActive && (
            <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#0F0F14]/95 text-white text-[11px] font-sans font-medium whitespace-nowrap border border-white/20 shadow-2xl pointer-events-none animate-fadeIn flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72121E]" />
              <span>{currentLabel || `${Math.round(scrollProgress * 100)}%`}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM QUICK-JUMP CAP (▼ Lướt xuống đáy) */}
      <button
        type="button"
        onClick={jumpToBottom}
        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#18181A] hover:bg-black text-white border border-white/30 flex items-center justify-center text-[10px] sm:text-[11px] shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform active:scale-90 cursor-pointer mt-1.5"
        title="Lướt nhanh xuống đáy trang"
      >
        ▼
      </button>
    </aside>
  );
};
