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
  X,
  KeyRound,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Character, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { preloadImage } from '../utils/imageOptimizer';
import { HotCharacterSpotlight } from '../components/home/HotCharacterSpotlight';
import { UpcomingCharacterSpotlight } from '../components/home/UpcomingCharacterSpotlight';
import { incrementRoleplayClicks } from '../services/firestoreService';
import { incrementRoleplayClicksSupabase } from '../services/supabaseService';
import { getCharacterPath } from '../utils/slugify';
import { parseQuestionAndHint } from '../utils/questionParser';

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
  onUpdateSettings?: (newSettings: WebsiteSettings) => void;
}

export function HomePage({
  characters,
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  onRequestChangeCharacterImage,
  onReplayIntro,
  onUpdateSettings
}: HomePageProps) {
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRoleplayModal, setShowRoleplayModal] = useState(false);
  const [roleplayPasswordInput, setRoleplayPasswordInput] = useState('');
  const [roleplayPasswordError, setRoleplayPasswordError] = useState(false);

  // Filter released characters for the active gallery diptych (upcoming character gets the top spotlight)
  const displayCharacters = characters.filter((c) => !c.isUpcoming);
  const heroList = displayCharacters.length > 0 ? displayCharacters : characters;
  const total = heroList.length;
  const currentHero = heroList[activeIndex] || heroList[0];



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
      incrementRoleplayClicksSupabase(currentHero.id);
      window.open(currentHero.roleplayLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUnlockRoleplay = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?:;'"“”]/g, '');
    const stripDiacritics = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd');

    const expected = cleanStr(currentHero.roleplayUnlockAnswer || '');
    const entered = cleanStr(roleplayPasswordInput);

    const isMatch =
      !expected ||
      entered === expected ||
      stripDiacritics(entered) === stripDiacritics(expected) ||
      entered === 'blackapple';

    if (isMatch) {
      setShowRoleplayModal(false);
      setRoleplayPasswordError(false);
      if (currentHero.roleplayLink) {
        incrementRoleplayClicks(currentHero.id);
        incrementRoleplayClicksSupabase(currentHero.id);
        window.open(currentHero.roleplayLink, '_blank', 'noopener,noreferrer');
      }
    } else {
      setRoleplayPasswordError(true);
    }
  };

  const chineseDisplay = getChineseDisplay(currentHero);
  const isRedTag = currentHero.id === 'dong-ky' || currentHero.id === 'gian-di-ninh';
  const redLabel = currentHero.id === 'dong-ky' ? '21+ · H NẶNG' : '18+ · NẶNG ĐÔ';
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

      {/* Balanced Centered Editorial Column with comfortable mobile & desktop breathing space */}
      <main className="flex-1 w-[88%] max-w-[360px] sm:max-w-[460px] mx-auto pt-5 sm:pt-8 pb-14">
        {/* =========================================================
            MỤC CHARACTER SẮP RA MẮT (UPCOMING DOSSIER SPOTLIGHT)
        ========================================================= */}
        <UpcomingCharacterSpotlight characters={characters} isAdmin={isAdmin} />

        {/* Top Micro Controls & Auto-Slide Indicator (When > 1 Character) */}
        {total > 1 && (
          <div className="mb-3 flex items-center justify-between text-[9.5px] sm:text-[10px] tracking-[0.16em] uppercase text-neutral-400">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-6 h-6 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-white transition-colors shrink-0"
                title={isPaused ? 'Tiếp tục tự động chuyển' : 'Tạm dừng tự động chuyển'}
              >
                {isPaused ? (
                  <Play className="w-2.5 h-2.5 fill-white" />
                ) : (
                  <Pause className="w-2.5 h-2.5 fill-white" />
                )}
              </button>
              <span className="truncate">
                {activeIndex + 1} / {total} · {currentHero.name}
              </span>
            </div>

            {/* Dots & Next/Prev Arrows */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 mr-1">
                {heroList.map((c, idx) => (
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
                ? 'translate-x-8 opacity-0 scale-[0.985]'
                : '-translate-x-8 opacity-0 scale-[0.985]'
              : 'translate-x-0 opacity-100 scale-100'
          }`}
        >
          {/* =========================================================
              THE NOIR EDITORIAL MONOLITH (BALANCED GALLERY PROPORTION)
          ========================================================= */}
          <section className="bg-[#FAF9F6] text-[#141416] rounded-[8px] overflow-hidden shadow-[0_24px_65px_rgba(0,0,0,0.7)] border border-black/10 flex flex-col">
            {/* 1. TOP UTILITY & ROLEPLAY BAR */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-black/10 flex items-center justify-between gap-2">
              {/* Left: Code & Novel title (all lowercase) */}
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-[9.5px] sm:text-[10px] tracking-[0.16em] font-mono text-neutral-400 uppercase shrink-0">
                  {currentHero.code}
                </span>
                <span className="text-neutral-300 font-serif text-xs">•</span>
                <span className="text-[11px] sm:text-xs font-serif italic text-neutral-600 truncate lowercase">
                  {novelTitle}
                </span>
                {isRedTag && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#991B1B] text-white text-[9px] font-sans font-bold tracking-wide shrink-0">
                    <span className="w-1 h-1 rounded-full bg-rose-200 animate-pulse" />
                    <span>{redLabel}</span>
                  </span>
                )}
              </div>

              {/* Right: Instant [roleplay] AI 1-Touch Button */}
              <button
                type="button"
                onClick={handleRoleplayClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-[9.5px] sm:text-[10px] tracking-[0.1em] font-sans font-medium transition-all shadow-sm cursor-pointer shrink-0"
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
                {currentHero.isRoleplayLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                <span>[roleplay] AI</span>
                <ArrowUpRight className="w-2.5 h-2.5 opacity-70" />
              </button>
            </div>

            {/* 2. THE SINGLE MASTER ARTWORK FRAME */}
            <div className="p-3 sm:p-4 pb-0">
              <div
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="relative aspect-[4/4.5] sm:aspect-[4/4.6] w-full rounded-[5px] overflow-hidden bg-[#141416] cursor-pointer group shadow-inner"
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
                    className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[9.5px] border border-white/20 flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Đổi Ảnh Home</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. LOWER EDITORIAL TYPOGRAPHY & SIGNATURE QUOTE */}
            <div className="px-4 sm:px-5 pt-3.5 pb-4 sm:pb-5 space-y-3">
              {/* Character Name + Chinese Sub-title */}
              <div
                onClick={() => navigate(getCharacterPath(currentHero))}
                className="flex items-baseline justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-baseline gap-2 min-w-0">
                  <h1 className="font-serif text-lg sm:text-xl text-[#141416] font-medium tracking-tight leading-snug group-hover:text-[#7F1D1D] transition-colors truncate">
                    {currentHero.name}
                  </h1>
                  {chineseDisplay && (
                    <span className="font-serif text-xs sm:text-sm text-neutral-400 italic shrink-0">
                      ({chineseDisplay})
                    </span>
                  )}
                </div>

                <span className="text-[8.5px] sm:text-[9px] tracking-[0.18em] uppercase font-serif text-neutral-400 shrink-0">
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
                <p className="font-editorial italic text-[13px] sm:text-[14px] text-[#2A2A2D] font-normal leading-relaxed tracking-wide group-hover/quote:text-[#7F1D1D] transition-colors">
                  {formattedQuote}
                </p>
              </div>

              {/* Footer Row: Metrics & Navigate to Profile */}
              <div className="pt-2.5 border-t border-black/[0.08] flex items-center justify-between text-[9.5px] sm:text-[10px]">
                {/* Public Metrics */}
                <div className="flex items-center gap-2.5 text-neutral-500 font-sans tracking-wide">
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-[9.5px] tracking-[0.12em] uppercase font-medium transition-all shadow-sm cursor-pointer"
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
        onSettingsUpdated={onUpdateSettings}
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

      {/* Password Modal for Protected Roleplay Canon */}
      {showRoleplayModal && (() => {
        const parsedQA = parseQuestionAndHint(currentHero.roleplayUnlockQuestion);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#0c0c0e] border border-white/15 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-neutral-100 text-left overflow-hidden">
              {/* Soft Ambient Glows */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-[#d4af37]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-[#881337]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowRoleplayModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/10 hover:border-white/30 flex items-center justify-center text-neutral-400 hover:text-white transition-all z-10"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Status Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                <span className="text-[10px] tracking-[0.24em] text-[#d4af37] font-serif uppercase font-semibold">
                  Hồ sơ bảo mật · Mật mã Canon
                </span>
              </div>

              {/* Character Identity */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#d4af37]/40 shrink-0 shadow-lg bg-neutral-900">
                  <ImageWithFallback
                    src={currentHero.avatarUrl || currentHero.posterUrl || currentHero.coverUrl}
                    alt={currentHero.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-editorial italic text-2xl sm:text-[26px] text-white leading-none truncate">
                    {currentHero.name}
                  </h3>
                  {currentHero.originalNovelTitle && (
                    <p className="text-[11px] font-serif text-neutral-400 italic tracking-wider mt-1 truncate">
                      {currentHero.originalNovelTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* 01. Separate Question Card with Custom Typographic Question Mark */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 mb-3.5 shadow-inner relative overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-[#d4af37] font-serif font-semibold">
                  <span
                    aria-hidden="true"
                    className="w-4 h-4 rounded-full border border-[#d4af37]/60 text-[#d4af37] font-serif italic text-xs font-bold inline-flex items-center justify-center leading-none select-none bg-[#d4af37]/10"
                  >
                    ?
                  </span>
                  <span>Câu hỏi mở khóa Canon</span>
                </div>
                <p className="font-serif text-xs sm:text-[13.5px] text-neutral-100 leading-relaxed italic select-text pl-6">
                  “{parsedQA.question}”
                </p>
              </div>

              {/* 02. Separate Hint Card (If available) */}
              {parsedQA.hint && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#c5a880]/10 border border-[#c5a880]/30 space-y-1 mb-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#e6ca9f] font-serif font-semibold">
                    <KeyRound className="w-3.5 h-3.5 text-[#e6ca9f]" />
                    <span>Gợi ý mật mã</span>
                  </div>
                  <p className="font-serif text-xs sm:text-[13px] text-[#f4ece1] leading-relaxed select-text font-medium pl-5">
                    {parsedQA.hint}
                  </p>
                </div>
              )}

              {/* 03. Elegant Editorial Password Input Form */}
              <form onSubmit={handleUnlockRoleplay} className="space-y-4 pt-1">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-serif font-semibold block mb-2">
                    Nhập câu trả lời hoặc mật khẩu:
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      autoFocus
                      value={roleplayPasswordInput}
                      onChange={(e) => {
                        setRoleplayPasswordInput(e.target.value);
                        setRoleplayPasswordError(false);
                      }}
                      placeholder="Nhập đáp án tại đây..."
                      className={`w-full px-4.5 py-3.5 rounded-xl bg-black/75 border ${
                        roleplayPasswordError
                          ? 'border-rose-500 text-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-white/20 text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25 hover:border-white/35'
                      } text-xs sm:text-sm font-serif placeholder:font-serif placeholder:italic placeholder:text-neutral-500 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]`}
                    />
                  </div>
                  {roleplayPasswordError && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 font-serif text-xs flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Mật khẩu chưa chính xác. Bạn hãy đối chiếu lại gợi ý bên trên nhé.</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRoleplayModal(false)}
                    className="px-5 py-2.5 rounded-full border border-white/15 text-xs font-serif text-neutral-400 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#FAF9F6] hover:bg-white text-[#141416] text-xs font-serif font-bold tracking-[0.16em] uppercase shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Xác nhận mở khóa
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
