import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Sparkles, QrCode } from 'lucide-react';
import { CreatorProfile } from '../../types';
import { ImageWithFallback } from './ImageWithFallback';

interface CreatorIntroPopupProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CreatorProfile;
  onDonateClick?: () => void;
}

export const CreatorIntroPopup: React.FC<CreatorIntroPopupProps> = ({
  isOpen,
  onClose,
  profile,
  onDonateClick
}) => {
  const navigate = useNavigate();
  const [showDirectQr, setShowDirectQr] = useState(false);

  if (!isOpen) return null;

  const handleVitaminClick = () => {
    if (onDonateClick) {
      onDonateClick();
    } else {
      onClose();
      navigate('/creator#donate');
    }
  };

  const penName = profile.penName || 'TAOIUOI';
  const coverSrc = profile.coverUrl || profile.introImageUrl || profile.avatarUrl;
  const avatarSrc = profile.avatarUrl || profile.introImageUrl || profile.coverUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm select-none transition-all duration-300"
    >
      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Đóng popup giới thiệu"
      />

      {/* Main Frame Container */}
      <div className="relative w-full max-w-[430px] my-auto">
        {/* Angled Graphic Wireframe Outline (Inspired by reference IMG_0656) */}
        <div
          className="absolute -inset-2 sm:-inset-2.5 border border-white/20 rounded-2xl -rotate-[2.2deg] pointer-events-none transition-transform"
          aria-hidden="true"
        />

        {/* Modal Card Body (Pure Noir Aesthetic, Anti-Lag Architecture) */}
        <div className="relative bg-[#0C0C0F] border border-white/20 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden text-white flex flex-col">
          
          {/* TOP GRAPHIC HEADER (Inspired by reference IMG_0654 & IMG_0656) */}
          <div className="px-5 pt-4.5 pb-3 border-b border-white/[0.08] flex items-start justify-between gap-3">
            <div>
              {/* East-Asian Typographic Kicker: — 創作者 (Creator) */}
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm sm:text-base tracking-[0.2em] text-white/95 font-medium">
                  — 創作者
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 font-sans">
                  ARCHIVE
                </span>
              </div>

              {/* Subtitle & Three Color Swatches from Reference IMG_0654 */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-neutral-400 font-sans">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FAF9F6] border border-white/20" title="Paper White" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#6E6E73] border border-white/10" title="Neutral Gray" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#121214] border border-white/30" title="Noir Black" />
                </div>
                <span className="text-neutral-500 font-serif">↳</span>
                <span className="tracking-wide text-neutral-300 font-serif lowercase">
                  {penName.toLowerCase()} .
                </span>
              </div>
            </div>

            {/* Right Graphic Accents: Sparkle Badge & Solid Micro Square */}
            <div className="flex items-center gap-2.5 pt-0.5">
              {/* Solid White Micro-Square accent (from IMG_0656) */}
              <span className="w-2 h-2 bg-white rounded-[1px] shadow-sm" aria-hidden="true" />
              {/* Star Sparkle in Circular Badge (from IMG_0656) */}
              <div className="w-7 h-7 rounded-full bg-[#18181D] border border-white/25 flex items-center justify-center shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-white/90" />
              </div>
            </div>
          </div>

          {/* CENTER ARTWORK / PHOTOGRAPHY FRAME (Layered Cover & Avatar Matting) */}
          <div className="relative p-5 bg-gradient-to-b from-[#141418] to-[#0C0C0F] flex flex-col items-center">
            {/* Wide Monochrome Cover Banner */}
            <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-[#18181C] border border-white/10 shadow-inner group">
              <ImageWithFallback
                src={coverSrc}
                alt={`${penName} Cover`}
                priority={true}
                targetWidth={600}
                objectPosition="center"
                className="w-full h-full object-cover grayscale contrast-[1.08] brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0F] via-black/25 to-transparent pointer-events-none" />
              
              {/* Micro Corner Guide Line Accent */}
              <div className="absolute top-2 left-2 text-[9px] tracking-widest uppercase font-mono text-white/50">
                01 // VISUAL
              </div>
            </div>

            {/* Overlapping White-Matted Central Portrait (Inspired by reference IMG_0656) */}
            <div className="relative -mt-14 z-10">
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 bg-[#EAE8E3] border-[3.5px] border-white shadow-2xl rounded-[3px] overflow-hidden group">
                <ImageWithFallback
                  src={avatarSrc}
                  alt={`${penName} Portrait`}
                  priority={true}
                  targetWidth={280}
                  objectPosition="center"
                  className="w-full h-full object-cover grayscale contrast-[1.12]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Little Floating Star Badge on Portrait Corner */}
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#0C0C0F] border border-white/30 flex items-center justify-center text-[10px] text-white shadow-lg">
                ✦
              </div>
            </div>

            {/* CREATOR FULL NAME & BRAND TITLE (Clean Typography, No long captions) */}
            <div className="mt-3.5 text-center space-y-1">
              <h2
                id="creator-popup-title"
                className="font-editorial text-2xl sm:text-3xl text-white tracking-wide"
              >
                {penName}
              </h2>
              <div className="text-[11px] sm:text-xs text-neutral-400 font-sans tracking-wide">
                Tác giả &amp; Nhà sáng lập BLACK APPLE
              </div>
            </div>

            {/* Optional Flip-to-QR View inside Popup for Instant MoMo Scan */}
            {showDirectQr && (
              <div className="mt-4 p-4 rounded-xl bg-[#14141A] border border-white/20 flex flex-col items-center gap-2 animate-fadeIn">
                <div className="w-40 h-40 bg-white p-2.5 rounded-lg flex items-center justify-center">
                  <ImageWithFallback
                    src={profile.donateQrUrl}
                    alt="Mã QR MoMo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-sans">
                  Quét nhanh mã MoMo hoặc chuyển khoản ủng hộ Tác giả
                </span>
                <button
                  type="button"
                  onClick={() => setShowDirectQr(false)}
                  className="text-[10px] text-neutral-400 hover:text-white underline underline-offset-2"
                >
                  Thu gọn mã QR
                </button>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS BAR: BÊN TRÁI "góp chút vitamin" - BÊN PHẢI "đóng" */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#09090C] flex items-center justify-between gap-3">
            {/* NÚT BÊN TRÁI: "góp chút vitamin" (Dẫn thẳng tới chỗ mã QR donate) */}
            <button
              type="button"
              onClick={handleVitaminClick}
              className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-white hover:bg-neutral-200 text-[#0C0C0F] text-xs sm:text-[13px] font-semibold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              <Heart className="w-3.5 h-3.5 text-[#8B0000] fill-[#8B0000] shrink-0" />
              <span>góp chút vitamin</span>
            </button>

            {/* NÚT BÊN PHẢI: "đóng" (Đóng popup để trải nghiệm trang chủ mượt mà) */}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 sm:px-6 rounded-xl border border-white/20 hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.09] text-neutral-300 hover:text-white text-xs sm:text-[13px] font-medium tracking-wide transition-all active:scale-[0.98] cursor-pointer shrink-0"
            >
              <span>đóng</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
