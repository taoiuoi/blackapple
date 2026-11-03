import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection } from './lib/firebase';
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
  normalizeCharacter
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
import { AudioPlayerBar } from './components/audio/AudioPlayerBar';
import { DirectImageUrlModal } from './components/common/DirectImageUrlModal';

export default function App() {
  // Main Data States
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [genres, setGenres] = useState<Genre[]>(INITIAL_GENRES);
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>(INITIAL_CREATOR_PROFILE);
  const [settings, setSettings] = useState<WebsiteSettings>(INITIAL_SETTINGS);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(INITIAL_TRACKS);

  // App UI & Admin States (Strictly false until authenticated as admin)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Cinematic Intro Screen State (Stored in sessionStorage so it doesn't repeat on refresh unless requested)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('black_apple_intro_v11_seen') !== 'true';
    }
    return true;
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('black_apple_intro_v11_seen', 'true');
    setShowIntro(false);
    setIsAudioPlaying(true);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  useEffect(() => {
    const onReplayEvent = () => setShowIntro(true);
    window.addEventListener('ba:replay-intro', onReplayEvent);
    return () => window.removeEventListener('ba:replay-intro', onReplayEvent);
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
    testConnection().then(() => {
      initializeDatabaseIfEmpty();
    });

    const unsubChars = subscribeCharacters((chars) => {
      // Merge with any client-side localStorage image overrides (excluding sample build images)
      const merged = chars.map((c) => {
        try {
          localStorage.removeItem(`ba_char_data_${c.id}`);
          const localAvatar = sanitizeImageUrl(localStorage.getItem(`ba_char_${c.id}_avatarUrl`) || '');
          const localCover = sanitizeImageUrl(localStorage.getItem(`ba_char_${c.id}_coverUrl`) || '');
          const localPoster = sanitizeImageUrl(localStorage.getItem(`ba_char_${c.id}_posterUrl`) || '');
          const localSynopsisImg = sanitizeImageUrl(localStorage.getItem(`ba_char_${c.id}_synopsisImageUrl`) || '');
          const localPos = localStorage.getItem(`ba_char_${c.id}_pos`);
          const normalized = normalizeCharacter(c, c.id);

          return {
            ...normalized,
            avatarUrl: localAvatar || normalized.avatarUrl,
            coverUrl: localCover || normalized.coverUrl,
            posterUrl: localPoster || normalized.posterUrl,
            synopsisImageUrl: localSynopsisImg || normalized.synopsisImageUrl,
            posterObjectPosition: localPos || normalized.posterObjectPosition
          };
        } catch (_) {
          return normalizeCharacter(c, c.id);
        }
      });
      setCharacters(merged);
      // Stagger background asset caching after initial render to avoid network contention
      const timer = setTimeout(() => {
        preloadCharacterAssets(merged);
      }, 1200);
      return () => clearTimeout(timer);
    });

    const unsubGenres = subscribeGenres(setGenres);
    const unsubQuotes = subscribeQuotes(setQuotes);
    const unsubCreator = subscribeCreatorProfile((prof) => {
      try {
        const localAvatar = sanitizeImageUrl(localStorage.getItem('ba_creator_avatarUrl') || '');
        const localCover = sanitizeImageUrl(localStorage.getItem('ba_creator_coverUrl') || '');
        const localIntro = sanitizeImageUrl(localStorage.getItem('ba_creator_introImageUrl') || '');
        const localQr = localStorage.getItem('ba_creator_donateQrUrl');
        setCreatorProfile({
          ...prof,
          avatarUrl: localAvatar || prof.avatarUrl,
          coverUrl: localCover || prof.coverUrl,
          introImageUrl: localIntro || prof.introImageUrl,
          donateQrUrl: localQr || prof.donateQrUrl
        });
      } catch (_) {
        setCreatorProfile(prof);
      }
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
      avatarUrl: `Thay URL Avatar nhân vật: ${char.name}`,
      coverUrl: `Thay URL Ảnh bìa nhân vật: ${char.name}`,
      posterUrl: `Thay URL Poster chính (Editorial): ${char.name}`,
      synopsisImageUrl: `Thay URL Ảnh minh họa văn án: ${char.name}`
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

      {/* Multi-Page Routes */}
      <Routes>
        {/* Route 1: Homepage (Spacious Editorial Cover directly reflecting IMG_0441_6b99bddd.jpeg) */}
        <Route
          path="/"
          element={
            <HomePage
              characters={characters}
              settings={settings}
              isAdmin={isAdmin}
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
              onOpenAdmin={() => setIsAdminModalOpen(true)}
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
