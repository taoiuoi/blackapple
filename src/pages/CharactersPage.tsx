import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Image as ImageIcon, X, Tag } from 'lucide-react';
import { Character, Genre, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { saveGenre, deleteGenre } from '../services/firestoreService';

interface CharactersPageProps {
  characters: Character[];
  genres: Genre[];
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onRequestChangeCharacterImage: (
    char: Character,
    field: 'avatarUrl' | 'coverUrl' | 'posterUrl' | 'synopsisImageUrl'
  ) => void;
}

export function CharactersPage({
  characters,
  genres,
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  onRequestChangeCharacterImage
}: CharactersPageProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingGenreQuick, setIsAddingGenreQuick] = useState(false);
  const [quickGenreName, setQuickGenreName] = useState('');

  const handleQuickAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGenreName.trim()) return;
    const id =
      quickGenreName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `genre-${Date.now()}`;
    await saveGenre({
      id,
      name: quickGenreName.trim(),
      description: '',
      order: genres.length + 1
    });
    setQuickGenreName('');
    setIsAddingGenreQuick(false);
  };

  const handleDeleteGenreTag = async (genreId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedGenre === genreId) {
      setSelectedGenre('all');
    }
    await deleteGenre(genreId);
  };

  const filtered = characters.filter((char) => {
    const matchesGenre =
      selectedGenre === 'all' || (char.genreIds && char.genreIds.includes(selectedGenre));
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      char.name.toLowerCase().includes(query) ||
      char.code.toLowerCase().includes(query) ||
      (char.tagline && char.tagline.toLowerCase().includes(query)) ||
      (char.originalNovelTitle && char.originalNovelTitle.toLowerCase().includes(query));
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141416] font-content flex flex-col selection:bg-[#141416] selection:text-white">
      {/* Global Top Navbar */}
      <Navbar
        settings={settings}
        onOpenAdmin={onOpenAdmin}
        isAdmin={isAdmin}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-10 pt-10 sm:pt-14 pb-28 space-y-14">
        {/* 1. WHITE EDITORIAL HEADER */}
        <header className="bg-white rounded-[28px] border border-black/[0.08] p-6 sm:p-10 shadow-[0_15px_45px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-neutral-400 pb-6 border-b border-black/[0.06]">
            <span>FOR ARCHIVE COLLECTION</span>
            <span>♦</span>
            <span>BLACK APPLE UNIVERSE</span>
          </div>

          <div className="py-8 text-center max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-8 text-[10px] tracking-[0.28em] uppercase text-neutral-400">
              <span>DANH MỤC</span>
              <span>NHÂN VẬT</span>
            </div>

            <h1 className="font-editorial italic text-3xl sm:text-5xl text-[#7F1D1D] tracking-tight">
              Toàn bộ Hồ sơ Nhân vật
            </h1>

            <div className="text-neutral-400 tracking-[0.3em] text-xs">•••</div>

            <p className="text-xs text-neutral-500 leading-relaxed font-serif max-w-md mx-auto">
              Tuyển tập những linh hồn trung tâm trong vũ trụ sáng tác BLACK APPLE — nơi lưu giữ văn án, thiết kế thị giác và liên kết tương tác độc lập.
            </p>
          </div>

          {/* Filter & Search Bar on Crisp White */}
          <div className="pt-6 border-t border-black/[0.06] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Genre Pills + Admin Quick Genre Add/Delete */}
            <div className="flex flex-wrap items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => setSelectedGenre('all')}
                className={`px-4 py-1.5 rounded-full text-xs tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedGenre === 'all'
                    ? 'bg-[#141416] text-white font-medium shadow-sm'
                    : 'bg-[#F3F2EE] text-neutral-600 hover:text-[#141416]'
                }`}
              >
                Tất cả ({characters.length})
              </button>

              {genres.map((g) => {
                const count = characters.filter(
                  (c) => c.genreIds && c.genreIds.includes(g.id)
                ).length;
                const isSelected = selectedGenre === g.id;
                return (
                  <div
                    key={g.id}
                    className={`inline-flex items-center rounded-full text-xs tracking-wider transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#141416] text-white font-medium shadow-sm'
                        : 'bg-[#F3F2EE] text-neutral-600 hover:text-[#141416]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedGenre(g.id)}
                      className="pl-3.5 pr-2 py-1.5 cursor-pointer"
                    >
                      {g.name} ({count})
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGenreTag(g.id, e)}
                        className={`pr-2.5 pl-1 py-1.5 hover:text-rose-500 transition-colors cursor-pointer ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-400'
                        }`}
                        title={`Xóa tag thể loại "${g.name}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {isAdmin && (
                isAddingGenreQuick ? (
                  <form onSubmit={handleQuickAddGenre} className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickGenreName}
                      onChange={(e) => setQuickGenreName(e.target.value)}
                      placeholder="Tên thể loại mới..."
                      autoFocus
                      className="px-3 py-1 rounded-full bg-[#F5F4F0] border border-black/20 text-xs text-[#141416] focus:outline-none w-36"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-full bg-[#141416] text-white text-[11px] font-medium cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingGenreQuick(false)}
                      className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingGenreQuick(true)}
                    className="px-3 py-1.5 rounded-full border border-dashed border-black/25 text-neutral-600 hover:text-black hover:border-black text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm tag thể loại</span>
                  </button>
                )
              )}
            </div>

            {/* Right: Search & Admin Add Character */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 md:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên nhân vật, mã số..."
                  className="w-full bg-[#F5F4F0] border border-black/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-[#141416] placeholder:text-neutral-400 focus:outline-none focus:border-black/40"
                />
              </div>

              {isAdmin && (
                <Link
                  to="/admin?tab=characters"
                  className="px-4 py-1.5 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm / Quản lý</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* 2. BESPOKE WHITE EDITORIAL ARCH / MONOLITH CHARACTER CARDS */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center bg-white border border-black/[0.08] rounded-[28px]">
            <p className="text-xs text-neutral-500 font-serif">
              Không tìm thấy hồ sơ nhân vật phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filtered.map((char) => {
              const charGenres = genres.filter((g) => char.genreIds?.includes(g.id));
              return (
                <Link
                  key={char.id}
                  to={`/character/${char.id}`}
                  className="group relative bg-white rounded-t-[120px] rounded-b-[26px] border border-black/[0.08] shadow-[0_22px_60px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.13)] transition-all duration-500 overflow-hidden flex flex-col justify-between pt-9"
                >
                  {/* Admin Quick Change Poster Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRequestChangeCharacterImage(char, 'posterUrl');
                      }}
                      className="absolute top-5 right-6 z-30 p-2 rounded-full bg-white/90 hover:bg-[#141416] text-[#141416] hover:text-white border border-black/15 shadow-sm transition-colors"
                      title="Đổi ảnh nhân vật"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* TOP & MIDDLE POETIC EDITORIAL SECTION */}
                  <div className="px-7 sm:px-9 text-center relative">
                    <div className="flex items-center justify-center gap-16 text-neutral-300 text-xs mb-1">
                      <span>“</span>
                      <span>”</span>
                    </div>
                    <div className="text-[9px] tracking-[0.24em] uppercase text-neutral-500 font-medium">
                      FOR ARCHIVE
                    </div>

                    {/* Two Corner Micro Subtitles */}
                    <div className="flex items-start justify-between text-[9px] text-neutral-400 mt-4 leading-tight min-h-[14px]">
                      <div className="text-left max-w-[110px] truncate">
                        {char.originalNovelTitle || 'BLACK APPLE'}
                      </div>
                      <div className="text-right max-w-[110px] truncate">
                        {char.profileData?.role || (charGenres[0]?.name ?? 'Hồ sơ nhân vật')}
                      </div>
                    </div>

                    {/* Diamond Ornament + Side Dots */}
                    <div className="flex items-center justify-between my-6 px-2">
                      <span className="w-1 h-1 rounded-full bg-neutral-400" />
                      <span className="text-neutral-300 text-sm">♦</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-400" />
                    </div>

                    {/* Center Layered Typography with Vertical Side Labels */}
                    <div className="relative py-4 flex items-center justify-center">
                      <span className="absolute left-0 text-[8px] tracking-[0.25em] uppercase text-neutral-300 [writing-mode:vertical-rl] rotate-180 select-none">
                        ARCHIVE
                      </span>

                      <div className="space-y-1.5 px-6">
                        <div className="flex items-center justify-between gap-8 text-[9px] tracking-[0.22em] uppercase text-neutral-400">
                          <span>CODE</span>
                          <span>{char.code}</span>
                        </div>

                        <div className="relative py-1">
                          <h2 className="font-editorial italic text-2xl sm:text-3xl text-[#7F1D1D] group-hover:text-[#141416] leading-tight transition-colors">
                            {char.name}
                          </h2>
                          {char.originalChineseName && (
                            <span className="block text-[10px] tracking-[0.18em] text-neutral-400 mt-0.5 font-serif">
                              {char.originalChineseName}
                            </span>
                          )}
                        </div>

                        <div className="text-neutral-400 text-[10px] tracking-[0.3em]">
                          •••
                        </div>
                      </div>

                      <span className="absolute right-0 text-[8px] tracking-[0.25em] uppercase text-neutral-300 [writing-mode:vertical-rl] select-none">
                        DOSSIER
                      </span>
                    </div>

                    {/* Genre Badges if assigned */}
                    {charGenres.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                        {charGenres.map((g) => (
                          <span
                            key={g.id}
                            className="px-2.5 py-0.5 rounded-full bg-[#F3F2EE] text-[10px] text-neutral-600 font-serif"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Centered Poetic Excerpt */}
                    <p className="mt-4 text-[11px] text-neutral-500 leading-[1.65] max-w-[225px] mx-auto line-clamp-3 font-serif min-h-[36px]">
                      {char.tagline || char.synopsis || 'Chưa cập nhật văn án.'}
                    </p>

                    {/* Tiny Ornamental Cross & Flanking Quote Marks */}
                    <div className="mt-6 mb-2">
                      <div className="text-[10px] text-neutral-400">❖</div>
                      <div className="flex items-center justify-between px-10 text-neutral-300 text-lg font-serif leading-none mt-1">
                        <span>”</span>
                        <span>“</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM FEATHERED HIGH-KEY MONOCHROME PORTRAIT */}
                  <div className="relative mt-2 aspect-[4/4.6] w-full overflow-hidden bg-white">
                    <ImageWithFallback
                      src={char.posterUrl || char.avatarUrl || char.coverUrl}
                      alt={char.name}
                      objectPosition={char.posterObjectPosition || '50% 20%'}
                      className="w-full h-full object-cover grayscale contrast-[1.02] brightness-105 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                    />

                    {/* Smooth White Mist Feathering at Top and Bottom */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white via-white/70 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/55 to-transparent pointer-events-none" />

                    {/* Side Dots over Portrait */}
                    <div className="absolute top-12 inset-x-8 flex items-center justify-between pointer-events-none">
                      <span className="w-1 h-1 rounded-full bg-neutral-500/60" />
                      <span className="w-1 h-1 rounded-full bg-neutral-500/60" />
                    </div>

                    {/* Signature Footer at Very Bottom of Card */}
                    <div className="absolute bottom-3.5 inset-x-0 text-center z-10">
                      <span className="font-editorial italic text-base text-[#141416] block leading-tight">
                        {char.name}.
                      </span>
                      <span className="text-[9px] tracking-[0.16em] text-neutral-500">
                        @{char.id}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer settings={settings} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
