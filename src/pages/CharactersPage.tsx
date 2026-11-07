import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X, ChevronDown, Check, SlidersHorizontal, Image as ImageIcon, ArrowUpDown } from 'lucide-react';
import { Character, Genre, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { saveGenre, deleteGenre } from '../services/firestoreService';
import { getCharacterPath, getCharacterSlug } from '../utils/slugify';

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
  type SortOption = 'latest' | 'code' | 'views' | 'roleplay';
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const [genreFilterSearch, setGenreFilterSearch] = useState('');
  const [isAddingGenreQuick, setIsAddingGenreQuick] = useState(false);
  const [quickGenreName, setQuickGenreName] = useState('');
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setIsGenreMenuOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const selectedGenreObj = genres.find((g) => g.id === selectedGenre);

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

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'latest') {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderB - orderA;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    }
    if (sortBy === 'code') {
      return (a.order ?? 99) - (b.order ?? 99);
    }
    if (sortBy === 'views') {
      return (b.views || 0) - (a.views || 0);
    }
    if (sortBy === 'roleplay') {
      return (b.roleplayClicks || 0) - (a.roleplayClicks || 0);
    }
    return 0;
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

          {/* Filter & Search Bar on Crisp White - Clean & Non-cluttered */}
          <div className="pt-6 border-t border-black/[0.06] space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              
              {/* Left: Sleek Genre Dropdown Trigger & Active Chip */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative" ref={genreDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsGenreMenuOpen(!isGenreMenuOpen)}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      selectedGenre !== 'all'
                        ? 'bg-[#141416] text-white border-[#141416] shadow-sm'
                        : 'bg-[#F3F2EE] hover:bg-[#eae8e2] text-[#141416] border-black/[0.08]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {selectedGenre === 'all'
                        ? `Thể loại: Tất cả (${characters.length})`
                        : `Thể loại: ${selectedGenreObj?.name || selectedGenre}`}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isGenreMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Popover Dropdown Panel */}
                  {isGenreMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-black/15 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-3 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-black/[0.06]">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-400">
                          DANH MỤC THỂ LOẠI
                        </span>
                        <span className="text-[10px] text-neutral-400 font-sans">
                          {genres.length} thể loại
                        </span>
                      </div>

                      {/* Small Quick Search within genres if > 5 */}
                      {genres.length > 5 && (
                        <div className="mb-2 px-1">
                          <input
                            type="text"
                            value={genreFilterSearch}
                            onChange={(e) => setGenreFilterSearch(e.target.value)}
                            placeholder="Tìm nhanh thể loại..."
                            className="w-full bg-[#FAF9F6] border border-black/10 rounded-lg px-2.5 py-1 text-xs text-[#141416] placeholder:text-neutral-400 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Scrollable Genre List */}
                      <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                        {/* Option: Tất cả */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGenre('all');
                            setIsGenreMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            selectedGenre === 'all'
                              ? 'bg-[#141416] text-white font-medium'
                              : 'hover:bg-[#F3F2EE] text-neutral-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {selectedGenre === 'all' && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>Tất cả nhân vật</span>
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              selectedGenre === 'all'
                                ? 'bg-white/20 text-white'
                                : 'bg-[#EAE8E2] text-neutral-600'
                            }`}
                          >
                            {characters.length}
                          </span>
                        </button>

                        {/* Each Genre */}
                        {genres
                          .filter((g) =>
                            !genreFilterSearch ||
                            g.name.toLowerCase().includes(genreFilterSearch.toLowerCase())
                          )
                          .map((g) => {
                            const count = characters.filter(
                              (c) => c.genreIds && c.genreIds.includes(g.id)
                            ).length;
                            const isSelected = selectedGenre === g.id;
                            return (
                              <div
                                key={g.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors group ${
                                  isSelected
                                    ? 'bg-[#141416] text-white font-medium'
                                    : 'hover:bg-[#F3F2EE] text-neutral-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedGenre(g.id);
                                    setIsGenreMenuOpen(false);
                                  }}
                                  className="flex-1 flex items-center gap-2 text-left cursor-pointer truncate mr-2"
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                                  <span className="truncate">{g.name}</span>
                                </button>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#EAE8E2] text-neutral-600'
                                    }`}
                                  >
                                    {count}
                                  </span>

                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteGenreTag(g.id, e)}
                                      className="p-1 text-neutral-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title={`Xóa tag "${g.name}"`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Admin Quick Add inside Dropdown */}
                      {isAdmin && (
                        <div className="pt-2 mt-2 border-t border-black/[0.08]">
                          {isAddingGenreQuick ? (
                            <form onSubmit={handleQuickAddGenre} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={quickGenreName}
                                onChange={(e) => setQuickGenreName(e.target.value)}
                                placeholder="Tên thể loại mới..."
                                autoFocus
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#141416] focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-[#141416] text-white text-xs font-semibold cursor-pointer shrink-0"
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
                              className="w-full py-1.5 text-center text-xs text-neutral-600 hover:text-black flex items-center justify-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Tạo thể loại mới</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sleek Sort Dropdown */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      sortBy !== 'latest'
                        ? 'bg-[#141416] text-white border-[#141416] shadow-sm'
                        : 'bg-[#F3F2EE] hover:bg-[#eae8e2] text-[#141416] border-black/[0.08]'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {sortBy === 'latest' && 'Xếp: Mới nhất trước'}
                      {sortBy === 'code' && 'Xếp: Mã số (T-01 →)'}
                      {sortBy === 'views' && 'Xếp: Lượt xem nhiều'}
                      {sortBy === 'roleplay' && 'Xếp: Lượt Roleplay'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isSortMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-white border border-black/15 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-2.5 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-black/[0.06]">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-400">
                          THỨ TỰ HIỂN THỊ
                        </span>
                        <span className="text-[9px] text-neutral-400 font-serif italic">
                          Tự động cập nhật
                        </span>
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('latest');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            sortBy === 'latest'
                              ? 'bg-[#141416] text-white font-medium'
                              : 'hover:bg-[#F3F2EE] text-neutral-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'latest' && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>Mới ra mắt trước</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'latest' ? 'bg-white/20 text-white' : 'bg-[#EAE8E2] text-neutral-600'
                            }`}
                          >
                            Ưu tiên
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('code');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            sortBy === 'code'
                              ? 'bg-[#141416] text-white font-medium'
                              : 'hover:bg-[#F3F2EE] text-neutral-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'code' && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>Theo mã số (T-01 → T-06)</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'code' ? 'bg-white/20 text-white' : 'bg-[#EAE8E2] text-neutral-600'
                            }`}
                          >
                            Mã số
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('views');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            sortBy === 'views'
                              ? 'bg-[#141416] text-white font-medium'
                              : 'hover:bg-[#F3F2EE] text-neutral-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'views' && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>Nhiều lượt xem nhất</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'views' ? 'bg-white/20 text-white' : 'bg-[#EAE8E2] text-neutral-600'
                            }`}
                          >
                            Lượt xem
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('roleplay');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            sortBy === 'roleplay'
                              ? 'bg-[#141416] text-white font-medium'
                              : 'hover:bg-[#F3F2EE] text-neutral-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'roleplay' && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>Nhiều lượt nhận Roleplay</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'roleplay' ? 'bg-white/20 text-white' : 'bg-[#EAE8E2] text-neutral-600'
                            }`}
                          >
                            Roleplay
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* If a genre is selected, display quick remove pill */}
                {selectedGenre !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedGenre('all')}
                    className="px-3 py-1.5 rounded-full bg-[#EAE8E2] hover:bg-neutral-300 text-[#141416] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Xóa bộ lọc thể loại"
                  >
                    <span>{selectedGenreObj?.name || 'Đang lọc'}</span>
                    <X className="w-3 h-3 text-neutral-500" />
                  </button>
                )}
              </div>

              {/* Right: Search & Admin Manage Characters */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên nhân vật, mã số..."
                    className="w-full bg-[#F5F4F0] border border-black/10 rounded-full pl-9 pr-8 py-2 text-xs text-[#141416] placeholder:text-neutral-400 focus:outline-none focus:border-black/40"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <Link
                    to="/admin?tab=characters"
                    className="px-4 py-2 rounded-full bg-[#141416] hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm / Quản lý</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Micro Filter Status Strip when filtering or sorting */}
            {(selectedGenre !== 'all' || searchQuery || sortBy !== 'latest') && (
              <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Kết quả:</span>
                  <strong className="text-[#141416] font-semibold">{filtered.length} nhân vật</strong>
                  {selectedGenre !== 'all' && (
                    <span>• Thể loại &ldquo;{selectedGenreObj?.name}&rdquo;</span>
                  )}
                  {searchQuery && (
                    <span>• Từ khóa &ldquo;{searchQuery}&rdquo;</span>
                  )}
                  {sortBy !== 'latest' && (
                    <span className="font-serif italic text-neutral-600">
                      • {sortBy === 'code' ? 'Theo mã số T-01 →' : sortBy === 'views' ? 'Lượt xem nhiều' : 'Lượt Roleplay'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGenre('all');
                    setSearchQuery('');
                    setSortBy('latest');
                  }}
                  className="text-[11px] underline text-neutral-600 hover:text-black cursor-pointer shrink-0"
                >
                  Mặc định
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 2. BESPOKE WHITE EDITORIAL ARCH / MONOLITH CHARACTER CARDS */}
        {sorted.length === 0 ? (
          <div className="py-24 text-center bg-white border border-black/[0.08] rounded-[28px]">
            <p className="text-xs text-neutral-500 font-serif">
              Không tìm thấy hồ sơ nhân vật phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pt-4">
            {sorted.map((char) => {
              const charGenres = genres.filter((g) => char.genreIds?.includes(g.id));
              // Red Tag: Strictly only Dong Ky and Gian Di Ninh as requested
              const isRedTag = char.id === 'dong-ky' || char.id === 'gian-di-ninh';
              const redLabel = char.id === 'dong-ky' ? '21+ · H NẶNG' : '18+ · NẶNG ĐÔ';
              // New Tag: Strictly only Phan Quy Man and Dong Ky as requested
              const isNew = char.id === 'phan-quy-man' || char.id === 'dong-ky';

              return (
                <div key={char.id} className="relative group flex flex-col pt-3">
                  {/* Floating Badges OUTSIDE the card frame so they are never clipped by the arch curve */}
                  {(isRedTag || isNew) && (
                    <div className="absolute -top-1.5 left-5 z-20 flex items-center gap-1.5 flex-wrap pointer-events-none">
                      {isRedTag && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#991B1B] text-white border border-rose-400/40 shadow-[0_4px_14px_rgba(153,27,27,0.38)] select-none pointer-events-auto"
                          title="Cảnh báo: Nhân vật có nội dung 18+/21+ nặng đô"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-200 animate-pulse" />
                          <span className="font-sans font-bold text-[11px] tracking-wide text-white">
                            {redLabel}
                          </span>
                        </div>
                      )}

                      {isNew && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] text-[#FAF9F6] border border-black/25 shadow-[0_4px_14px_rgba(0,0,0,0.22)] select-none pointer-events-auto"
                          title="Nhân vật mới ra mắt trong Archive"
                        >
                          <span className="text-amber-400 text-[10px] leading-none">✦</span>
                          <span className="font-sans font-bold text-[11px] tracking-wide text-white">
                            MỚI RA MẮT
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* The pristine arch card (inner layout completely preserved) */}
                  <Link
                    to={getCharacterPath(char)}
                    className="relative bg-white rounded-t-[120px] rounded-b-[26px] border border-black/[0.08] shadow-[0_22px_60px_rgba(0,0,0,0.06)] group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.13)] transition-all duration-500 overflow-hidden flex flex-col justify-between pt-9 flex-1"
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
                        className="p-1.5 rounded-full bg-white/90 hover:bg-[#141416] text-[#141416] hover:text-white border border-black/15 shadow-sm transition-colors pointer-events-auto absolute top-5 right-6 z-30"
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
                    <p className="mt-4 text-[11px] text-neutral-600 leading-[1.65] max-w-[235px] mx-auto line-clamp-3 font-serif min-h-[36px] italic">
                      {char.tagline || char.profileData?.quote || 'Chưa cập nhật trích dẫn.'}
                    </p>

                    {/* Public Metrics: Views & Roleplay Clicks (Strictly NO eye icon, synchronous editorial font) */}
                    <div className="mt-3 py-1.5 px-3 rounded-full bg-[#FAF9F6] border border-black/[0.06] flex items-center justify-between text-[10px] text-neutral-500 font-sans tracking-wide">
                      <span className="flex items-center gap-1" title="Số lượt xem hồ sơ">
                        <span className="font-serif text-[#18181A]">— 閱覽</span>
                        <strong className="text-[#18181A]">{(char.views || 0).toLocaleString()}</strong>
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="flex items-center gap-1" title="Số lượt nhận link Roleplay">
                        <span className="text-[#18181A] font-serif">—</span>
                        <span>ROLEPLAY:</span>
                        <strong className="text-[#18181A]">{(char.roleplayClicks || 0).toLocaleString()}</strong>
                      </span>
                    </div>

                    {/* Tiny Ornamental Cross & Flanking Quote Marks */}
                    <div className="mt-4 mb-2">
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
                      priority={true}
                      targetWidth={800}
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
                      <span className="text-[9px] tracking-[0.16em] text-neutral-500 font-mono">
                        {getCharacterSlug(char) || char.code.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
          </div>
        )}
      </main>

      <Footer settings={settings} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
