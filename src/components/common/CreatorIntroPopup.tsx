import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { CreatorProfile } from '../../types';
import { ImageWithFallback } from './ImageWithFallback';

interface CreatorIntroPopupProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CreatorProfile;
  onDonateClick?: () => void;
  isEntranceGate?: boolean;
}

export const CreatorIntroPopup: React.FC<CreatorIntroPopupProps> = ({
  isOpen,
  onClose,
  profile,
  onDonateClick,
  isEntranceGate = false
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none bg-black/85 transition-all duration-500"
    >
      <style>{`
        @keyframes baCreatorPopupIn {
          0% {
            opacity: 0;
            transform: scale(0.94) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {/* Click outside to close (or tap outside to enter home) */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Đóng popup giới thiệu"
      />

      {/* Main Frame Container */}
      <div
        className="relative w-full max-w-[430px] my-auto"
        style={{
          animation: 'baCreatorPopupIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both'
        }}
      >
        {/* Optical Specular Outline Ring */}
        <div
          className="absolute -inset-2 sm:-inset-2.5 border border-white/15 rounded-[32px] -rotate-[1.5deg] pointer-events-none transition-transform opacity-75"
          aria-hidden="true"
        />

        {/* Modal Card Body (Optical Specular Lens Panel) */}
        <div className="relative lens-crystal-panel rounded-[28px] overflow-hidden text-white flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95)]">
          
          {/* TOP GRAPHIC HEADER */}
          <div className="px-5 pt-4.5 pb-3 border-b border-white/[0.1] flex items-start justify-between gap-3">
            <div>
              {/* East-Asian Typographic Kicker: — 創作者 (Creator) */}
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm sm:text-base tracking-[0.2em] text-white/95 font-medium">
                  — 創作者
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-300 font-serif">
                  ARCHIVE
                </span>
              </div>

              {/* Subtitle & Three Color Swatches */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-neutral-400 font-sans">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FAF9F6] border border-white/40" title="Paper White" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#6E6E73] border border-white/20" title="Neutral Gray" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#121214] border border-white/50" title="Noir Black" />
                </div>
                <span className="text-neutral-400 font-serif">↳</span>
                <span className="tracking-wide text-neutral-300 font-serif lowercase">
                  {penName.toLowerCase()} .
                </span>
              </div>
            </div>

            {/* Right Graphic Accents: Sparkle Badge & Solid Micro Square */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <span className="w-2 h-2 bg-white rounded-[1px] shadow-[0_0_6px_rgba(255,255,255,0.8)]" aria-hidden="true" />
              <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* CENTER ARTWORK / PHOTOGRAPHY FRAME */}
          <div className="relative p-5 flex flex-col items-center">
            {/* Wide Monochrome Cover Banner */}
            <div className="relative w-full h-32 sm:h-36 rounded-[18px] overflow-hidden bg-[#18181C] border border-white/15 shadow-inner group">
              <ImageWithFallback
                src={coverSrc}
                alt={`${penName} Cover`}
                priority={true}
                targetWidth={600}
                objectPosition="center"
                className="w-full h-full object-cover grayscale contrast-[1.08] brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              {/* Micro Corner Guide Line Accent */}
              <div className="absolute top-2.5 left-3 text-[9px] tracking-widest uppercase font-serif text-white/70">
                01 // VISUAL
              </div>
            </div>

            {/* Overlapping White-Matted Central Portrait */}
            <div className="relative -mt-14 z-10">
              <div className="relative w-24 h-28 sm:w-28 sm:h-32 bg-[#EAE8E3] border-[3.5px] border-white shadow-[0_16px_35px_rgba(0,0,0,0.9)] rounded-[8px] overflow-hidden group">
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

              {/* Floating Star Badge on Portrait Corner */}
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-black/90 border border-white/40 flex items-center justify-center text-[10px] text-white shadow-lg">
                ✦
              </div>
            </div>

            {/* CREATOR FULL NAME & BRAND TITLE */}
            <div className="mt-3.5 text-center space-y-1">
              <h2
                id="creator-popup-title"
                className="font-editorial text-2xl sm:text-3xl text-white tracking-wide"
              >
                {penName}
              </h2>
              <div className="text-[11px] sm:text-xs text-neutral-300 font-serif tracking-wider">
                Tác giả &amp; Nhà sáng lập BLACK APPLE
              </div>
            </div>

            {/* Optional Flip-to-QR View inside Popup for Instant MoMo Scan */}
            {showDirectQr && (
              <div className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/20 flex flex-col items-center gap-2 animate-fadeIn shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                <div className="w-40 h-40 bg-white p-2.5 rounded-xl flex items-center justify-center shadow-lg">
                  <ImageWithFallback
                    src={profile.donateQrUrl}
                    alt="Mã QR MoMo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-neutral-300 font-serif">
                  Quét nhanh mã MoMo hoặc chuyển khoản ủng hộ Tác giả
                </span>
                <button
                  type="button"
                  onClick={() => setShowDirectQr(false)}
                  className="text-[10px] text-neutral-400 hover:text-white underline underline-offset-2 font-serif"
                >
                  Thu gọn mã QR
                </button>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS BAR: Optical Capsule Pills (Like IMG_1068) */}
          <div className="p-4 sm:p-5 border-t border-white/[0.1] bg-black/40 flex items-center justify-between gap-3">
            {/* NÚT BÊN TRÁI: "góp chút vitamin" */}
            <button
              type="button"
              onClick={handleVitaminClick}
              className="flex-1 py-3 px-4 rounded-full bg-white hover:bg-neutral-100 text-black text-xs font-serif font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.4)]"
            >
              <Heart className="w-3.5 h-3.5 text-[#8B0000] fill-[#8B0000] shrink-0" />
              <span>góp chút vitamin</span>
            </button>

            {/* NÚT BÊN PHẢI: "đóng" */}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 rounded-full border border-white/20 hover:border-white/40 bg-white/[0.05] hover:bg-white/[0.12] text-neutral-200 hover:text-white text-xs font-serif font-medium tracking-[0.16em] uppercase transition-all active:scale-[0.98] cursor-pointer shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
            >
              <span>đóng</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
