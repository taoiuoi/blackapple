import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Edit3,
  Image as ImageIcon,
  ArrowUpRight,
  Sparkles,
  Globe,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Character, CreatorProfile, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

interface CreatorPageProps {
  profile: CreatorProfile;
  characters?: Character[];
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onRequestChangeImage: (
    field: 'avatarUrl' | 'coverUrl' | 'introImageUrl' | 'donateQrUrl'
  ) => void;
  onRequestChangeCharacterImage?: (
    char: Character,
    field: 'avatarUrl' | 'coverUrl' | 'posterUrl' | 'synopsisImageUrl'
  ) => void;
}

export function CreatorPage({
  profile,
  characters = [],
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  onRequestChangeImage,
  onRequestChangeCharacterImage
}: CreatorPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141416] font-content flex flex-col selection:bg-[#141416] selection:text-white">
      {/* Top Global Navbar */}
      <Navbar
        settings={settings}
        onOpenAdmin={onOpenAdmin}
        isAdmin={isAdmin}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-10 pt-8 sm:pt-12 pb-28 space-y-16">
        {/* 1. CREATOR COVER BANNER & OVERLAPPING AVATAR HEADER (White Editorial Theme) */}
        <section className="relative bg-white rounded-[28px] sm:rounded-[36px] border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Top Micro-Coordinate Bar inside Frame */}
          <div className="px-6 sm:px-10 py-3.5 border-b border-black/[0.06] flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-neutral-500">
            <span>CREATOR ARCHIVE // TAOIUOI</span>
            <span className="hidden sm:inline">♦ BLACK APPLE UNIVERSE ♦</span>
            <span>EST. 2026</span>
          </div>

          {/* Wide Cover Image Banner */}
          <div className="relative h-52 sm:h-72 md:h-80 w-full bg-[#EAE8E3] overflow-hidden group">
            <ImageWithFallback
              src={profile.coverUrl || profile.introImageUrl || profile.avatarUrl}
              alt={`${profile.penName} Cover`}
              priority={true}
              targetWidth={1200}
              objectPosition="center"
              className="w-full h-full object-cover grayscale contrast-[1.03] brightness-105 group-hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

            {/* Admin Change Cover Button */}
            {isAdmin && (
              <button
                onClick={() => onRequestChangeImage('coverUrl')}
                className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#141416] text-[11px] font-medium tracking-wider uppercase shadow-md flex items-center gap-1.5 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Đổi Ảnh bìa</span>
              </button>
            )}
          </div>

          {/* Overlapping Avatar + Creator Identity Strip */}
          <div className="px-6 sm:px-12 pb-8 sm:pb-10 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-14 sm:-mt-20 relative z-10">
              {/* Left: Circular/Rounded Avatar + Pen Name */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[5px] border-white bg-[#F2F0EB] shadow-xl overflow-hidden shrink-0 group">
                  <ImageWithFallback
                    src={profile.avatarUrl}
                    alt={profile.penName}
                    priority={true}
                    targetWidth={320}
                    objectPosition="center"
                    className="w-full h-full object-cover grayscale contrast-[1.05] group-hover:grayscale-0 transition-all duration-700"
                  />
                  {isAdmin && (
                    <button
                      onClick={() => onRequestChangeImage('avatarUrl')}
                      className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white uppercase tracking-wider font-medium transition-opacity"
                    >
                      <ImageIcon className="w-4 h-4 mb-1" />
                      <span>Đổi Avatar</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 sm:pb-1">
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-[#7F1D1D] font-semibold">
                    <span>♦</span>
                    <span>Creator Roleplay AI</span>
                  </div>
                  <h1 className="font-editorial text-3xl sm:text-5xl text-[#141416] tracking-tight mt-0.5">
                    {profile.penName}
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Lưu trữ nguyên tác, thiết kế nhân vật & mỹ học thị giác BLACK APPLE
                  </p>
                </div>
              </div>

              {/* Right: Social Pills & Admin Edit */}
              <div className="flex flex-wrap items-center gap-2 sm:pb-2">
                {profile.facebookUrl && (
                  <a
                    href={profile.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 rounded-full border border-black/15 hover:border-black bg-white hover:bg-[#141416] text-[#141416] hover:text-white text-xs transition-all"
                  >
                    Facebook
                  </a>
                )}
                {profile.discordUrl && (
                  <a
                    href={profile.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 rounded-full border border-black/15 hover:border-black bg-white hover:bg-[#141416] text-[#141416] hover:text-white text-xs transition-all"
                  >
                    Discord
                  </a>
                )}
                {profile.instagramUrl && (
                  <a
                    href={profile.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 rounded-full border border-black/15 hover:border-black bg-white hover:bg-[#141416] text-[#141416] hover:text-white text-xs transition-all"
                  >
                    Instagram
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="px-4 py-1.5 rounded-full border border-black/15 hover:border-black bg-white hover:bg-[#141416] text-[#141416] hover:text-white text-xs transition-all"
                  >
                    Email
                  </a>
                )}
                {(profile.socialLinks || []).map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 rounded-full border border-black/15 hover:border-black bg-white hover:bg-[#141416] text-[#141416] hover:text-white text-xs transition-all"
                  >
                    {link.platform}
                  </a>
                ))}
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin?tab=creator')}
                    className="px-4 py-1.5 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa Hồ sơ & MXH</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. POETIC WHITE ATELIER BIO & DONATE SECTION (Inspired by Reference Aesthetic) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 7 Cols: Poetic Editorial Monolith Card */}
          <div className="lg:col-span-7 bg-white rounded-[28px] border border-black/[0.08] p-8 sm:p-12 shadow-[0_15px_50px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
            {/* Subtle Top Corner Metadata */}
            <div className="flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-neutral-400">
              <span>PARA LA CREACIÓN</span>
              <span>♦</span>
              <span>BLACK APPLE STUDIO</span>
            </div>

            {/* Center Poetic Quote & Bio */}
            <div className="my-10 text-center px-2 sm:px-8 space-y-6">
              <div className="flex items-center justify-center gap-10 text-[10px] tracking-[0.26em] uppercase text-neutral-400">
                <span>MY</span>
                <span>UNIVERSE</span>
              </div>

              {profile.quote && (
                <blockquote className="font-editorial italic text-2xl sm:text-3xl text-[#7F1D1D] leading-snug max-w-lg mx-auto">
                  “{profile.quote}”
                </blockquote>
              )}

              <div className="text-neutral-400 tracking-[0.3em] text-xs">•••</div>

              <div className="text-xs sm:text-[13px] text-neutral-600 leading-[1.9] whitespace-pre-line max-w-md mx-auto font-serif">
                {profile.bio}
              </div>
            </div>

            {/* Bottom Ornamental Signature */}
            <div className="pt-6 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
              <span className="font-editorial italic text-base text-[#141416]">
                By {profile.penName}.
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase">
                @{profile.penName.toLowerCase().replace(/\s+/g, '')}
              </span>
            </div>
          </div>

          {/* Right 5 Cols: Donate QR & Intro Art Card */}
          <div className="lg:col-span-5 bg-white rounded-[28px] border border-black/[0.08] p-8 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-6">
                <span>PATRONAGE // ỦNG HỘ</span>
                <Heart className="w-3.5 h-3.5 text-[#7F1D1D] fill-[#7F1D1D]" />
              </div>

              <h2 className="font-editorial italic text-2xl text-[#141416] mb-2">
                Đồng hành cùng Tác giả
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                {profile.supportText ||
                  'Mọi sự ủng hộ giúp duy trì việc phát hành các chương truyện, hồ sơ nhân vật và artwork độc quyền.'}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-48 h-48 p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/10 shadow-inner flex items-center justify-center">
                <ImageWithFallback
                  src={profile.donateQrUrl}
                  alt="Mã QR Ủng hộ"
                  className="w-full h-full object-contain"
                />
              </div>

              {isAdmin && (
                <button
                  onClick={() => onRequestChangeImage('donateQrUrl')}
                  className="mt-3 text-[11px] text-neutral-500 hover:text-[#141416] underline underline-offset-4"
                >
                  Thay đổi ảnh mã QR ủng hộ
                </button>
              )}
            </div>

            <div className="pt-5 border-t border-black/[0.06] flex flex-col items-center gap-2.5">
              <Link
                to="/commission"
                className="w-full py-2.5 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-center text-[11px] tracking-[0.16em] uppercase font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Đặt Commission Roleplay AI</span>
              </Link>
              <Link
                to="/confessions"
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase font-medium text-neutral-500 hover:text-[#7F1D1D] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Gửi Confession / Lời nhắn tới {profile.penName}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 3. CREATOR'S CHARACTER ARCHIVE PREVIEW (White Poetic Arch Cards) */}
        {characters.length > 0 && (
          <section className="pt-6 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <span className="text-[10px] tracking-[0.24em] uppercase text-[#7F1D1D] font-semibold block mb-1">
                  ♦ DANH MỤC SÁNG TÁC NGUYÊN BẢN
                </span>
                <h2 className="font-editorial text-2xl sm:text-4xl text-[#141416]">
                  Nhân vật thuộc Vũ trụ {profile.penName}
                </h2>
              </div>
              <Link
                to="/characters"
                className="self-start sm:self-auto px-5 py-2 rounded-full bg-[#141416] text-white text-[11px] tracking-[0.16em] uppercase font-medium hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                <span>Xem toàn bộ danh sách</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {characters.slice(0, 3).map((char) => (
                <Link
                  key={char.id}
                  to={`/character/${char.id}`}
                  className="group bg-white rounded-t-[90px] rounded-b-[24px] border border-black/[0.08] shadow-[0_16px_45px_rgba(0,0,0,0.05)] hover:shadow-[0_24px_65px_rgba(0,0,0,0.11)] transition-all duration-500 overflow-hidden flex flex-col justify-between pt-8"
                >
                  {/* Top Micro Ornaments */}
                  <div className="px-6 text-center space-y-4">
                    <span className="text-[9px] tracking-[0.26em] uppercase text-neutral-400 block">
                      FOR ARCHIVE // {char.code}
                    </span>
                    <div className="text-neutral-300 text-xs">♦</div>
                    <div>
                      <span className="text-[9px] tracking-[0.22em] uppercase text-neutral-400 block mb-1">
                        {char.originalNovelTitle || 'BLACK APPLE'}
                      </span>
                      <h3 className="font-editorial italic text-2xl text-[#7F1D1D] group-hover:text-[#141416] transition-colors">
                        {char.name}
                      </h3>
                      <div className="text-neutral-400 text-[10px] tracking-[0.25em] mt-1">
                        •••
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2 max-w-[210px] mx-auto font-serif">
                      {char.tagline}
                    </p>
                  </div>

                  {/* Bottom Feathered Monochrome Portrait */}
                  <div className="relative mt-6 aspect-[4/5] w-full overflow-hidden bg-[#F5F4F0]">
                    <ImageWithFallback
                      src={char.posterUrl || char.avatarUrl || char.coverUrl}
                      alt={char.name}
                      objectPosition={char.posterObjectPosition || '50% 20%'}
                      className="w-full h-full object-cover object-top grayscale contrast-[1.03] brightness-105 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                    {/* Top White Mist Fade so Portrait Emerges from White Paper */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/60 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 via-white/40 to-transparent pointer-events-none" />

                    <div className="absolute bottom-3 inset-x-0 text-center">
                      <span className="font-editorial italic text-sm text-[#141416] block">
                        {char.name}.
                      </span>
                      <span className="text-[9px] tracking-[0.18em] uppercase text-neutral-500">
                        @{char.code.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer settings={settings} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
