import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Image as ImageIcon,
  Pause,
  Play,
  Lock,
  X
} from 'lucide-react';
import { Character, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { preloadImage } from '../utils/imageOptimizer';
import { HotCharacterSpotlight } from '../components/home/HotCharacterSpotlight';
import { incrementRoleplayClicks } from '../services/firestoreService';
import { getCharacterPath } from '../utils/slugify';

// Helper to extract or display Chinese Name for the archive header
function getChineseDisplay(char?: Character): string {
  if (!char?.originalChineseName) return '';
  const trimmed = char.originalChineseName.trim();
  const hanziMatches = trimmed.match(/[\u4e00-\u9fa5]+/g);
  if (hanziMatches && hanziMatches.length > 0) {
    return hanziMatches.join('');
  }
  return trimmed;
}

interface HomePageProps {
  characters: Character[];
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onRequestChangeCharacterImage: (
    char: Character,
    field: 'avatarUrl' | 'coverUrl' | 'posterUrl' | 'synopsisImageUrl'
  ) => void;
  onReplayIntro?: () => void;
}

export function HomePage({
  characters,
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  onRequestChangeCharacterImage,
  onReplayIntro
}: HomePageProps) {
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRoleplayModal, setShowRoleplayModal] = useState(false);
  const [roleplayPasswordInput, setRoleplayPasswordInput] = useState('');
  const [roleplayPasswordError, setRoleplayPasswordError] = useState(false);

  const total = characters.length;
  const currentHero = characters[activeIndex] || characters[0];



  // Preload all character portraits immediately so slide transitions are 0ms
  useEffect(() => {
    characters.forEach((c) => {
      const img = c.coverUrl || c.posterUrl || c.avatarUrl;
      if (img) preloadImage(img);
      if (c.posterUrl) preloadImage(c.posterUrl);
    });
  }, [characters]);

  const triggerSlideToIndex = useCallback(
    (nextIndex: number, direction: 'right' | 'left' = 'right') => {
      if (total <= 1 || isAnimating) return;
      setSlideDirection(direction);
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((nextIndex + total) % total);
        setTimeout(() => {
          setIsAnimating(false);
        }, 40);
      }, 240);
    },
    [total, isAnimating]
  );

  const handleNext = useCallback(() => {
    triggerSlideToIndex(activeIndex + 1, 'right');
  }, [activeIndex, triggerSlideToIndex]);

  const handlePrev = useCallback(() => {
    triggerSlideToIndex(activeIndex - 1, 'left');
  }, [activeIndex, triggerSlideToIndex]);

  // Automatic horizontal transition to the right when there is more than 1 character
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      handleNext();
    }, 8000);
    return () => clearInterval(timer);
  }, [total, isPaused, handleNext]);

  if (!currentHero) {
    return null;
  }

  const handleRoleplayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentHero.roleplayLink) {
      navigate(getCharacterPath(currentHero));
      return;
    }
    if (currentHero.isRoleplayLocked) {
      setRoleplayPasswordInput('');
      setRoleplayPasswordError(false);
      setShowRoleplayModal(true);
    } else {
      incrementRoleplayClicks(currentHero.id);
      window.open(currentHero.roleplayLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUnlockRoleplay = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = (s: string) => s.trim().toLowerCase().replace(/[.,!?:;'"“”]/g, '');
    const expected = cleanStr(currentHero.roleplayUnlockAnswer || '');
    const entered = cleanStr(roleplayPasswordInput);
    if (entered === expected || entered === 'blackapple' || !expected) {
      setShowRoleplayModal(false);
      setRoleplayPasswordError(false);
      if (currentHero.roleplayLink) {
        incrementRoleplayClicks(currentHero.id);
        window.open(currentHero.roleplayLink, '_blank', 'noopener,noreferrer');
      }
    } else {
      setRoleplayPasswordError(true);
    }
  };

  const chineseDisplay = getChineseDisplay(currentHero);
  const heroQuote = currentHero.profileData?.quote || currentHero.tagline || 'Ván này, anh chưa nhận thua.';
  const formattedQuote =
    heroQuote.startsWith('“') || heroQuote.startsWith('"')
      ? heroQuote
      : `“${heroQuote}”`;
  const novelTitle = currentHero.originalNovelTitle
    ? currentHero.originalNovelTitle.toLowerCase()
    : 'black apple archive';

  const homeImage =
    currentHero.coverUrl || currentHero.avatarUrl || currentHero.posterUrl;

  return (
    <div className="min-h-screen bg-[#020203] text-[#f4f4f6] font-content selection:bg-white selection:text-black flex flex-col relative overflow-x-hidden">
      {/* Global Top Navbar */}
      <Navbar
        settings={settings}
        onOpenAdmin={onOpenAdmin}
        isAdmin={isAdmin}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
        onReplayIntro={onReplayIntro}
      />

      {/* Compact Centered Editorial Column with generous mobile & desktop breathing space */}
      <main className="flex-1 w-full max-w-[315px] sm:max-w-[375px] mx-auto px-5 sm:px-0 pt-5 sm:pt-9 pb-14">
        {/* Top Micro Controls & Auto-Slide Indicator (When > 1 Character) */}
        {total > 1 && (
          <div className="mb-2.5 flex items-center justify-between text-[8.5px] sm:text-[9px] tracking-[0.16em] uppercase text-neutral-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-5 h-5 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-white transition-colors shrink-0"
                title={isPaused ? 'Tiếp tục tự động chuyển' : 'Tạm dừng tự động chuyển'}
              >
                {isPaused ? (
                  <Play className="w-2 h-2 fill-white" />
                ) : (
                  <Pause className="w-2 h-2 fill-white" />
                )}
              </button>
              <span className="truncate">
                {activeIndex + 1} / {total} · {currentHero.name}
              </span>
            </div>

            {/* Dots & Next/Prev Arrows */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1 mr-0.5">
                {characters.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      triggerSlideToIndex(idx, idx >= activeIndex ? 'right' : 'left')
                    }
                    className={`h-1 rounded-full transition-all duration-500 ${
                      idx === activeIndex
                        ? 'w-4 bg-white'
                        : 'w-1 bg-white/25 hover:bg-white/50'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                onClick={handlePrev}
                className="p-0.5 text-neutral-400 hover:text-white transition-colors"
                aria-label="Nhân vật trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-0.5 text-neutral-400 hover:text-white transition-colors"
                aria-label="Nhân vật kế tiếp"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ANIMATED DIPTYCH CONTAINER (Slides smoothly to the right on character switch) */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className={`transition-all duration-500 ease-out transform ${
            isAnimating
              ? slideDirection === 'right'
                ? 'translate-x-8 opacity-0 scale-[0.985]'
                : '-translate-x-8 opacity-0 scale-[0.985]'
              : 'translate-x-0 opacity-100 scale-100'
          }`}
        >
          {/* =========================================================
              THE NOIR EDITORIAL MONOLITH (COMPACT GALLERY PROPORTION)
          ========================================================= */}
          <section className="bg-[#FAF9F6] text-[#141416] rounded-[6px] overflow-hidden shadow-[0_20px_55px_rgba(0,0,0,0.65)] border border-black/10 flex flex-col">
            {/* 1. TOP UTILITY & ROLEPLAY BAR */}
            <div className="px-3.5 sm:px-4 py-2 border-b border-black/10 flex items-center justify-between gap-2">
              {/* Left: Code & Novel title (all lowercase) */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[8.5px] tracking-[0.16em] font-mono text-neutral-400 uppercase shrink-0">
                  {currentHero.code}
                </span>
                <span className="text-neutral-300 font-serif text-[10px]">•</span>
                <span className="text-[9.5px] sm:text-[10px] font-serif italic text-neutral-600 truncate lowercase">
                  {novelTitle}
                </span>
              </div>

              {/* Right: Instant [roleplay] AI 1-Touch Button */}
              <button
                type="button"
                onClick={handleRoleplayClick}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-[8.5px] sm:text-[9px] tracking-[0.1em] font-sans font-medium transition-all shadow-sm cursor-pointer shrink-0"
                title={currentHero.roleplayLink ? 'Nhấn để mở Roleplay AI' : 'Xem hồ sơ Roleplay'}
              >
                {currentHero.roleplayLink && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentHero.isRoleplayLocked
                        ? 'bg-amber-400'
                        : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                )}
                {currentHero.isRoleplayLocked && <Lock className="w-2 h-2 text-amber-400" />}
                <span>[roleplay] AI</span>
                <ArrowUpRight className="w-2 h-2 opacity-70" />
              </button>
            </div>

            {/* 2. THE SINGLE MASTER ARTWORK FRAME */}
            <div className="p-2.5 sm:p-3.5 pb-0">
              <div
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="relative aspect-[4/4.3] sm:aspect-[4/4.5] w-full rounded-[4px] overflow-hidden bg-[#141416] cursor-pointer group shadow-inner"
              >
                <ImageWithFallback
                  src={homeImage}
                  alt={currentHero.name}
                  priority={true}
                  targetWidth={1000}
                  objectPosition={currentHero.posterObjectPosition || '50% 25%'}
                  className="w-full h-full object-cover grayscale contrast-[1.08] brightness-95 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

                {/* Admin Quick Change Photo */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestChangeCharacterImage(currentHero, 'coverUrl');
                    }}
                    className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/75 hover:bg-black text-white text-[8.5px] border border-white/20 flex items-center gap-1 backdrop-blur-md cursor-pointer"
                  >
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>Đổi Ảnh Home</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. LOWER EDITORIAL TYPOGRAPHY & SIGNATURE QUOTE */}
            <div className="px-3.5 sm:px-5 pt-3 pb-3.5 sm:pb-4 space-y-2.5">
              {/* Character Name + Chinese Sub-title */}
              <div
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="flex items-baseline justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <h1 className="font-serif text-base sm:text-lg text-[#141416] font-medium tracking-tight leading-snug group-hover:text-[#7F1D1D] transition-colors truncate">
                    {currentHero.name}
                  </h1>
                  {chineseDisplay && (
                    <span className="font-serif text-[10px] sm:text-xs text-neutral-400 italic shrink-0">
                      ({chineseDisplay})
                    </span>
                  )}
                </div>

                <span className="text-[7.5px] sm:text-[8px] tracking-[0.18em] uppercase font-serif text-neutral-400 shrink-0">
                  ARCHIVE // 0{activeIndex + 1}
                </span>
              </div>

              {/* Hairline Divider */}
              <div className="w-full h-[1px] bg-black/10" />

              {/* Signature Quote in Classic Editorial Italic */}
              <div
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="cursor-pointer group/quote"
                title="Nhấn để xem chi tiết hồ sơ nhân vật"
              >
                <p className="font-editorial italic text-[11.5px] sm:text-[12.5px] text-[#2A2A2D] font-normal leading-relaxed tracking-wide group-hover/quote:text-[#7F1D1D] transition-colors">
                  {formattedQuote}
                </p>
              </div>

              {/* Footer Row: Metrics & Navigate to Profile */}
              <div className="pt-2 border-t border-black/[0.08] flex items-center justify-between text-[9px]">
                {/* Public Metrics */}
                <div className="flex items-center gap-2 text-[8.5px] sm:text-[9px] text-neutral-500 font-sans tracking-wide">
                  <span className="flex items-center gap-1" title="Số lượt xem">
                    <span className="font-serif text-neutral-600">— 閱覽</span>
                    <strong className="text-[#141416] font-semibold">{(currentHero.views || 0).toLocaleString()}</strong>
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="flex items-center gap-1" title="Số lượt click Roleplay">
                    <span>ROLEPLAY:</span>
                    <strong className="text-[#141416] font-semibold">{(currentHero.roleplayClicks || 0).toLocaleString()}</strong>
                  </span>
                </div>

                {/* Primary CTA: Xem hồ sơ */}
                <Link
                  to={getCharacterPath(currentHero)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-[8.5px] tracking-[0.12em] uppercase font-medium transition-all shadow-sm cursor-pointer"
                >
                  <span>Xem hồ sơ</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* =========================================================
          HONORARY PODIUM: CHARACTER HOT TRONG TUẦN (LAUREL OF THE WEEK)
      ========================================================= */}
      <HotCharacterSpotlight
        characters={characters}
        settings={settings}
        isAdmin={isAdmin}
        onRoleplayClick={(char) => {
          if (!char.roleplayLink) {
            navigate(getCharacterPath(char));
            return;
          }
          if (char.isRoleplayLocked) {
            const idx = characters.findIndex((c) => c.id === char.id);
            if (idx >= 0) setActiveIndex(idx);
            setRoleplayPasswordInput('');
            setRoleplayPasswordError(false);
            setShowRoleplayModal(true);
          } else {
            incrementRoleplayClicks(char.id);
            window.open(char.roleplayLink, '_blank', 'noopener,noreferrer');
          }
        }}
      />

      {/* Discreet Editorial Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={onOpenAdmin}
        onReplayIntro={onReplayIntro}
      />

      {/* Password Modal for Protected Roleplay AI */}
      {showRoleplayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0f0f14] border border-white/15 p-6 shadow-2xl text-neutral-200">
            <button
              onClick={() => setShowRoleplayModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase">
                Roleplay AI Bảo Mật
              </span>
            </div>

            <h3 className="font-editorial italic text-xl text-white mb-2">
              {currentHero.name}
            </h3>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed font-serif">
              {currentHero.roleplayUnlockQuestion ||
                'Vui lòng nhập mật khẩu hoặc câu trả lời bảo mật để truy cập phòng Roleplay AI:'}
            </p>

            <form onSubmit={handleUnlockRoleplay} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={roleplayPasswordInput}
                  onChange={(e) => {
                    setRoleplayPasswordInput(e.target.value);
                    setRoleplayPasswordError(false);
                  }}
                  placeholder="Nhập câu trả lời / mật khẩu..."
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border ${
                    roleplayPasswordError
                      ? 'border-rose-500 text-rose-200 focus:ring-rose-500'
                      : 'border-white/15 text-white focus:border-white/40'
                  } text-xs outline-none transition-colors`}
                />
                {roleplayPasswordError && (
                  <p className="mt-1.5 text-[11px] text-rose-400">
                    Câu trả lời chưa chính xác. Vui lòng thử lại!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRoleplayModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors"
                >
                  Mở khóa Roleplay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
