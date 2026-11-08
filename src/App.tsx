import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  Character,
  Genre,
  Quote,
  CreatorProfile,
  WebsiteSettings,
  MusicTrack
} from './types';
import {
  initializeDatabaseIfEmpty,
  subscribeCharacters,
  subscribeGenres,
  subscribeQuotes,
  subscribeCreatorProfile,
  subscribeSettings,
  subscribeMusicTracks,
  updateCharacterImageUrl,
  saveCreatorProfile,
  sanitizeImageUrl,
  normalizeCharacter,
  getCachedFirestoreData
} from './services/firestoreService';
import { preloadCharacterAssets } from './utils/imageOptimizer';
import {
  INITIAL_CHARACTERS,
  INITIAL_GENRES,
  INITIAL_QUOTES,
  INITIAL_CREATOR_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_TRACKS
} from './data/initialData';

// Dedicated Sub-Pages (Clean Separation of Concerns)
import { HomePage } from './pages/HomePage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterProfilePage } from './pages/CharacterProfilePage';
import { MusicPage } from './pages/MusicPage';
import { CreatorPage } from './pages/CreatorPage';
import { CommissionPage } from './pages/CommissionPage';
import { ConfessionsPage } from './pages/ConfessionsPage';
import { AdminPage } from './pages/AdminPage';

// Common Components & Modals
import { CinematicIntro } from './components/common/CinematicIntro';
import { CreatorIntroPopup } from './components/common/CreatorIntroPopup';
import { AudioPlayerBar } from './components/audio/AudioPlayerBar';
import { DirectImageUrlModal } from './components/common/DirectImageUrlModal';

