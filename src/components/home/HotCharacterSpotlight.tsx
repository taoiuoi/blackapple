import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Check, ArrowUpRight } from 'lucide-react';
import { Character, WebsiteSettings } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { saveHotCharacterSpotlight } from '../../services/firestoreService';
import { getCharacterPath } from '../../utils/slugify';

interface HotCharacterSpotlightProps {
  characters: Character[];
  settings: WebsiteSettings;
  isAdmin: boolean;
  onRoleplayClick?: (character: Character) => void;
  onSettingsUpdated?: (updatedSettings: WebsiteSettings) => void;
}

export const HotCharacterSpotlight: React.FC<HotCharacterSpotlightProps> = ({
  characters,
  settings,
  isAdmin,
  onSettingsUpdated
}) => {
  const navigate = useNavigate();

  // Find honored character: settings.hotCharacterId or fallback to Phan Quý Mẫn / first character
  const targetId = settings.hotCharacterId || 'phan-quy-man';
  const honoredChar = characters.find((c) => c.id === targetId) || characters[0];

  // Admin tuning state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState(targetId);
  const [awardTitleInput, setAwardTitleInput] = useState(
    settings.hotCharacterAwardTitle || 'HONORARY SPOTLIGHT'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!honoredChar) return null;

  const handleSaveSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveHotCharacterSpotlight(selectedCharId, awardTitleInput, '');
      if (onSettingsUpdated) {
        onSettingsUpdated({
          ...settings,
          hotCharacterId: selectedCharId,
          hotCharacterAwardTitle: awardTitleInput
        });
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsAdminModalOpen(false);
      }, 900);
    } catch (err) {
      console.error('Failed to save hot character spotlight:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const portraitImage = honoredChar.posterUrl || honoredChar.avatarUrl || honoredChar.coverUrl;
  const originalWork = honoredChar.originalNovelTitle
    ? honoredChar.originalNovelTitle.replace(/^@/, '').toLowerCase()
    : 'black apple canon';

  const rawDigits = (honoredChar.code || '01').replace(/\D/g, '');
  const codeNumber = rawDigits ? rawDigits.padStart(2, '0') : '01';

  return (
    <section className="relative w-full max-w-[315px] sm:max-w-[375px] mx-auto px-5 sm:px-0 my-8 sm:my-14 select-none">
      {/* =========================================================================
          SECTION HEADER
      ========================================================================= */}
      <div className="flex items-end justify-between pb-2.5 border-b border-white/[0.08] mb-4 sm:mb-5 px-0.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[8px] sm:text-[8.5px] tracking-[0.2em] uppercase font-sans text-neutral-400">
            <span className="font-serif text-neutral-300">— 桂冠焦點</span>
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span className="text-neutral-200 font-medium">LAUREL OF THE WEEK</span>
          </div>
          <h2 className="font-editorial italic text-base sm:text-xl text-white tracking-wide">
            Character Hot Trong Tuần
          </h2>
        </div>

        {/* Admin Quick Setup Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setSelectedCharId(settings.hotCharacterId || honoredChar.id);
              setAwardTitleInput(settings.hotCharacterAwardTitle || 'HONORARY SPOTLIGHT');
              setIsAdminModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/20 text-neutral-200 text-[9.5px] font-medium flex items-center gap-1 transition-all cursor-pointer"
            title="Quản trị viên: Đổi nhân vật được tôn vinh"
          >
            <Settings className="w-3 h-3 text-neutral-300" />
            <span className="hidden sm:inline">Thiết lập</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          BESPOKE NOIR MONOGRAPH SHOWCASE (Compact Gallery Proportion)
      ========================================================================= */}
      <div
        onClick={() => navigate(getCharacterPath(honoredChar))}
        className="group relative w-full rounded-[10px] bg-[#08080B] border border-white/[0.14] hover:border-white/[0.28] shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden cursor-pointer transition-all duration-700 p-3.5 sm:p-5"
        title={`Xem hồ sơ nhân vật ${honoredChar.name}`}
      >
        {/* 1. ARCHITECTURAL BACKGROUND ORBIT & WATERMARK NUMERAL */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border border-white/[0.05]" />
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border border-dashed border-white/[0.05]" />
          <div className="absolute -left-20 -bottom-20 w-56 h-56 rounded-full border border-white/[0.04]" />

          <div className="absolute top-4 right-4 font-editorial italic text-[72px] sm:text-[95px] leading-none text-white/[0.04] select-none">
            {codeNumber}
          </div>
        </div>

        {/* 2. TOP MONOGRAPH MASTHEAD STRIP */}
        <div className="relative z-20 flex items-center justify-between text-[7.5px] sm:text-[8.5px] font-serif tracking-[0.22em] uppercase text-neutral-400 mb-4 sm:mb-5">
          <span className="text-white/90 font-medium">N° {codeNumber} // MONOGRAPH</span>
          <div className="flex-1 h-[1px] bg-white/[0.12] mx-2.5" />
          <span>BLACK APPLE</span>
        </div>

        {/* 3. LAYERED EDITORIAL COLLAGE */}
        <div className="relative z-10 w-full pt-1 pb-9 sm:pb-11">
          <div className="relative w-[80%] sm:w-[76%] aspect-[4/4.5]">
            <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-[4px] border border-white/[0.16] bg-white/[0.01] pointer-events-none" />

            <div className="relative w-full h-full rounded-[4px] overflow-hidden bg-[#121217] border border-white/25 shadow-[0_18px_45px_rgba(0,0,0,0.9)]">
              <ImageWithFallback
                src={portraitImage}
                alt={honoredChar.name}
                priority={true}
                targetWidth={800}
                objectPosition={honoredChar.posterObjectPosition || '50% 20%'}
                className="w-full h-full object-cover grayscale contrast-[1.14] brightness-95 group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

              <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/50 pointer-events-none" />
              <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/50 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-white/50 pointer-events-none" />
            </div>
          </div>

          {/* RIGHT VERTICAL EDITORIAL SPINE */}
          <div className="absolute top-4 right-0 bottom-16 flex flex-col items-center justify-between py-1 pointer-events-none">
            <span className="text-[7.5px] font-serif text-white/60">I</span>
            <div className="w-[1px] flex-1 bg-white/[0.12] my-2" />
            <span className="text-[7px] sm:text-[7.5px] font-serif tracking-[0.26em] uppercase text-neutral-400 [writing-mode:vertical-rl]">
              {settings.hotCharacterAwardTitle || 'HONORARY SPOTLIGHT'}
            </span>
            <div className="w-[1px] flex-1 bg-white/[0.12] my-2" />
            <span className="text-[7.5px] font-serif text-white/60">✦</span>
          </div>

          {/* OVERLAPPING BOTTOM-RIGHT NAMEPLATE PLAQUE */}
          <div className="absolute bottom-0 right-0 w-[78%] sm:w-[74%] z-20 bg-[#0D0D12]/95 backdrop-blur-md border border-white/25 rounded-[4px] p-2.5 sm:p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:-translate-y-1">
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-sans tracking-[0.2em] uppercase text-neutral-400 pb-1.5 mb-1.5 border-b border-white/[0.1]">
              <span className="truncate pr-2 lowercase">{originalWork}</span>
              <span className="text-white font-serif shrink-0">
                {honoredChar.originalChineseName || `#${codeNumber}`}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-[6.5px] sm:text-[7px] font-mono tracking-[0.22em] uppercase text-neutral-500 mb-0.5">
                  FEATURED MUSE
                </div>
                <h3 className="font-editorial italic text-base sm:text-xl text-white tracking-wide leading-none">
                  {honoredChar.name}
                </h3>
              </div>

              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/20 flex items-center justify-center text-white/70 group-hover:text-white group-hover:border-white/50 transition-colors shrink-0">
                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM ARCHIVE FOOTNOTE BAR */}
        <div className="relative z-20 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[7.5px] sm:text-[8px] font-sans tracking-[0.22em] uppercase text-neutral-500">
          <span>CURATED SELECTION</span>
          <span className="text-neutral-300">— ARCHIVE {codeNumber} —</span>
          <span>2026</span>
        </div>
      </div>

      {/* =============================================================
          ADMIN MODAL (Đen trắng đồng bộ)
      ============================================================= */}
      {isAdmin && isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0D0D11] border border-white/20 p-6 sm:p-7 shadow-2xl text-neutral-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-editorial text-xl text-white tracking-wide">
                Thiết Lập Nhân Vật Hot Trong Tuần
              </h3>
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpotlight} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
                  Chọn nhân vật được tôn vinh
                </label>
                <select
                  value={selectedCharId}
                  onChange={(e) => setSelectedCharId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/70 border border-white/20 text-white focus:outline-none focus:border-white/50 font-sans"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0D0D11] text-white">
                      {c.name} ({c.code}) {c.originalChineseName ? `— ${c.originalChineseName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
                  Danh hiệu tôn vinh
                </label>
                <input
                  type="text"
                  required
                  value={awardTitleInput}
                  onChange={(e) => setAwardTitleInput(e.target.value)}
                  placeholder="VD: HONORARY SPOTLIGHT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/70 border border-white/20 text-white focus:outline-none focus:border-white/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/15 text-neutral-400 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã lưu!</span>
                    </>
                  ) : (
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
