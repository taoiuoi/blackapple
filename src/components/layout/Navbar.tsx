import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Volume2, VolumeX, Sparkles, Clapperboard, Disc, Image as ImageIcon, Shield, X, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { WebsiteSettings } from '../../types';

interface NavbarProps {
  settings?: WebsiteSettings;
  siteTitle?: string;
  logoUrl?: string;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  onReplayIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  siteTitle,
  isAdmin = false,
  onOpenAdmin = () => {},
  isAudioPlaying = false,
  onToggleAudio = () => {},
  onReplayIntro
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminBarVisible, setAdminBarVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/characters', label: 'Character' },
    { path: '/creator', label: 'Creator' },
    { path: '/commission', label: 'Commission' },
    { path: '/confessions', label: 'Confession' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/characters') {
      return location.pathname.startsWith('/characters') || location.pathname.startsWith('/character/');
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate('/characters');
  };

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
    } catch (_) {}
    setAdminBarVisible(false);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-[#050506]/95 backdrop-blur-xl border-b border-white/[0.07] transition-all">
      {/* ROW 1: TOP ADMIN BAR STRIP (Matches Reference Image 2: IMG_0452) */}
      {isAdmin && adminBarVisible ? (
        <div className="border-b border-white/[0.08] bg-[#070709]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-10 flex items-center justify-between gap-2">
            {/* Left: ADMIN Badge + Admin · Táo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded-[5px] bg-white text-black text-[10px] font-bold tracking-[0.06em] uppercase shrink-0">
                ADMIN
              </span>
              <span className="text-[12px] text-neutral-400 truncate">
                Admin <span className="mx-0.5 text-neutral-600">·</span> Táo
              </span>
            </div>

            {/* Right: Nhân vật | Quản trị | Thoát */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Link
                to="/characters"
                className="px-2.5 sm:px-3 py-1 rounded-[5px] border border-white/25 hover:border-white/50 text-white text-[11px] sm:text-[12px] font-medium transition-colors"
              >
                Nhân vật
              </Link>
              <button
                onClick={() => navigate('/admin')}
                className="px-2.5 sm:px-3 py-1 rounded-[5px] bg-white hover:bg-neutral-200 text-black text-[11px] sm:text-[12px] font-semibold transition-colors"
              >
                Quản trị
              </button>
              <button
                onClick={handleAdminLogout}
                className="text-[11px] sm:text-[12px] text-neutral-400 hover:text-white pl-1 transition-colors cursor-pointer"
                title="Đăng xuất chế độ Quản trị"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ROW 2: MAIN HORIZONTAL NAVBAR (Matches Reference Image 2: IMG_0452) */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-13 sm:h-14 flex items-center justify-between gap-4">
        {/* Left: ARCHIVE – */}
        <Link
          to="/"
          className="text-[13px] sm:text-[15px] tracking-[0.14em] uppercase text-white font-medium shrink-0 flex items-center gap-1.5 hover:opacity-85 transition-opacity"
        >
          <span>ARCHIVE</span>
          <span className="text-neutral-400">–</span>
        </Link>

        {/* Center: Horizontal Navigation Items */}
        <nav className="flex items-center gap-4 sm:gap-7 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-[12px] sm:text-[14px] whitespace-nowrap py-1 transition-colors ${
                  active
                    ? 'text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 font-normal'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search Icon + Pill (...) Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 relative" ref={menuRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-1.5 text-neutral-300 hover:text-white transition-colors"
            title="Tìm kiếm nhân vật & danh mục"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="px-3 sm:px-3.5 py-1 rounded-full border border-white/20 hover:border-white/45 text-white flex items-center justify-center transition-colors"
            title="Mở rộng menu & Âm thanh"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu from (...) Pill */}
          {moreMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0c0c0f] border border-white/15 shadow-2xl py-2 z-50">
              <div className="px-3.5 py-1.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">
                  {settings?.siteTitle || siteTitle || 'BLACK APPLE'}
                </span>
                <span className="text-[10px] text-neutral-600">MENU</span>
              </div>

              <Link
                to="/music"
                onClick={() => setMoreMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Disc className="w-3.5 h-3.5 text-neutral-400" />
                <span>Âm nhạc (Soundtrack)</span>
              </Link>

              <Link
                to="/commission"
                onClick={() => setMoreMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Commission Roleplay AI</span>
              </Link>

              <button
                onClick={() => {
                  onToggleAudio();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {isAudioPlaying ? (
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>Nhạc nền Ambient</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {isAudioPlaying ? 'Đang bật' : 'Tắt'}
                </span>
              </button>

              <button
                onClick={() => {
                  setMoreMenuOpen(false);
                  if (onReplayIntro) {
                    onReplayIntro();
                  } else {
                    window.dispatchEvent(new CustomEvent('ba:replay-intro'));
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <Clapperboard className="w-3.5 h-3.5 text-neutral-400" />
                <span>Xem lại Intro mở đầu</span>
              </button>

              <button
                onClick={() => {
                  setMoreMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('ba:show-creator-popup'));
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span>Khung Giới thiệu Creator</span>
              </button>

              <div className="my-1 border-t border-white/[0.06]" />

              <button
                onClick={() => {
                  setMoreMenuOpen(false);
                  setAdminBarVisible(true);
                  navigate('/admin');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-white font-medium hover:bg-white/[0.08] transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>Trang Quản trị Studio</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Search Bar when Search Icon is clicked */}
      {searchOpen && (
        <div className="border-t border-white/[0.06] bg-[#08080a] px-4 sm:px-8 py-2.5">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-[1280px] mx-auto flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm hồ sơ nhân vật, mã số, tác phẩm..."
              autoFocus
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1 text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
};
