import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X, ChevronDown, Check, SlidersHorizontal, Image as ImageIcon, ArrowUpDown, Lock, Heart, CheckCircle2, Quote } from 'lucide-react';
import { Character, Genre, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { resolveDirectImageUrl } from '../utils/imageOptimizer';
import noirWaveBgUrl from '../assets/images/noir-wave-bg.webp';
import { saveGenre, deleteGenre, hasUserCheeredUpcoming, getUpcomingCheerCount, incrementUpcomingCheer } from '../services/firestoreService';
import { syncUpcomingCheerSupabase } from '../services/supabaseService';
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
  const [teaserModalChar, setTeaserModalChar] = useState<Character | null>(null);
  const [hasCheeredTeaser, setHasCheeredTeaser] = useState(false);
  const [teaserCheerCount, setTeaserCheerCount] = useState(246);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teaserModalChar) {
      const charId = teaserModalChar.id || 'nguu-thanh-anh';
      setHasCheeredTeaser(hasUserCheeredUpcoming(charId));
      getUpcomingCheerCount(charId).then((serverCount) => {
        if (serverCount && serverCount > 0) {
          setTeaserCheerCount((c) => Math.max(c, serverCount));
        }
      });
    }
  }, [teaserModalChar]);

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
    <div className="min-h-screen bg-[#020203] text-[#f4f4f6] font-content flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* High-Fidelity Noir Background Canvas (Same as HomePage) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <img
          src={noirWaveBgUrl}
          alt="Noir Wave Atmosphere Background"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = resolveDirectImageUrl('/assets/noir-wave-bg.jpg');
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
          className="w-full h-full object-cover object-center opacity-70 contrast-[1.12] brightness-[0.78]"
        />
        {/* Soft atmospheric gradient scrim for pristine contrast and typographic clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020203]/75 via-black/40 to-[#020203]/90" />
      </div>

      {/* Global Top Navbar */}
      <div className="relative z-10">
        <Navbar
          settings={settings}
          onOpenAdmin={onOpenAdmin}
          isAdmin={isAdmin}
          isAudioPlaying={isAudioPlaying}
          onToggleAudio={onToggleAudio}
          siteTitle={settings.siteTitle}
          logoUrl={settings.logoUrl}
        />
      </div>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-10 pt-10 sm:pt-14 pb-28 space-y-14">
        {/* 1. OPTICAL LENS EDITORIAL HEADER */}
        <header className="relative lens-crystal-panel rounded-[28px] p-6 sm:p-10">
          <div className="flex items-center justify-between text-[10px] tracking-[0.22em] uppercase text-neutral-300 pb-6 border-b border-white/[0.12]">
            <span>FOR ARCHIVE COLLECTION</span>
            <span className="text-white/50">♦</span>
            <span>BLACK APPLE UNIVERSE</span>
          </div>

          <div className="py-8 text-center max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-8 text-[10px] tracking-[0.28em] uppercase text-neutral-300">
              <span>DANH MỤC</span>
              <span>NHÂN VẬT</span>
            </div>

            <h1 className="font-editorial italic text-3xl sm:text-5xl text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Toàn bộ Hồ sơ Nhân vật
            </h1>

            <div className="text-white/40 tracking-[0.3em] text-xs">•••</div>

            <p className="text-xs text-neutral-300 leading-relaxed font-serif max-w-md mx-auto">
              Tuyển tập những linh hồn trung tâm trong vũ trụ sáng tác BLACK APPLE — nơi lưu giữ văn án, thiết kế thị giác và liên kết tương tác độc lập.
            </p>
          </div>

          {/* Filter & Search Bar on Optical Lens */}
          <div className="pt-6 border-t border-white/[0.12] space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              
              {/* Left: Sleek Genre Dropdown Trigger & Active Chip */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative" ref={genreDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsGenreMenuOpen(!isGenreMenuOpen)}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      selectedGenre !== 'all'
                        ? 'bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.3)]'
                        : 'bg-white/[0.07] hover:bg-white/[0.14] text-neutral-100 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    }`}
                  >
                    <SlidersHorizontal className={`w-3.5 h-3.5 ${selectedGenre !== 'all' ? 'text-black' : 'text-neutral-300'}`} />
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
                    <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#0B0B0F] border border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.95)] p-3 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-300">
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
                            className="w-full bg-white/[0.06] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-white/40"
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
                              ? 'bg-white text-black font-semibold'
                              : 'hover:bg-white/[0.08] text-neutral-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {selectedGenre === 'all' && <Check className="w-3.5 h-3.5 text-black" />}
                            <span>Tất cả nhân vật</span>
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${
                              selectedGenre === 'all'
                                ? 'bg-black/15 text-black'
                                : 'bg-white/10 text-neutral-300'
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
                                    ? 'bg-white text-black font-semibold'
                                    : 'hover:bg-white/[0.08] text-neutral-200'
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
                                  {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                                  <span className="truncate">{g.name}</span>
                                </button>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                                      isSelected
                                        ? 'bg-black/15 text-black'
                                        : 'bg-white/10 text-neutral-300'
                                    }`}
                                  >
                                    {count}
                                  </span>

                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteGenreTag(g.id, e)}
                                      className="p-1 text-neutral-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                        <div className="pt-2 mt-2 border-t border-white/10">
                          {isAddingGenreQuick ? (
                            <form onSubmit={handleQuickAddGenre} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={quickGenreName}
                                onChange={(e) => setQuickGenreName(e.target.value)}
                                placeholder="Tên thể loại mới..."
                                autoFocus
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.08] border border-white/20 text-xs text-white placeholder:text-neutral-400 focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold cursor-pointer shrink-0"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddingGenreQuick(false)}
                                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsAddingGenreQuick(true)}
                              className="w-full py-1.5 text-center text-xs text-neutral-300 hover:text-white flex items-center justify-center gap-1 font-medium cursor-pointer"
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
                        ? 'bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.3)]'
                        : 'bg-white/[0.07] hover:bg-white/[0.14] text-neutral-100 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    }`}
                  >
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy !== 'latest' ? 'text-black' : 'text-neutral-300'}`} />
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
                    <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-[#0B0B0F] border border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.95)] p-2.5 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-white/10">
                        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-300">
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
                              ? 'bg-white text-black font-semibold'
                              : 'hover:bg-white/[0.08] text-neutral-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'latest' && <Check className="w-3.5 h-3.5 text-black" />}
                            <span>Mới ra mắt trước</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'latest' ? 'bg-black/15 text-black' : 'bg-white/10 text-neutral-300'
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
                              ? 'bg-white text-black font-semibold'
                              : 'hover:bg-white/[0.08] text-neutral-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'code' && <Check className="w-3.5 h-3.5 text-black" />}
                            <span>Theo mã số (T-01 → T-06)</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'code' ? 'bg-black/15 text-black' : 'bg-white/10 text-neutral-300'
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
                              ? 'bg-white text-black font-semibold'
                              : 'hover:bg-white/[0.08] text-neutral-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'views' && <Check className="w-3.5 h-3.5 text-black" />}
                            <span>Nhiều lượt xem nhất</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'views' ? 'bg-black/15 text-black' : 'bg-white/10 text-neutral-300'
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
                              ? 'bg-white text-black font-semibold'
                              : 'hover:bg-white/[0.08] text-neutral-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sortBy === 'roleplay' && <Check className="w-3.5 h-3.5 text-black" />}
                            <span>Nhiều lượt nhận Roleplay</span>
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
                              sortBy === 'roleplay' ? 'bg-black/15 text-black' : 'bg-white/10 text-neutral-300'
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
                    className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Xóa bộ lọc thể loại"
                  >
                    <span>{selectedGenreObj?.name || 'Đang lọc'}</span>
                    <X className="w-3 h-3 text-neutral-300" />
                  </button>
                )}
              </div>

              {/* Right: Search & Admin Manage Characters */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 z-10 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên nhân vật, mã số..."
                    className="w-full lens-pill-input rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder:text-neutral-300 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <Link
                    to="/admin?tab=characters"
                    className="px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm / Quản lý</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Micro Filter Status Strip when filtering or sorting */}
            {(selectedGenre !== 'all' || searchQuery || sortBy !== 'latest') && (
              <div className="flex items-center justify-between text-xs text-neutral-300 pt-1 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Kết quả:</span>
                  <strong className="text-white font-semibold">{filtered.length} nhân vật</strong>
                  {selectedGenre !== 'all' && (
                    <span>• Thể loại &ldquo;{selectedGenreObj?.name}&rdquo;</span>
                  )}
                  {searchQuery && (
                    <span>• Từ khóa &ldquo;{searchQuery}&rdquo;</span>
                  )}
                  {sortBy !== 'latest' && (
                    <span className="font-serif italic text-neutral-200">
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
                  className="text-[11px] underline text-neutral-300 hover:text-white cursor-pointer shrink-0"
                >
                  Mặc định
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 2. BESPOKE OPTICAL LENS ARCH CHARACTER CARDS (Design & Structure Preserved 100%) */}
        {sorted.length === 0 ? (
          <div className="py-24 text-center relative lens-crystal-panel rounded-[28px]">
            <p className="text-xs text-neutral-300 font-serif">
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
              // Upcoming Tag: For character marked as upcoming
              const isUpcoming = Boolean(char.isUpcoming);

              return (
                <div key={char.id} className="relative group flex flex-col pt-3">
                  {/* Floating Badges OUTSIDE the card frame so they are never clipped by the arch curve */}
                  {(isRedTag || isNew || isUpcoming) && (
                    <div className="absolute -top-1.5 left-5 z-20 flex items-center gap-1.5 flex-wrap pointer-events-none">
                      {isUpcoming && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0c0f] text-rose-300 border border-rose-500/40 shadow-[0_4px_14px_rgba(0,0,0,0.65)] select-none pointer-events-auto"
                          title="Nhân vật sắp ra mắt trong Archive"
                        >
                          <span className="text-rose-400 text-[10px] leading-none">✦</span>
                          <span className="font-sans font-bold text-[11px] tracking-wide text-rose-300">
                            SẮP RA MẮT
                          </span>
                        </div>
                      )}

                      {isRedTag && !isUpcoming && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#991B1B] text-white border border-rose-400/40 shadow-[0_4px_14px_rgba(153,27,27,0.45)] select-none pointer-events-auto"
                          title="Cảnh báo: Nhân vật có nội dung 18+/21+ nặng đô"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-200 animate-pulse" />
                          <span className="font-sans font-bold text-[11px] tracking-wide text-white">
                            {redLabel}
                          </span>
                        </div>
                      )}

                      {isNew && !isUpcoming && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141418] text-white border border-white/30 shadow-[0_4px_14px_rgba(0,0,0,0.65)] select-none pointer-events-auto"
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

                  {/* The pristine arch card (inner layout completely preserved, transformed to Optical Lens) */}
                  <Link
                    to={getCharacterPath(char)}
                    onClick={(e) => {
                      if (char.isUpcoming) {
                        e.preventDefault();
                        setTeaserModalChar(char);
                      }
                    }}
                    className="relative lens-crystal-panel rounded-t-[120px] rounded-b-[26px] hover:border-white/40 transition-all duration-500 overflow-hidden flex flex-col justify-between pt-9 flex-1"
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
                        className="p-1.5 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border border-white/25 shadow-sm transition-colors pointer-events-auto absolute top-5 right-6 z-30"
                        title="Đổi ảnh nhân vật"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* TOP & MIDDLE POETIC EDITORIAL SECTION */}
                    <div className="px-7 sm:px-9 text-center relative">
                      <div className="flex items-center justify-center gap-16 text-white/40 text-xs mb-1">
                        <span>“</span>
                        <span>”</span>
                      </div>
                      <div className="text-[9px] tracking-[0.24em] uppercase text-neutral-300 font-medium">
                        FOR ARCHIVE
                      </div>

                      {/* Diamond Ornament + Side Dots */}
                      <div className="flex items-center justify-between my-6 px-2">
                        <span className="w-1 h-1 rounded-full bg-white/45" />
                        <span className="text-white/45 text-sm">♦</span>
                        <span className="w-1 h-1 rounded-full bg-white/45" />
                      </div>

                      {/* Center Layered Typography with Vertical Side Labels */}
                      <div className="relative py-4 flex items-center justify-center">
                        <span className="absolute left-0 text-[8px] tracking-[0.25em] uppercase text-white/40 [writing-mode:vertical-rl] rotate-180 select-none">
                          ARCHIVE
                        </span>

                        <div className="space-y-1.5 px-6">
                          <div className="flex items-center justify-between gap-8 text-[9px] tracking-[0.22em] uppercase text-neutral-300">
                            <span>CODE</span>
                            <span>{char.code}</span>
                          </div>

                          <div className="relative py-1">
                            <h2 className="font-editorial italic text-2xl sm:text-3xl text-white group-hover:text-rose-200 leading-tight transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                              {char.name}
                            </h2>
                            {char.originalChineseName && (
                              <span className="block text-[10px] tracking-[0.18em] text-neutral-300 mt-0.5 font-serif">
                                {char.originalChineseName}
                              </span>
                            )}
                          </div>

                          <div className="text-white/45 text-[10px] tracking-[0.3em]">
                            •••
                          </div>
                        </div>

                        <span className="absolute right-0 text-[8px] tracking-[0.25em] uppercase text-white/40 [writing-mode:vertical-rl] select-none">
                          DOSSIER
                        </span>
                      </div>

                      {/* Genre Badges if assigned */}
                      {charGenres.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                          {charGenres.map((g) => (
                            <span
                              key={g.id}
                              className="px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/15 text-[10px] text-neutral-200 font-serif shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Centered Poetic Excerpt */}
                      <p className="mt-4 text-[11px] text-neutral-200 leading-[1.65] max-w-[235px] mx-auto line-clamp-3 font-serif min-h-[36px] italic">
                        {char.tagline || char.profileData?.quote || 'Chưa cập nhật trích dẫn.'}
                      </p>

                      {/* Public Metrics: Views & Roleplay Clicks (Strictly NO eye icon, synchronous editorial font) */}
                      <div className="mt-3 py-1.5 px-3 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-between text-[10px] text-neutral-300 font-sans tracking-wide shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <span className="flex items-center gap-1" title="Số lượt xem hồ sơ">
                          <span className="font-serif text-neutral-200">— 閱覽</span>
                          <strong className="text-white">{(char.views || 0).toLocaleString()}</strong>
                        </span>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1" title="Số lượt nhận link Roleplay">
                          <span className="text-neutral-200 font-serif">—</span>
                          <span>ROLEPLAY:</span>
                          <strong className="text-white">{(char.roleplayClicks || 0).toLocaleString()}</strong>
                        </span>
                      </div>

                      {/* Tiny Ornamental Cross & Flanking Quote Marks */}
                      <div className="mt-4 mb-1">
                        <div className="text-[10px] text-neutral-400">❖</div>
                        <div className="flex items-center justify-between px-10 text-white/40 text-lg font-serif leading-none mt-0.5">
                          <span>”</span>
                          <span>“</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM ARTISTIC NOIR GALLERY PORTRAIT FRAME */}
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 relative">
                      {/* Subtle Offset Architectural Wireframe Shadow Layer */}
                      <div
                        className="absolute inset-x-6 sm:inset-x-7 top-3 bottom-3 translate-x-1.5 translate-y-1.5 rounded-[20px] border border-white/[0.14] bg-white/[0.01] pointer-events-none transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-2"
                        aria-hidden="true"
                      />

                      {/* Main Optical Specular Portrait Frame */}
                      <div className="relative aspect-[4/4.6] w-full rounded-[20px] overflow-hidden bg-[#08080C] border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.55),0_20px_45px_rgba(0,0,0,0.9)]">
                        {/* Top Specular Glare Line on Portrait Frame */}
                        <div className="absolute top-0 inset-x-10 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent z-20 pointer-events-none" />

                        {/* Character Artwork — Clear Face & Crisp Chiaroscuro Contrast */}
                        <ImageWithFallback
                          src={char.posterUrl || char.avatarUrl || char.coverUrl}
                          alt={char.name}
                          priority={true}
                          targetWidth={800}
                          objectPosition={char.posterObjectPosition || '50% 18%'}
                          className="w-full h-full object-cover grayscale contrast-[1.12] brightness-[0.96] group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-1000 ease-out"
                        />

                        {/* Subtle Chiaroscuro Vignette (Clear on face, rich depth at bottom) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/20 pointer-events-none" />

                        {/* Inner Museum Mat Hairline & 4 Precision Corner Viewfinder Marks */}
                        <div className="absolute inset-2.5 sm:inset-3 rounded-[13px] border border-white/[0.14] pointer-events-none z-10">
                          <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-white/75 rounded-tl-[2px]" />
                          <div className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-white/75 rounded-tr-[2px]" />
                          <div className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-[1.5px] border-l-[1.5px] border-white/75 rounded-bl-[2px]" />
                          <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-white/75 rounded-br-[2px]" />
                        </div>

                        {/* Top Micro Archival Coordinates inside Frame */}
                        <div className="absolute top-4 inset-x-5 flex items-center justify-between text-[8px] font-serif tracking-[0.24em] uppercase text-white/70 z-10 pointer-events-none">
                          <span>N° {char.code}</span>
                          <span>✦ PORTRAIT</span>
                        </div>

                        {/* Bottom Editorial Signature Plaque inside Frame */}
                        <div className="absolute bottom-4 inset-x-5 z-10 flex flex-col items-center text-center pointer-events-none">
                          <div className="flex items-center gap-2.5 w-full justify-center mb-0.5">
                            <span className="w-6 h-[1px] bg-gradient-to-r from-transparent to-white/40" />
                            <span className="font-editorial italic text-lg sm:text-xl text-white leading-tight tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                              {char.name}.
                            </span>
                            <span className="w-6 h-[1px] bg-gradient-to-l from-transparent to-white/40" />
                          </div>
                          <span className="text-[9px] tracking-[0.2em] text-neutral-300 font-serif lowercase">
                            {getCharacterSlug(char) || char.code.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ARTISTIC NOIR DOSSIER MODAL FOR UPCOMING CHARACTER (Optical Specular Lens) */}
      {teaserModalChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-[28px] lens-crystal-panel text-neutral-100 overflow-hidden max-h-[92vh] flex flex-col text-left">
            {/* Top Minimal Bar */}
            <div className="px-6 py-4 border-b border-white/[0.14] flex items-center justify-between z-10 bg-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span className="text-[10px] sm:text-[11px] font-serif tracking-[0.24em] uppercase text-rose-200 font-medium">
                  ✦ Confidential Dossier · Bản Thảo Niêm Phong ✦
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setTeaserModalChar(null)}
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
                {/* Seated Noir Portrait */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/15 shadow-2xl group/img1">
                  <ImageWithFallback
                    src={teaserModalChar.posterUrl || teaserModalChar.avatarUrl || '/assets/aistudio/IMG_0866_692df16d.jpeg'}
                    alt={teaserModalChar.name}
                    className="w-full h-full object-cover contrast-[1.05] brightness-95 group-hover/img1:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-[10px] font-serif italic text-neutral-400">
                    Portrait 01 · {teaserModalChar.originalNovelTitle ? teaserModalChar.originalNovelTitle.toLowerCase() : 'vọng niệm'}
                  </div>
                </div>

                {/* Mirror Side Profile Portrait */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-white/15 shadow-2xl group/img2">
                  <ImageWithFallback
                    src={teaserModalChar.coverUrl || teaserModalChar.avatarUrl || '/assets/aistudio/IMG_0861_1e0d66ac.jpeg'}
                    alt={teaserModalChar.name}
                    className="w-full h-full object-cover contrast-[1.05] brightness-95 group-hover/img2:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 text-[10px] font-serif italic text-neutral-400">
                    Portrait 02 · {teaserModalChar.originalChineseName || '牛圣婴'}
                  </div>
                </div>
              </div>

              {/* Core Typographic Dossier */}
              <div className="space-y-4 pt-2">
                {/* Character Name & Novel */}
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-xs font-serif italic text-neutral-400 block mb-1 lowercase">
                      {teaserModalChar.originalNovelTitle ? teaserModalChar.originalNovelTitle.toLowerCase() : 'vọng niệm'} · dự án {teaserModalChar.code || 'T-06'}
                    </span>
                    <h2 className="font-editorial italic text-3xl sm:text-4xl text-white font-normal leading-tight">
                      {teaserModalChar.name}
                    </h2>
                  </div>

                  {teaserModalChar.originalChineseName && (
                    <div className="text-right">
                      <span className="font-serif text-lg text-neutral-400 block tracking-widest">
                        {teaserModalChar.originalChineseName}
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
                    {teaserModalChar.tagline || teaserModalChar.profileData?.quote || '“Nhị thiếu gia! Đại tiểu thư lại bỏ trốn rồi.”'}
                  </p>
                </div>

                {/* Genre Tags Strip */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-neutral-400 block">
                    Thể loại
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-serif text-neutral-300">
                    {[
                      'r21+',
                      'ngụy tỷ đệ',
                      'niên hạ',
                      'chiếm hữu bệnh hoạn',
                      'mèo vờn chuột',
                      'thao túng tâm lý',
                      'tâm lý vặn vẹo'
                    ].map((g, idx, arr) => (
                      <React.Fragment key={g}>
                        <span className="text-neutral-200 hover:text-white transition-colors">
                          {g}
                        </span>
                        {idx < arr.length - 1 && (
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
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-black/50">
              <button
                type="button"
                onClick={async () => {
                  if (!hasCheeredTeaser) {
                    const charId = teaserModalChar.id || 'nguu-thanh-anh';
                    setHasCheeredTeaser(true);
                    setTeaserCheerCount((c) => c + 1);
                    try {
                      const newTotal = await incrementUpcomingCheer(charId);
                      setTeaserCheerCount(newTotal);
                      syncUpcomingCheerSupabase(charId).catch(() => {});
                    } catch (_) {}
                  }
                }}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-serif font-bold tracking-[0.14em] uppercase transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] cursor-pointer ${
                  hasCheeredTeaser
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-none'
                    : 'bg-white hover:bg-neutral-100 text-black active:scale-95'
                }`}
              >
                {hasCheeredTeaser ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Đã ngóng chờ ({teaserCheerCount})</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                    <span>Ngóng chờ nhân vật ({teaserCheerCount})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTeaserModalChar(null)}
                className="px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 bg-white/[0.04] text-xs font-serif text-neutral-300 hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <Footer settings={settings} onOpenAdmin={onOpenAdmin} />
      </div>
    </div>
  );
}
