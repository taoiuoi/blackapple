import React, { useState, useEffect, useMemo } from 'react';
import { Eye, X, ArrowUpRight, Lock, Heart, CheckCircle2, Quote } from 'lucide-react';
import { Character, Genre } from '../../types';
import { INITIAL_GENRES } from '../../data/initialData';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  hasUserCheeredUpcoming,
  getUpcomingCheerCount,
  incrementUpcomingCheer
} from '../../services/firestoreService';
import { syncUpcomingCheerSupabase } from '../../services/supabaseService';

interface UpcomingCharacterSpotlightProps {
  characters: Character[];
  genres?: Genre[];
  isAdmin?: boolean;
}

export const UpcomingCharacterSpotlight: React.FC<UpcomingCharacterSpotlightProps> = ({
  characters,
  genres = []
}) => {
  // Strictly find the character marked as upcoming
  const upcomingChar = characters.find((c) => c.isUpcoming);
  const charId = upcomingChar?.id || '';

  const [showTeaserModal, setShowTeaserModal] = useState(false);
  const [hasCheered, setHasCheered] = useState(() =>
    charId ? hasUserCheeredUpcoming(charId) : false
  );
  const [cheerCount, setCheerCount] = useState<number>(() => {
    if (!charId) return 0;
    try {
      const cached = localStorage.getItem(`ba_cheer_count_${charId}`);
      if (cached) {
        const val = parseInt(cached, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (_) {}
    return 0;
  });

  // Keep state synchronized with persistent Cloud count
  useEffect(() => {
    if (!charId) return;
    setHasCheered(hasUserCheeredUpcoming(charId));
    let initialLocal = 0;
    try {
      const cached = localStorage.getItem(`ba_cheer_count_${charId}`);
      if (cached) {
        const val = parseInt(cached, 10);
        if (!isNaN(val) && val >= 0) initialLocal = val;
      }
    } catch (_) {}
    setCheerCount(initialLocal);

    getUpcomingCheerCount(charId).then((serverCount) => {
      if (typeof serverCount === 'number' && serverCount >= 0) {
        setCheerCount((prev) => Math.max(prev, serverCount));
      }
    });
  }, [charId]);

  const genreLabels = useMemo(() => {
    if (!upcomingChar?.genreIds || upcomingChar.genreIds.length === 0) return [];
    const lookupPool = genres.length > 0 ? genres : INITIAL_GENRES;
    const byId = new Map<string, string>();
    INITIAL_GENRES.forEach((g) => byId.set(g.id, g.name));
    lookupPool.forEach((g) => byId.set(g.id, g.name));
    return upcomingChar.genreIds
      .map((id) => byId.get(id))
      .filter((name): name is string => Boolean(name));
  }, [upcomingChar?.genreIds, genres]);

  if (!upcomingChar) return null;

  // Ảnh 1 (Home) for Home spotlight; Ảnh 2 (Profile) as primary dossier portrait in modal
  const homeTeaserImage =
    upcomingChar.coverUrl || upcomingChar.avatarUrl || upcomingChar.posterUrl;
  const modalArtwork =
    upcomingChar.posterUrl || upcomingChar.synopsisImageUrl || homeTeaserImage;

  const novelTitle = upcomingChar.originalNovelTitle
    ? upcomingChar.originalNovelTitle.toLowerCase()
    : '';
  const roleSubtitle = upcomingChar.profileData?.role || 'Sắp ra mắt';
  const tagline =
    upcomingChar.tagline ||
    upcomingChar.profileData?.quote ||
    upcomingChar.upcomingReleaseNote ||
    'Hồ sơ đang niêm phong · Sắp ra mắt trong BLACK APPLE Archive.';

  const handleCheer = async () => {
    if (!hasCheered && charId) {
      setHasCheered(true);
      setCheerCount((prev) => prev + 1);
      try {
        const newTotal = await incrementUpcomingCheer(charId);
        setCheerCount(newTotal);
        syncUpcomingCheerSupabase(charId, upcomingChar.name).catch(() => {});
      } catch (err) {
        console.warn('Could not sync cheer:', err);
      }
    }
  };

  return (
    <>
      {/* =========================================================================
          THE NOIR PREMIERE TEASER (UPCOMING CHARACTER SPOTLIGHT)
      ========================================================================= */}
      <section className="mb-8 relative group">
        {/* Subtle Ambient Back-Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-[18px] blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none" />

        <div className="relative rounded-[16px] lens-crystal-panel overflow-hidden transition-all duration-500">
          {/* Top Delicate Optical Lens Seal Ribbon */}
          <div className="px-4 sm:px-6 py-2.5 bg-white/[0.04] border-b border-white/[0.14] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="text-[10px] sm:text-[11px] font-serif tracking-[0.22em] uppercase text-rose-200 font-medium">
                ✦ Sắp ra mắt · Upcoming Archive ✦
              </span>
            </div>
            <span className="text-[11px] font-serif text-neutral-300 italic shrink-0">
              {novelTitle || upcomingChar.code}
            </span>
          </div>

          {/* Main Body: Cinematic Split Display */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Left: Home Teaser Portrait (Ảnh 1: Home) */}
            <div className="sm:col-span-5 relative">
              <div
                onClick={() => setShowTeaserModal(true)}
                className="relative aspect-[3/3.8] rounded-xl overflow-hidden bg-neutral-900 border border-white/20 cursor-pointer shadow-2xl group/img"
              >
                <ImageWithFallback
                  src={homeTeaserImage}
                  alt={upcomingChar.name}
                  priority={true}
                  targetWidth={900}
                  objectPosition="50% 18%"
                  className="w-full h-full object-cover contrast-[1.06] brightness-[0.96] group-hover/img:scale-105 group-hover/img:brightness-100 transition-all duration-700 ease-out"
                />

                {/* Soft Vignette Shadows */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

                {/* Watermark Crest - Optical Glass Tag */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/65 border border-white/25 text-[9.5px] font-serif italic text-neutral-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  {upcomingChar.code}
                </div>

                {/* Hover Eye Prompt */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/40">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black text-[10px] font-serif font-semibold tracking-wider uppercase shadow-[0_4px_20px_rgba(255,255,255,0.4)] transform translate-y-2 group-hover/img:translate-y-0 transition-transform">
                    <Eye className="w-3 h-3" />
                    <span>Xem hé lộ</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Literary Typography, Genres & Tagline */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-3.5 text-left">
              {/* Identity Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10.5px] font-serif text-neutral-400 italic flex-wrap">
                  {novelTitle && (
                    <>
                      <span className="lowercase">{novelTitle}</span>
                      <span>·</span>
                    </>
                  )}
                  <span className="text-rose-300/90 not-italic uppercase tracking-[0.16em] text-[9.5px] font-sans font-semibold">
                    ✦ Sắp ra mắt
                  </span>
                  <span>·</span>
                  <span>Hồ sơ bảo mật</span>
                </div>

                <h3 className="font-editorial italic text-2xl sm:text-3xl text-white leading-tight font-normal tracking-wide">
                  {upcomingChar.name}
                </h3>

                {upcomingChar.originalChineseName && (
                  <p className="text-[12.5px] font-serif text-neutral-300 tracking-widest">
                    {upcomingChar.originalChineseName}
                  </p>
                )}
              </div>

              {/* Genre Tags Strip (Clean Unboxed Editorial Separators) */}
              {genreLabels.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9.5px] font-serif uppercase tracking-[0.2em] text-neutral-400 block">
                    Thể loại
                  </span>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-serif text-neutral-200 leading-relaxed">
                    {genreLabels.map((g, idx) => (
                      <React.Fragment key={g}>
                        <span>{g}</span>
                        {idx < genreLabels.length - 1 && (
                          <span className="text-neutral-600 select-none">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Tagline / Release Note */}
              <div className="pl-3 border-l border-white/25 py-0.5">
                <p className="font-serif italic text-[11.5px] sm:text-xs text-neutral-300 leading-relaxed font-light select-text">
                  {tagline}
                </p>
              </div>

              {/* Status Note & Interactive Call to Action */}
              <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-white/[0.12]">
                <div className="flex items-center gap-1.5 text-[10.5px] font-serif text-neutral-300">
                  <Lock className="w-3 h-3 text-neutral-400" />
                  <span>Hồ sơ đang niêm phong</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTeaserModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white text-neutral-100 hover:text-black border border-white/30 text-[10px] font-serif font-semibold tracking-[0.16em] uppercase transition-all shadow-[0_2px_10px_rgba(0,0,0,0.4)] cursor-pointer active:scale-95"
                >
                  <span>Mở xem hé lộ</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE ARTISTIC NOIR DOSSIER POPUP (OPTICAL SPECULAR CRYSTAL LENS)
      ========================================================================= */}
      {showTeaserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-[28px] lens-crystal-panel text-neutral-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Top Minimal Bar */}
            <div className="px-6 py-4 border-b border-white/[0.14] flex items-center justify-between z-10 bg-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span className="text-[10px] sm:text-[11px] font-serif tracking-[0.24em] uppercase text-rose-200 font-medium">
                  ✦ Sắp ra mắt · Bản Thảo Niêm Phong ✦
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowTeaserModal(false)}
                className="w-8 h-8 rounded-full border border-white/20 hover:border-white/50 bg-white/[0.06] hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Magazine-Spread Artwork & Literary Editorial Layout */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Dual Artwork Gallery Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image 1: Profile Portrait (Ảnh 2) */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/15 shadow-2xl group/img1">
                  <ImageWithFallback
                    src={modalArtwork}
                    alt={`${upcomingChar.name} — Profile`}
                    objectPosition={upcomingChar.posterObjectPosition || '50% 20%'}
                    className="w-full h-full object-cover contrast-[1.05] brightness-95 group-hover/img1:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-[10px] font-serif italic text-neutral-300">
                    Portrait 01 · Profile
                  </div>
                </div>

                {/* Image 2: Home Portrait (Ảnh 1) */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/15 shadow-2xl group/img2">
                  <ImageWithFallback
                    src={homeTeaserImage}
                    alt={`${upcomingChar.name} — Home`}
                    objectPosition="50% 18%"
                    className="w-full h-full object-cover contrast-[1.05] brightness-95 group-hover/img2:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-[10px] font-serif italic text-neutral-300">
                    Portrait 02 · {upcomingChar.originalChineseName || upcomingChar.name}
                  </div>
                </div>
              </div>

              {/* Core Typographic Dossier */}
              <div className="space-y-4 pt-2">
                {/* Character Name & Identity */}
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-xs font-serif italic text-neutral-400 block mb-1">
                      {novelTitle ? `${novelTitle} · ` : ''}dự án {upcomingChar.code} · sắp ra mắt
                    </span>
                    <h2 className="font-editorial italic text-3xl sm:text-4xl text-white font-normal leading-tight">
                      {upcomingChar.name}
                    </h2>
                  </div>

                  {upcomingChar.originalChineseName && (
                    <div className="text-left sm:text-right">
                      <span className="font-serif text-lg text-neutral-300 block tracking-widest">
                        {upcomingChar.originalChineseName}
                      </span>
                      <span className="text-[10px] font-serif text-neutral-400 uppercase tracking-wider">
                        {roleSubtitle}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tagline Section with Literary Quote Layout */}
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-serif tracking-[0.2em] uppercase text-neutral-400">
                    <Quote className="w-3 h-3 text-neutral-500" />
                    <span className="italic lowercase">trạng thái hồ sơ</span>
                  </div>
                  <p className="font-serif italic text-sm sm:text-base text-neutral-100 leading-relaxed font-light pl-2 select-text">
                    {tagline}
                  </p>
                </div>

                {/* Genre Tags Strip (Unboxed Typographic Separators) */}
                {genreLabels.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-neutral-400 block">
                      Thể loại
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-serif text-neutral-300">
                      {genreLabels.map((g, idx) => (
                        <React.Fragment key={g}>
                          <span className="text-neutral-200 hover:text-white transition-colors">
                            {g}
                          </span>
                          {idx < genreLabels.length - 1 && (
                            <span className="text-neutral-600 select-none">·</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidential Curator Notice */}
                <div className="pt-2 border-t border-white/10 flex items-start gap-2.5 text-neutral-400">
                  <Lock className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-serif italic leading-relaxed text-neutral-400">
                    Hồ sơ chi tiết, thiết lập Canon và văn án chính thức đang được niêm phong bảo mật. Toàn bộ nội dung sẽ được mở khóa chính thức trên trang chủ trong thời gian tới.
                  </p>
                </div>
              </div>
            </div>

            {/* Minimal Footer Action Bar */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-black/50">
              <button
                type="button"
                onClick={handleCheer}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-serif font-bold tracking-[0.14em] uppercase transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] cursor-pointer ${
                  hasCheered
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-none'
                    : 'bg-white hover:bg-neutral-100 text-black active:scale-95'
                }`}
              >
                {hasCheered ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Đã ngóng chờ ({cheerCount})</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                    <span>Ngóng chờ nhân vật ({cheerCount})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowTeaserModal(false)}
                className="px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 bg-white/[0.04] text-xs font-serif text-neutral-300 hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

