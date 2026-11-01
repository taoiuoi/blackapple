import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, Minus, ArrowUpRight, Image as ImageIcon, BookOpen } from 'lucide-react';
import { Character } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface HeroCarouselProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
  isAdmin: boolean;
  onRequestChangePoster: (char: Character) => void;
}

export function HeroCarousel({
  characters,
  onSelectCharacter,
  isAdmin,
  onRequestChangePoster
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  if (!characters || characters.length === 0) return null;

  const current = characters[currentIndex] || characters[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % characters.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  return (
    <section className="relative w-full py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Editorial Kicker */}
      <div className="flex items-center justify-between mb-4 text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="font-editorial tracking-widest uppercase font-semibold text-neutral-300">
            PORTA — FOLIO
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-500">VŨ TRỤ BLACK APPLE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-[11px]">
            {currentIndex + 1} / {characters.length}
          </span>
        </div>
      </div>

      {/* Main Split Showcase Container */}
      <div className="relative bg-[#0d0d12] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[640px]">
          
          {/* Left / Center: Character Visual Focus (referencing IMG_9711_05d3cff3.jpeg) */}
          <div className="relative lg:col-span-7 bg-[#09090c] overflow-hidden flex flex-col justify-between p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-neutral-800">
            {/* Background / Main Poster Visual */}
            <div className="absolute inset-0 z-0">
              <ImageWithFallback
                src={current.posterUrl}
                alt={current.name}
                objectPosition={current.posterObjectPosition || '50% 30%'}
                priority
                className="w-full h-full"
              />
              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090c] via-transparent to-[#09090c]/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#09090c]/80 hidden lg:block" />
            </div>

            {/* Top Bar on Visual */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-xs font-serif text-neutral-300">
                #{current.code || '10-0'}
              </div>

              {isAdmin && (
                <button
                  onClick={() => onRequestChangePoster(current)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 hover:bg-black text-neutral-200 border border-neutral-700/80 rounded-lg text-xs backdrop-blur-md transition-colors shadow-lg font-serif"
                  title="Thay đổi URL poster bằng cơ chế Direct Image URL"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Thay URL Poster</span>
                </button>
              )}
            </div>

            {/* Mid Action on Visual: Next Character Pill */}
            <div className="relative z-10 flex justify-end my-12">
              <button
                onClick={handleNext}
                className="group flex items-center gap-3 bg-black/70 hover:bg-black/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 transition-all shadow-xl font-serif"
                aria-label="Nhân vật tiếp theo"
              >
                <div className="text-right">
                  <span className="block text-[10px] text-neutral-400 tracking-wider">Tiếp theo</span>
                  <span className="block text-xs font-medium text-neutral-200">
                    {characters[(currentIndex + 1) % characters.length]?.name}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* Bottom on Visual: Meta Info & Continue Reading */}
            <div className="relative z-10 flex items-center justify-between text-xs text-neutral-300 pt-4 border-t border-white/10">
              <button
                onClick={() => onSelectCharacter(current)}
                className="flex items-center gap-2 hover:text-white transition-colors group"
              >
                <span className="tracking-wide">Xem toàn bộ hồ sơ</span>
                <span className="text-neutral-500">·</span>
                <span className="font-serif text-neutral-400 group-hover:text-neutral-200">#{current.code}</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-neutral-400 hover:text-white border border-white/10"
                  aria-label="Nhân vật trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-neutral-400 hover:text-white border border-white/10"
                  aria-label="Nhân vật kế"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Stark Editorial Narrative Card (referencing IMG_9711_05d3cff3.jpeg) */}
          <div className="lg:col-span-5 bg-[#fafafa] text-neutral-900 p-8 sm:p-10 flex flex-col justify-between">
            {/* Header / Sub-code */}
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-500 pb-4 border-b border-neutral-300 font-serif">
                <span className="tracking-wider">#{current.code}</span>
                <span className="font-times italic">Hồ sơ chọn lọc</span>
              </div>

              {/* Title Pierced by Horizontal Rule */}
              <div className="my-10 relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-neutral-900/80" />
                </div>
                <div className="relative flex justify-center">
                  <h1 className="font-editorial text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 uppercase bg-[#fafafa] px-6 select-none text-center">
                    {current.name}
                  </h1>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-center text-xs sm:text-sm text-neutral-600 font-sans tracking-wide max-w-sm mx-auto italic mb-6">
                {current.tagline}
              </p>

              {/* Brief Synopsis */}
              <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans line-clamp-4 mb-6">
                {current.synopsis}
              </div>

              {/* Collapsible + NOTES Section */}
              <div className="border-t border-neutral-300 pt-4">
                <button
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-900 hover:text-neutral-700 transition-colors"
                >
                  {isNotesOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>GHI CHÚ HỒ SƠ (NOTES)</span>
                </button>

                {isNotesOpen && (
                  <div className="mt-3 p-3 bg-neutral-100 rounded-lg text-xs space-y-1.5 text-neutral-700 border border-neutral-200">
                    <p>
                      <strong>Danh phận:</strong> {current.profileData.role || 'Chưa cập nhật'}
                    </p>
                    <p>
                      <strong>Tổ chức:</strong> {current.profileData.affiliation || 'Vũ trụ Black Apple'}
                    </p>
                    <p>
                      <strong>Vũ khí / Đặc trưng:</strong> {current.profileData.weapon || 'Hắc kiếm'}
                    </p>
                    <p>
                      <strong>Trạng thái:</strong> {current.profileData.status || 'Hoạt động'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-8 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => onSelectCharacter(current)}
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Mở hồ sơ chi tiết</span>
              </button>

              <span className="text-[11px] text-neutral-500 font-editorial italic">
                & sáng tác bởi voheis
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
