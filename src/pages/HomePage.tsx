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
import { preloadCharacterAssets, preloadImage } from '../utils/imageOptimizer';
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

  // Preload immediate adjacent slides (next and prev) after current slide is stable
  useEffect(() => {
    if (total <= 1) return;
    const timer = setTimeout(() => {
      const nextChar = characters[(activeIndex + 1) % total];
      const prevChar = characters[(activeIndex - 1 + total) % total];

      if (nextChar) {
        const nextImg = nextChar.coverUrl || nextChar.posterUrl || nextChar.avatarUrl;
        if (nextImg) preloadImage(nextImg);
        if (nextChar.avatarUrl) preloadImage(nextChar.avatarUrl);
      }
      if (prevChar) {
        const prevImg = prevChar.coverUrl || prevChar.posterUrl || prevChar.avatarUrl;
        if (prevImg) preloadImage(prevImg);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activeIndex, characters, total]);

  const triggerSlideToIndex = useCallback(
    (nextIndex: number, direction: 'right' | 'left' = 'right') => {
      if (total <= 1 || isAnimating) return;
      setSlideDirection(direction);
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((nextIndex + total) % total);
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 280);
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
      // Don't auto-slide if user is in background tab or reading
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
    const expected = (currentHero.roleplayUnlockAnswer || '').trim().toLowerCase();
    const entered = roleplayPasswordInput.trim().toLowerCase();
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
    ? currentHero.originalNovelTitle.toUpperCase()
    : 'BLACK APPLE ARCHIVE';

  const topFrameImage =
    currentHero.coverUrl || currentHero.posterUrl || currentHero.avatarUrl;
  const bottomStageImage =
    currentHero.posterUrl || currentHero.avatarUrl || currentHero.coverUrl;

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

      {/* Main Centered Editorial Column (Inspired by IMG_0456_6b853090.jpeg Vibe) */}
      <main className="flex-1 w-full max-w-[560px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-28">
        {/* Top Micro Controls & Auto-Slide Indicator (When > 1 Character) */}
        {total > 1 && (
          <div className="mb-4 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-neutral-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-6 h-6 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-white transition-colors"
                title={isPaused ? 'Tiếp tục tự động chuyển' : 'Tạm dừng tự động chuyển'}
              >
                {isPaused ? (
                  <Play className="w-2.5 h-2.5 fill-white" />
                ) : (
                  <Pause className="w-2.5 h-2.5 fill-white" />
                )}
              </button>
              <span>
                {activeIndex + 1} / {total} · {currentHero.name}
              </span>
            </div>

            {/* Dots & Next/Prev Arrows */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                {characters.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      triggerSlideToIndex(idx, idx >= activeIndex ? 'right' : 'left')
                    }
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === activeIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/25 hover:bg-white/50'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                onClick={handlePrev}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                aria-label="Nhân vật trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                aria-label="Nhân vật kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
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
                ? 'translate-x-10 opacity-0 scale-[0.985]'
                : '-translate-x-10 opacity-0 scale-[0.985]'
              : 'translate-x-0 opacity-100 scale-100'
          }`}
        >
          {/* =========================================================
              PART 1: TOP WHITE EDITORIAL GALLERY CARD
          ========================================================= */}
          <section className="bg-[#FAF9F6] text-[#141416] rounded-[6px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.65)]">
            {/* Upper Framed Monochrome Photo */}
            <div className="p-3.5 sm:p-5 pb-0">
              <div
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="relative aspect-[4/3] sm:aspect-[16/11] w-full rounded-[8px] overflow-hidden bg-[#141416] cursor-pointer group"
              >
                <ImageWithFallback
                  src={topFrameImage}
                  alt={currentHero.name}
                  priority={true}
                  targetWidth={1200}
                  objectPosition={currentHero.posterObjectPosition || '50% 25%'}
                  className="w-full h-full object-cover grayscale contrast-[1.08] brightness-95 group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

                {/* Admin Quick Change Top Photo */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestChangeCharacterImage(currentHero, 'coverUrl');
                    }}
                    className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[10px] border border-white/20 flex items-center gap-1 backdrop-blur-md"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Đổi Ảnh trên</span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle Minimalist Medallion Row (Left Note | Center Avatar Circle | Right Credit) */}
            <div className="px-6 sm:px-9 py-6 sm:py-8 flex items-center justify-between gap-4">
              {/* Left Micro Note */}
              <div className="text-[9px] sm:text-[10px] leading-[1.25] text-neutral-500 font-serif">
                <div>Hồ sơ</div>
                <div>{currentHero.code}</div>
              </div>

              {/* Center Circular Avatar Medallion + Sub-caption */}
              <div className="flex flex-col items-center text-center">
                <div
                  onClick={() =>
                    isAdmin
                      ? onRequestChangeCharacterImage(currentHero, 'avatarUrl')
                      : navigate(getCharacterPath(currentHero))
                  }
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-black/15 bg-neutral-200 shadow-sm cursor-pointer group"
                  title={isAdmin ? 'Nhấn để đổi Avatar' : currentHero.name}
                >
                  <ImageWithFallback
                    src={currentHero.avatarUrl}
                    alt={currentHero.name}
                    priority={true}
                    targetWidth={240}
                    className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="mt-2 leading-tight">
                  <span className="block text-[9px] sm:text-[10px] font-semibold text-[#141416] tracking-tight">
                    {currentHero.originalNovelTitle || 'Black Apple.'}
                  </span>
                  <span className="block text-[8px] sm:text-[9px] text-neutral-400">
                    {currentHero.profileData?.role || 'nhân vật trung tâm:'}
                  </span>
                </div>
              </div>

              {/* Right Micro Credit */}
              <div className="text-[9px] sm:text-[10px] leading-[1.25] text-neutral-400 text-right font-serif">
                <div>Archive</div>
                <div>TAOIUOI</div>
              </div>
            </div>

            {/* Full-Width Crisp Hairline Divider */}
            <div className="border-t border-black/25" />

            {/* Lower Asymmetric Name & Calligraphic Title Row */}
            {/* Lower Asymmetric Name Row (Right side left completely empty as requested) */}
            <div
              onClick={() => navigate(getCharacterPath(currentHero))}
              className="px-6 sm:px-9 py-5 sm:py-7 flex items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left: Tiny Triangle Arrow + Character Name & Subtitle */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-[10px] text-[#141416] group-hover:translate-x-1 transition-transform">
                  ▸
                </span>
                <div className="min-w-0">
                  <h1 className="font-serif text-lg sm:text-2xl text-[#141416] font-medium tracking-tight leading-tight">
                    {currentHero.name}
                  </h1>
                  {currentHero.originalChineseName && (
                    <p className="text-[9px] sm:text-[10px] italic text-neutral-400 font-serif truncate mt-0.5">
                      {currentHero.originalChineseName}
                    </p>
                  )}
                </div>
              </div>

              {/* Right side left completely empty as requested */}
              <div />
            </div>
          </section>

          {/* =========================================================
              NEW INTERMEZZO CARD: ARCHIVE (CHINESE) & ROLEPLAY AI & QUOTE
              (Concept Noir Editorial Inspired by Reference 2)
          ========================================================= */}
          <div className="my-3.5 sm:my-4 rounded-[10px] bg-[#0E0E12]/95 border border-white/[0.09] hover:border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden transition-all duration-300 group">
            {/* Ambient Background Sheen */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

            {/* Line 1: archive (CHINESE) */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-editorial italic text-2xl sm:text-[27px] text-neutral-100 font-normal tracking-tight">
                  archive
                </span>
                {chineseDisplay && (
                  <span className="font-serif text-lg sm:text-xl text-neutral-300 font-normal tracking-wider">
                    ({chineseDisplay})
                  </span>
                )}
              </div>

              {/* Discreet Editorial Badge */}
              <span className="text-[10px] text-neutral-500 font-serif tracking-[0.25em] uppercase select-none group-hover:text-neutral-300 transition-colors">
                — NOIR
              </span>
            </div>

            {/* Line 2: [roleplay] AI — • NOVEL TITLE */}
            <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs text-neutral-400">
              <button
                type="button"
                onClick={handleRoleplayClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 hover:border-white/25 text-[10px] sm:text-[11px] text-neutral-200 hover:text-white transition-all cursor-pointer font-sans"
                title={currentHero.roleplayLink ? 'Mở Roleplay AI' : 'Xem hồ sơ Roleplay'}
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
                {currentHero.isRoleplayLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                <span>[roleplay] AI</span>
                <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
              </button>

              <span className="text-neutral-600 font-serif select-none">— •</span>

              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-300 truncate max-w-[280px]">
                {novelTitle}
              </span>
            </div>

            {/* Hairline Divider */}
            <div className="w-full h-[1px] bg-white/[0.08] my-3.5 sm:my-4" />

            {/* Line 3: Signature Quote */}
            <div
              onClick={() => navigate(getCharacterPath(currentHero))}
              className="cursor-pointer group/quote"
              title="Nhấn để xem chi tiết hồ sơ nhân vật"
            >
              <p className="font-editorial italic text-sm sm:text-[15px] text-neutral-200/95 font-light leading-relaxed tracking-wide group-hover/quote:text-white transition-colors">
                {formattedQuote}
              </p>
            </div>

            {/* Public Character Metrics: Views & Roleplay Link clicks (No eye icon, synchronized editorial font) */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-neutral-400 font-sans tracking-wider">
              <span className="flex items-center gap-1.5" title="Số lượt xem hồ sơ nhân vật">
                <span className="font-serif text-neutral-300">— 閱覽</span>
                <span className="text-white font-medium">{(currentHero.views || 0).toLocaleString()}</span>
                <span className="text-neutral-500">lượt</span>
              </span>
              <span className="flex items-center gap-1.5" title="Số lượt nhấp nhận link Roleplay">
                <span className="text-neutral-300 font-serif">—</span>
                <span className="text-neutral-300">ROLEPLAY:</span>
                <span className="text-white font-medium">{(currentHero.roleplayClicks || 0).toLocaleString()}</span>
                <span className="text-neutral-500">lượt</span>
              </span>
            </div>
          </div>

          {/* =========================================================
              PART 2: BOTTOM DARK CINEMATIC PORTRAIT STAGE
          ========================================================= */}
          <section className="relative rounded-[6px] overflow-hidden aspect-[4/5] bg-[#070709] border border-white/[0.08] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col justify-between group">
            {/* Full-Bleed High-Contrast Monochrome Character Portrait */}
            <ImageWithFallback
              src={bottomStageImage}
              alt={currentHero.name}
              priority={true}
              targetWidth={1200}
              objectPosition={currentHero.posterObjectPosition || '50% 20%'}
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.12] brightness-95 group-hover:scale-[1.03] transition-transform duration-1000"
            />

            {/* Top & Bottom Cinematic Vignette Gradients */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

            {/* Top Floating Micro Navigation Bar inside Dark Portrait */}
            <div className="relative z-20 px-5 sm:px-7 pt-5 flex items-center justify-between text-[10px] sm:text-[11px] text-white/85">
              <span className="font-medium tracking-wide drop-shadow">
                • {currentHero.originalNovelTitle || 'Black Apple.'}
              </span>

              <div className="flex items-center gap-3 sm:gap-5">
                <Link
                  to={getCharacterPath(currentHero)}
                  className="text-white border-b border-white pb-0.5 font-medium"
                >
                  Hồ sơ
                </Link>
                <Link
                  to="/characters"
                  className="text-white/75 hover:text-white transition-colors"
                >
                  Danh sách
                </Link>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('ba:show-creator-popup'))}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer text-[10px] sm:text-[11px]"
                  title="Mở khung giới thiệu Creator & Donate"
                >
                  Creator
                </button>
                <Link
                  to="/creator"
                  className="text-white/75 hover:text-white transition-colors"
                >
                  Info.
                </Link>
              </div>
            </div>

            {/* Admin Quick Change Bottom Portrait Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onRequestChangeCharacterImage(currentHero, 'posterUrl')}
                className="absolute top-14 right-5 z-30 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[10px] border border-white/20 flex items-center gap-1 backdrop-blur-md"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Đổi Poster dưới</span>
              </button>
            )}

            {/* Bottom-Left Story Hook & CTA ("Into the multiverse" style) */}
            <div className="relative z-20 px-6 sm:px-8 pb-7 sm:pb-9 mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-xs space-y-1.5">
                <h2 className="font-serif text-xl sm:text-2xl text-white tracking-tight leading-snug">
                  Into the {currentHero.name.toLowerCase()} verse
                </h2>
                <p className="text-[10px] sm:text-[11px] text-neutral-300/85 leading-relaxed line-clamp-2 font-light">
                  {currentHero.tagline ||
                    currentHero.profileData?.quote ||
                    'Bước vào hồ sơ lưu trữ độc quyền của nhân vật trong vũ trụ Black Apple.'}
                </p>
              </div>

              <button
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="self-start sm:self-end px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-black text-[10px] tracking-[0.16em] uppercase font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-lg"
              >
                <span>Xem hồ sơ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
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