export default function App() {
  // Main Data States (Initialize from codebase truth INITIAL_CHARACTERS to guarantee zero link/field drops)
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [genres, setGenres] = useState<Genre[]>(INITIAL_GENRES);
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>(() => {
    const cached = getCachedFirestoreData<CreatorProfile>('ba_cache_creator_v3');
    return cached || INITIAL_CREATOR_PROFILE;
  });
  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    const cached = getCachedFirestoreData<WebsiteSettings>('ba_cache_settings_v3');
    return cached || INITIAL_SETTINGS;
  });
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(() => {
    const cached = getCachedFirestoreData<MusicTrack[]>('ba_cache_tracks_v3');
    return cached && Array.isArray(cached) && cached.length > 0 ? cached : INITIAL_TRACKS;
  });

  // App UI & Admin States (Strictly false until authenticated as admin)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const handleOpenAdmin = () => {};

  // Detect if user directly navigated to an inner deep route (e.g. /character/phan-quy-man)
  const isDeepRoute = typeof window !== 'undefined' && 
    window.location.pathname !== '/' && 
    window.location.pathname !== '' &&
    !window.location.pathname.endsWith('/blackapple') &&
    !window.location.pathname.endsWith('/blackapple/');

  // Step 1: Cinematic Intro Screen (Active on entry when not deep-routed)
  const [showIntro, setShowIntro] = useState<boolean>(!isDeepRoute);

  // Step 2: Creator Introduction Popup (Appears right after Intro ends)
  const [showCreatorPopup, setShowCreatorPopup] = useState<boolean>(false);

  // Step 3: Has entered Home (Home is concealed until Creator popup is closed)
  const [hasEnteredHome, setHasEnteredHome] = useState<boolean>(isDeepRoute);

  // Whether the Creator popup is currently acting as the entrance gate
  const [isEntranceGate, setIsEntranceGate] = useState<boolean>(!isDeepRoute);

  const handleCloseCreatorPopup = () => {
    setShowCreatorPopup(false);
    setHasEnteredHome(true);
    setIsEntranceGate(false);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIsAudioPlaying(true);
    // Immediately display Creator Intro Popup upon intro disappearance
    setShowCreatorPopup(true);
    setIsEntranceGate(true);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
    setShowCreatorPopup(false);
    setHasEnteredHome(false);
    setIsEntranceGate(true);
  };

  useEffect(() => {
    const onReplayEvent = () => handleReplayIntro();
    const onShowCreatorPopupEvent = () => {
      setShowCreatorPopup(true);
      setIsEntranceGate(false);
    };
    window.addEventListener('ba:replay-intro', onReplayEvent);
    window.addEventListener('ba:show-creator-popup', onShowCreatorPopupEvent);
    return () => {
      window.removeEventListener('ba:replay-intro', onReplayEvent);
      window.removeEventListener('ba:show-creator-popup', onShowCreatorPopupEvent);
    };
  }, []);

  // Ambient Audio State (Auto-plays on website entry & persists across route changes)
  const [isAudioPlaying, setIsAudioPlaying] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Direct Image URL Modal State
  const [directImageModal, setDirectImageModal] = useState<{
    isOpen: boolean;
    title: string;
    currentUrl: string;
    currentPosition: string;
    onSave: (url: string, position: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    currentUrl: '',
    currentPosition: '50% 50%',
    onSave: async () => {}
  });

  // Initialize and Subscribe to Firestore
  useEffect(() => {
    // Purge any legacy localStorage image overrides and stale character caches on startup
    try {
      ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'].forEach((v) => {
        localStorage.removeItem(`ba_cache_characters_${v}`);
      });
      ['nguy-tu-viet', 'gian-di-ninh', 'chu-lac-thien', 'luc-tu-hien', 'phan-quy-man', 'dong-ky'].forEach((cid) => {
        localStorage.removeItem(`ba_char_${cid}_avatarUrl`);
        localStorage.removeItem(`ba_char_${cid}_coverUrl`);
        localStorage.removeItem(`ba_char_${cid}_posterUrl`);
        localStorage.removeItem(`ba_char_${cid}_synopsisImageUrl`);
        localStorage.removeItem(`ba_char_data_${cid}`);
      });
      localStorage.removeItem('ba_creator_avatarUrl');
      localStorage.removeItem('ba_creator_coverUrl');
      localStorage.removeItem('ba_creator_introImageUrl');
    } catch (_) {}

    const unsubChars = subscribeCharacters((chars) => {
      const merged = chars.map((c) => {
        try {
          const localPos = localStorage.getItem(`ba_char_${c.id}_pos`);
          const normalized = normalizeCharacter(c, c.id);
          return {
            ...normalized,
            posterObjectPosition: localPos || normalized.posterObjectPosition
          };
        } catch (_) {
          return normalizeCharacter(c, c.id);
        }
      });
      setCharacters(merged);
      preloadCharacterAssets(merged);
    });

    const unsubGenres = subscribeGenres(setGenres);
    const unsubQuotes = subscribeQuotes(setQuotes);
    const unsubCreator = subscribeCreatorProfile((prof) => {
      setCreatorProfile(prof);
    });

    const unsubSettings = subscribeSettings(setSettings);
    const unsubTracks = subscribeMusicTracks(setMusicTracks);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email?.toLowerCase() === 'anhitoo8@gmail.com') {
        setIsAdmin(true);
        initializeDatabaseIfEmpty(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      unsubChars();
      unsubGenres();
      unsubQuotes();
      unsubCreator();
      unsubSettings();
      unsubTracks();
      unsubAuth();
    };
  }, []);

  // Update a single character in local state
  const handleCharacterUpdated = (updatedChar: Character) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === updatedChar.id ? updatedChar : c))
    );
  };

  // Open Direct Image URL Modal for a Character Field
  const handleRequestChangeCharacterImage = (
    char: Character,
    field: 'avatarUrl' | 'coverUrl' | 'posterUrl' | 'synopsisImageUrl'
  ) => {
    if (!isAdmin) return;
    const titles: Record<string, string> = {
      coverUrl: `Thay URL Ảnh Trang Chủ (Home): ${char.name}`,
      posterUrl: `Thay URL Ảnh Thẻ & Profile Poster: ${char.name}`,
      avatarUrl: `Thay URL Avatar nhân vật: ${char.name}`,
      synopsisImageUrl: `Thay URL Ảnh minh họa: ${char.name}`
    };

    setDirectImageModal({
      isOpen: true,
      title: titles[field] || 'Thay đổi URL hình ảnh',
      currentUrl: char[field] || '',
      currentPosition: char.posterObjectPosition || '50% 50%',
      onSave: async (newUrl: string, position: string) => {
        // 1. Immediately persist to localStorage for zero-latency reload preservation
        try {
          localStorage.setItem(`ba_char_${char.id}_${field}`, newUrl);
          if (field === 'posterUrl') {
            localStorage.setItem(`ba_char_${char.id}_pos`, position);
          }
        } catch (_) {}

        // 2. Update React State immediately
        const updated = { ...char, [field]: newUrl };
        if (field === 'posterUrl') updated.posterObjectPosition = position;
        handleCharacterUpdated(updated);

        // 3. Persist to Cloud Firestore database
        await updateCharacterImageUrl(char.id, field, newUrl, position);
      }
    });
  };

  // Open Direct Image URL Modal for Creator Profile Field
  const handleRequestChangeCreatorImage = (
    field: 'avatarUrl' | 'coverUrl' | 'introImageUrl' | 'donateQrUrl'
  ) => {
    if (!isAdmin) return;
    const titles: Record<string, string> = {
      avatarUrl: 'Thay URL Avatar tác giả',
      coverUrl: 'Thay URL Ảnh bìa tác giả',
      introImageUrl: 'Thay URL Ảnh giới thiệu sáng tác',
      donateQrUrl: 'Thay URL Mã QR ủng hộ (Donate QR)'
    };

    setDirectImageModal({
      isOpen: true,
      title: titles[field] || 'Thay URL hình ảnh tác giả',
      currentUrl: creatorProfile[field] || '',
      currentPosition: '50% 50%',
      onSave: async (newUrl: string) => {
        try {
          localStorage.setItem(`ba_creator_${field}`, newUrl);
        } catch (_) {}
        const updated = { ...creatorProfile, [field]: newUrl };
        setCreatorProfile(updated);
        await saveCreatorProfile(updated);
      }
    });
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* Cinematic Custom Black Apple Intro Screen */}
      {showIntro && (
        <CinematicIntro
          onComplete={handleIntroComplete}
          siteTitle={settings.siteTitle || 'BLACK APPLE'}
        />
      )}

      {/* Creator Introduction Popup (Buffering Bridge before Home interaction) */}
      <CreatorIntroPopup
        isOpen={showCreatorPopup && !showIntro}
        onClose={handleCloseCreatorPopup}
        profile={creatorProfile}
        isEntranceGate={isEntranceGate}
      />

      {/* Solid Noir Veil concealing Home until Creator Popup is closed */}
      {!hasEnteredHome && !isDeepRoute && (
        <div
          className="fixed inset-0 z-30 bg-[#030304] pointer-events-none transition-opacity duration-700 ease-out"
          style={{ opacity: showIntro || showCreatorPopup ? 1 : 0 }}
          aria-hidden="true"
        />
      )}

      {/* Multi-Page Routes with Smooth Entrance Reveal */}
      <div
        className={`transition-opacity duration-700 ease-out min-h-screen ${
          !hasEnteredHome && !isDeepRoute
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100 pointer-events-auto'
        }`}
      >
        <Routes>
        {/* Route 1: Homepage (Spacious Editorial Cover directly reflecting IMG_0441_6b99bddd.jpeg) */}
        <Route
          path="/"
          element={
            <HomePage
              characters={characters}
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
              onRequestChangeCharacterImage={handleRequestChangeCharacterImage}
              onReplayIntro={handleReplayIntro}
            />
          }
        />

        {/* Route 2: Dedicated Character Archive & Catalog */}
        <Route
          path="/characters"
          element={
            <CharactersPage
              characters={characters}
              genres={genres}
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
              onRequestChangeCharacterImage={handleRequestChangeCharacterImage}
            />
          }
        />

        {/* Route 3: Dedicated Character Profile Page (100% Standalone Page, Real URL, No Modal) */}
        <Route
          path="/character/:id"
          element={
            <CharacterProfilePage
              characters={characters}
              genres={genres}
              isAdmin={isAdmin}
              settings={settings}
              onCharacterUpdated={handleCharacterUpdated}
              onRequestChangeCharacterImage={handleRequestChangeCharacterImage}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
              onReplayIntro={handleReplayIntro}
            />
          }
        />

        {/* Route 4: Gallery removed per request, cleanly redirected to Characters */}
        <Route
          path="/gallery"
          element={<Navigate to="/characters" replace />}
        />

        {/* Route 5: Dedicated Ambient Soundtrack Station */}
        <Route
          path="/music"
          element={
            <MusicPage
              tracks={musicTracks}
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
              currentTrackIndex={currentTrackIndex}
              onSelectTrackIndex={setCurrentTrackIndex}
            />
          }
        />

        {/* Route 6: Dedicated Author/Creator Profile (Voheis) */}
        <Route
          path="/creator"
          element={
            <CreatorPage
              profile={creatorProfile}
              characters={characters}
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
              onRequestChangeImage={handleRequestChangeCreatorImage}
              onRequestChangeCharacterImage={handleRequestChangeCharacterImage}
            />
          }
        />

        {/* Route 7: Dedicated AI Roleplay Commission Service & Brief Booking */}
        <Route
          path="/commission"
          element={
            <CommissionPage
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
              onReplayIntro={handleReplayIntro}
            />
          }
        />

        {/* Route 8: Dedicated Reader Confessions & Messages Board */}
        <Route
          path="/confessions"
          element={
            <ConfessionsPage
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={handleOpenAdmin}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
            />
          }
        />

        {/* Route 8: Dedicated Standalone Admin Workspace (No Modals) */}
        <Route
          path="/admin"
          element={
            <AdminPage
              isAdmin={isAdmin}
              onToggleAdminStatus={setIsAdmin}
              characters={characters}
              genres={genres}
              quotes={quotes}
              creatorProfile={creatorProfile}
              settings={settings}
              musicTracks={musicTracks}
              onSelectTrackIndex={setCurrentTrackIndex}
              onPlayTrack={() => setIsAudioPlaying(true)}
              onRequestChangeImage={(char, field) => {
                if (typeof char === 'string') {
                  handleRequestChangeCreatorImage(char as any);
                } else if (char && field) {
                  handleRequestChangeCharacterImage(char, field);
                }
              }}
            />
          }
        />

        {/* Route Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar
        tracks={musicTracks}
        isPlaying={isAudioPlaying}
        onTogglePlay={() => setIsAudioPlaying(!isAudioPlaying)}
        currentTrackIndex={currentTrackIndex}
        onSelectTrackIndex={setCurrentTrackIndex}
      />

      {/* Direct Image URL & Device File Upload Modal */}
      <DirectImageUrlModal
        isOpen={directImageModal.isOpen}
        onClose={() => setDirectImageModal((prev) => ({ ...prev, isOpen: false }))}
        title={directImageModal.title}
        currentUrl={directImageModal.currentUrl}
        currentPosition={directImageModal.currentPosition}
        onSave={directImageModal.onSave}
      />
    </BrowserRouter>
  );
}
