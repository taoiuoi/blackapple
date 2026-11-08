import React, { useState } from 'react';
import { Eye, X, ArrowUpRight, Lock, Heart, CheckCircle2, Quote } from 'lucide-react';
import { Character } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface UpcomingCharacterSpotlightProps {
  characters: Character[];
  isAdmin?: boolean;
}

export const UpcomingCharacterSpotlight: React.FC<UpcomingCharacterSpotlightProps> = ({
  characters
}) => {
  const [showTeaserModal, setShowTeaserModal] = useState(false);
  const [hasCheered, setHasCheered] = useState(false);
  const [cheerCount, setCheerCount] = useState(246);

  // Find character marked as upcoming (Ngưu Thánh Anh)
  const upcomingChar =
    characters.find((c) => c.isUpcoming) ||
    characters.find((c) => c.id === 'nguu-thanh-anh') ||
    characters[0];

  if (!upcomingChar) return null;

  // Use the mirror portrait for home teaser and seated noir portrait for modal
  const homeTeaserImage =
    upcomingChar.avatarUrl || upcomingChar.coverUrl || '/assets/aistudio/IMG_0861_1e0d66ac.jpeg';
  const modalArtwork =
    upcomingChar.posterUrl || upcomingChar.synopsisImageUrl || '/assets/aistudio/IMG_0866_692df16d.jpeg';

  const novelTitle = upcomingChar.originalNovelTitle
    ? upcomingChar.originalNovelTitle.toLowerCase()
    : 'vọng niệm';

  const tagline =
    upcomingChar.tagline ||
    upcomingChar.profileData?.quote ||
    '“Nhị thiếu gia! Đại tiểu thư lại bỏ trốn rồi.”';

  const handleCheer = () => {
    if (!hasCheered) {
      setHasCheered(true);
      setCheerCount((prev) => prev + 1);
    }
  };

  const genreLabels = [
    'r21+',
    'ngụy tỷ đệ',
    'niên hạ',
    'chiếm hữu bệnh hoạn',
    'mèo vờn chuột',
    'thao túng tâm lý',
    'tâm lý vặn vẹo'
  ];

  return (
    <>
      {/* =========================================================================
          THE NOIR PREMIERE TEASER (CHARACTER SẮP RA MẮT: NGƯU THÁNH ANH)
          Cinematic Letterbox Aesthetic — Pure Noir, Clean & Restrained
      ========================================================================= */}
      <section className="mb-8 relative group">
        {/* Subtle Ambient Back-Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neutral-800/15 via-zinc-800/20 to-neutral-800/15 rounded-[12px] blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none" />

        <div className="relative rounded-[10px] bg-gradient-to-br from-[#0c0c0f] via-[#08080a] to-[#040405] border border-white/15 hover:border-white/25 transition-all duration-500 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          {/* Top Delicate Seal Ribbon (Playfair font: Sắp ra mắt · Upcoming Archive) */}
          <div className="px-4 sm:px-6 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-serif tracking-[0.24em] uppercase text-rose-300 font-medium">
                ✦ Sắp ra mắt · Upcoming Archive ✦
              </span>
            </div>
            <span className="text-[11px] font-serif text-neutral-400 italic">
              {novelTitle}
            </span>
          </div>

          {/* Main Body: Cinematic Split Display */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Left: Atmospheric Teaser Portrait with Chiaroscuro Vignette */}
            <div className="sm:col-span-5 relative">
              <div
                onClick={() => setShowTeaserModal(true)}
                className="relative aspect-[3/3.8] rounded-[6px] overflow-hidden bg-neutral-900 border border-white/10 cursor-pointer shadow-xl group/img"
              >
                <ImageWithFallback
                  src={homeTeaserImage}
                  alt={upcomingChar.name}
                  className="w-full h-full object-cover contrast-[1.08] brightness-[0.96] group-hover/img:scale-105 group-hover/img:brightness-100 transition-all duration-700 ease-out"
                />

                {/* Soft Vignette Shadows */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Watermark Crest */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/15 text-[9.5px] font-serif italic text-neutral-300">
                  {upcomingChar.code || 'T-06'}
                </div>

                {/* Hover Eye Prompt */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-black text-[10px] font-serif font-semibold tracking-wider uppercase shadow-lg transform translate-y-2 group-hover/img:translate-y-0 transition-transform">
                    <Eye className="w-3 h-3" />
                    <span>Xem hé lộ</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Literary Typography & Tagline */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-3.5 text-left">
              {/* Identity Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-serif text-neutral-400 italic">
                  <span className="lowercase">{novelTitle}</span>
                  <span>·</span>
                  <span>Hồ sơ bảo mật</span>
                </div>

                <h3 className="font-editorial italic text-2xl sm:text-3xl text-white leading-tight font-normal tracking-wide">
                  {upcomingChar.name}
                </h3>

                {upcomingChar.originalChineseName && (
                  <p className="text-[12px] font-serif text-neutral-400 italic">
                    {upcomingChar.originalChineseName}
                  </p>
                )}
              </div>

              {/* Tagline Section with Literary Dash */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-serif uppercase tracking-[0.18em] text-neutral-400">
                  <span className="text-neutral-500">—</span>
                  <span className="italic lowercase">tagline</span>
                </div>
                <div className="pl-3 border-l border-neutral-700 py-0.5">
                  <p className="font-serif italic text-xs sm:text-[13.5px] text-neutral-200 leading-relaxed font-light select-text">
                    {tagline}
                  </p>
                </div>
              </div>

              {/* Status Note & Interactive Call to Action */}
              <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[10.5px] font-serif text-neutral-400">
                  <Lock className="w-3 h-3 text-neutral-400" />
                  <span>Hồ sơ đang niêm phong</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTeaserModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white text-neutral-200 hover:text-black border border-white/20 text-[10px] font-serif font-semibold tracking-[0.16em] uppercase transition-all shadow-sm cursor-pointer active:scale-95"
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
          THE ARTISTIC NOIR DOSSIER POPUP (MUSEUM / EDITORIAL GALLERY PRESENTATION)
          Redesigned to be genuinely artistic, minimal & ultra-luxurious
      ========================================================================= */}
      {showTeaserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#09090c] border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.98)] text-neutral-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Ambient Background Velvet Glow */}
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-gradient-to-br from-rose-950/25 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-gradient-to-tr from-stone-900/30 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Top Minimal Bar */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between z-10 bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-serif tracking-[0.24em] uppercase text-rose-300 font-medium">
                  ✦ Confidential Dossier · Bản Thảo Niêm Phong ✦
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowTeaserModal(false)}
                className="w-8 h-8 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Magazine-Spread Artwork & Literary Editorial Layout */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Dual Artwork Gallery Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image 1: Seated Noir Portrait */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/15 shadow-2xl group/img1">
                  <ImageWithFallback
                    src={modalArtwork}
                    alt={upcomingChar.name}
                    className="w-full h-full object-cover contrast-[1.05] brightness-95 group-hover/img1:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-[10px] font-serif italic text-neutral-400">
                    Portrait 01 · {novelTitle}
                  </div>
                </div>

                {/* Image 2: Mirror Side Profile Portrait */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/15 shadow-2xl group/img2">
                  <ImageWithFallback
                    src={homeTeaserImage}
                    alt={upcomingChar.name}
                    className="w-full h-full object-cover contrast-[1.05] brightness-95 group-hover/img2:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-[10px] font-serif italic text-neutral-400">
                    Portrait 02 · {upcomingChar.originalChineseName || '牛圣婴'}
                  </div>
                </div>
              </div>

              {/* Core Typographic Dossier */}
              <div className="space-y-4 pt-2">
                {/* Character Name & Novel */}
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-xs font-serif italic text-neutral-400 block mb-1 lowercase">
                      {novelTitle} · dự án {upcomingChar.code || 'T-06'}
                    </span>
                    <h2 className="font-editorial italic text-3xl sm:text-4xl text-white font-normal leading-tight">
                      {upcomingChar.name}
                    </h2>
                  </div>

                  {upcomingChar.originalChineseName && (
                    <div className="text-right">
                      <span className="font-serif text-lg text-neutral-400 block tracking-widest">
                        {upcomingChar.originalChineseName}
                      </span>
                      <span className="text-[10px] font-serif text-neutral-400 uppercase tracking-wider">
                        Nhị thiếu gia
                      </span>
                    </div>
                  )}
                </div>

                {/* Tagline Section with Literary Quote Layout */}
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-serif tracking-[0.2em] uppercase text-neutral-400">
                    <Quote className="w-3 h-3 text-neutral-500" />
                    <span className="italic lowercase">tagline</span>
                  </div>
                  <p className="font-serif italic text-base sm:text-lg text-neutral-100 leading-relaxed font-light pl-2 select-text">
                    {tagline}
                  </p>
                </div>

                {/* Genre Tags Strip (Unboxed Typographic Separators) */}
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
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-black/40 backdrop-blur-md">
              <button
                type="button"
                onClick={handleCheer}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-sans font-semibold tracking-wide transition-all shadow-md cursor-pointer ${
                  hasCheered
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white hover:bg-neutral-200 text-black active:scale-95'
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
                className="px-4 py-2 text-xs font-serif text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
