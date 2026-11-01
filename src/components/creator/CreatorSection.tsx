import { useState } from 'react';
import { Heart, QrCode, ExternalLink, Edit3, Image as ImageIcon, Check } from 'lucide-react';
import { CreatorProfile } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CreatorSectionProps {
  profile: CreatorProfile;
  isAdmin: boolean;
  onEditProfile: () => void;
  onRequestChangeImage: (field: 'avatarUrl' | 'coverUrl' | 'introImageUrl' | 'donateQrUrl') => void;
}

export function CreatorSection({
  profile,
  isAdmin,
  onEditProfile,
  onRequestChangeImage
}: CreatorSectionProps) {
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  return (
    <section id="creator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
        <div>
          <span className="text-xs text-neutral-500 uppercase tracking-widest block mb-1">
            Hồ sơ tác giả / Creator Profile
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-100">
            Không gian Sáng tác & Tác giả
          </h2>
        </div>

        {isAdmin && (
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa thông tin tác giả</span>
          </button>
        )}
      </div>

      {/* Creator Card */}
      <div className="bg-[#0e0e13] border border-neutral-800/90 rounded-2xl overflow-hidden shadow-2xl">
        {/* Cover with optional Admin Change */}
        <div className="relative h-48 sm:h-64 bg-neutral-950 overflow-hidden">
          <ImageWithFallback
            src={profile.coverUrl}
            alt="Ảnh bìa tác giả"
            className="w-full h-full"
            objectPosition="center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/30 to-transparent" />

          {isAdmin && (
            <button
              onClick={() => onRequestChangeImage('coverUrl')}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/80 hover:bg-black text-neutral-200 border border-neutral-700 rounded-lg text-xs backdrop-blur-md"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Thay URL ảnh bìa</span>
            </button>
          )}

          {/* Avatar overlap */}
          <div className="absolute -bottom-10 left-6 sm:left-10 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-2 border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl group">
            <ImageWithFallback
              src={profile.avatarUrl}
              alt={profile.penName}
              className="w-full h-full"
            />
            {isAdmin && (
              <button
                onClick={() => onRequestChangeImage('avatarUrl')}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white transition-opacity"
              >
                <span>Đổi URL Avatar</span>
              </button>
            )}
          </div>
        </div>

        {/* Details Area */}
        <div className="pt-14 p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-neutral-100">
                {profile.penName}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">Tác giả & Họa sĩ vũ trụ BLACK APPLE</p>
            </div>

            {/* Support / Donate Action */}
            <button
              onClick={() => setIsDonateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-200 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold tracking-wide transition-all shadow self-start sm:self-auto"
            >
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <span>Ủng hộ tác giả (Donate QR)</span>
            </button>
          </div>

          {/* Quote */}
          {profile.quote && (
            <div className="p-4 bg-neutral-900/60 border-l-2 border-neutral-300 rounded-r-xl">
              <p className="font-editorial italic text-base sm:text-lg text-neutral-200 leading-relaxed">
                "{profile.quote}"
              </p>
            </div>
          )}

          {/* Bio */}
          <p className="text-sm text-neutral-300 leading-relaxed font-sans max-w-4xl whitespace-pre-line">
            {profile.bio}
          </p>

          {/* Social Links & Connections */}
          <div className="pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-4 text-xs">
            <span className="text-neutral-500 font-medium">Kết nối trực tiếp:</span>
            {profile.facebookUrl && (
              <a
                href={profile.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Facebook</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>
            )}
            {profile.discordUrl && (
              <a
                href={profile.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Discord</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>
            )}
            {profile.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Instagram</span>
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </a>
            )}
            {profile.email && (
              <span className="text-neutral-400">
                Email liên hệ: <span className="text-neutral-200 font-serif">{profile.email}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Donate Modal with QR Code direct URL */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#101015] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <h3 className="text-sm font-bold text-white">Ủng hộ tác giả {profile.penName}</h3>
              </div>
              <button
                onClick={() => setIsDonateModalOpen(false)}
                className="text-neutral-400 hover:text-white"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed font-sans">
              {profile.supportText || 'Cảm ơn bạn đã đồng hành và tiếp lửa cho vũ trụ BLACK APPLE.'}
            </p>

            {/* QR Code Container (Loaded via direct URL stored in Firestore) */}
            <div className="w-56 h-56 mx-auto p-3 bg-white rounded-xl shadow-inner flex items-center justify-center border border-neutral-300 mb-4">
              <ImageWithFallback
                src={profile.donateQrUrl}
                alt="QR Code ủng hộ"
                className="w-full h-full object-contain"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setIsDonateModalOpen(false);
                  onRequestChangeImage('donateQrUrl');
                }}
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white mb-4 underline decoration-neutral-600"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Thay URL mã QR (Direct URL)</span>
              </button>
            )}

            <div className="pt-3 border-t border-neutral-800">
              <button
                onClick={() => setIsDonateModalOpen(false)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
