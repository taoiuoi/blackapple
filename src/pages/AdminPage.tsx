import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Tag,
  Quote as QuoteIcon,
  User,
  Settings,
  Music,
  Download,
  Database,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  ExternalLink,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, testConnection } from '../lib/firebase';
import {
  Character,
  CharacterNPC,
  Genre,
  Quote,
  CreatorProfile,
  WebsiteSettings,
  MusicTrack,
  CommissionRequest,
  CommissionSettings,
  CommissionStatus
} from '../types';
import {
  generateCharacterSlug,
  slugifyVietnamese,
  getCharacterPath,
  getCharacterSlug
} from '../utils/slugify';
import {
  saveCharacter,
  deleteCharacter,
  saveGenre,
  deleteGenre,
  saveQuote,
  deleteQuote,
  saveCreatorProfile,
  saveSettings,
  saveMusicTrack,
  deleteMusicTrack,
  extractYouTubeId,
  fetchYouTubeMetadata,
  uploadMusicFileToFirestore,
  subscribeCommissionRequests,
  updateCommissionStatus,
  deleteCommissionRequest,
  subscribeCommissionSettings,
  saveCommissionSettings
} from '../services/firestoreService';
import { INITIAL_COMMISSION_SETTINGS } from '../data/initialData';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

interface AdminPageProps {
  isAdmin: boolean;
  onToggleAdminStatus: (status: boolean) => void;
  characters: Character[];
  genres: Genre[];
  quotes: Quote[];
  creatorProfile: CreatorProfile;
  settings: WebsiteSettings;
  musicTracks: MusicTrack[];
  onSelectTrackIndex?: (index: number) => void;
  onPlayTrack?: () => void;
  onRequestChangeImage: (charOrField: any, fieldOrNone?: any) => void;
}

export function AdminPage({
  isAdmin,
  onToggleAdminStatus,
  characters,
  genres,
  quotes,
  creatorProfile,
  settings,
  musicTracks,
  onSelectTrackIndex,
  onPlayTrack,
  onRequestChangeImage
}: AdminPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as any) || 'characters';
  const charParam = searchParams.get('character');

  const [activeTab, setActiveTab] = useState<
    'characters' | 'commissions' | 'genres' | 'quotes' | 'creator' | 'settings' | 'music' | 'backup'
  >(initialTab);

  // Character editing state
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isCreatingChar, setIsCreatingChar] = useState(false);

  // Commission state
  const [commissionRequests, setCommissionRequests] = useState<CommissionRequest[]>([]);
  const [commissionSettingsForm, setCommissionSettingsForm] = useState<CommissionSettings>(
    INITIAL_COMMISSION_SETTINGS
  );
  const [selectedCommission, setSelectedCommission] = useState<CommissionRequest | null>(null);
  const [commStatusFilter, setCommStatusFilter] = useState<'all' | CommissionStatus>('all');
  const [isSavingCommSettings, setIsSavingCommSettings] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Genre form
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDesc, setNewGenreDesc] = useState('');

  // Quote form
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');

  // Music form (Defaults to 'url' so pasting YouTube/MP3 links is immediate)
  const [musicAddMode, setMusicAddMode] = useState<'file' | 'url'>('url');
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [selectedMusicFile, setSelectedMusicFile] = useState<File | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicUploadProgress, setMusicUploadProgress] = useState(0);

  // Character Form NPC & Genre sub-states
  const [adminNewNpcName, setAdminNewNpcName] = useState('');
  const [adminNewNpcRole, setAdminNewNpcRole] = useState('');
  const [adminNewNpcDesc, setAdminNewNpcDesc] = useState('');
  const [adminNewNpcAvatar, setAdminNewNpcAvatar] = useState('');
  const [charFormNewGenre, setCharFormNewGenre] = useState('');

  // Editable Profile & Settings copies
  const [profileForm, setProfileForm] = useState<CreatorProfile>({ ...creatorProfile });
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({ ...settings });
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Test connection state
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync profileForm and settingsForm when props update
  useEffect(() => {
    setProfileForm({ ...creatorProfile });
  }, [creatorProfile]);

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  // Subscribe to Commission Settings (public) & Commission Requests (admin only)
  useEffect(() => {
    const unsubSettings = subscribeCommissionSettings((s) => {
      if (s) setCommissionSettingsForm(s);
    });
    let unsubReqs: (() => void) | undefined;
    if (isAdmin && auth.currentUser) {
      unsubReqs = subscribeCommissionRequests(setCommissionRequests);
    } else {
      setCommissionRequests([]);
    }
    return () => {
      if (unsubReqs) unsubReqs();
      unsubSettings();
    };
  }, [isAdmin]);

  const handleUpdateCommStatus = async (id: string, status: CommissionStatus, notes?: string) => {
    try {
      await updateCommissionStatus(id, status, notes);
      setStatusMessage('Đã cập nhật trạng thái brief commission!');
      if (selectedCommission && selectedCommission.id === id) {
        setSelectedCommission((prev) =>
          prev ? { ...prev, status, adminNotes: notes !== undefined ? notes : prev.adminNotes } : null
        );
      }
    } catch (err: any) {
      setStatusMessage('Lỗi cập nhật: ' + err.message);
    }
  };

  const handleDeleteComm = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa brief commission này?')) return;
    try {
      await deleteCommissionRequest(id);
      setStatusMessage('Đã xóa brief commission.');
      if (selectedCommission?.id === id) setSelectedCommission(null);
    } catch (err: any) {
      setStatusMessage('Lỗi xóa brief: ' + err.message);
    }
  };

  const handleSaveCommSettings = async () => {
    setIsSavingCommSettings(true);
    try {
      await saveCommissionSettings(commissionSettingsForm);
      setStatusMessage('Đã lưu cấu hình Commission thành công!');
    } catch (err: any) {
      setStatusMessage('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setIsSavingCommSettings(false);
    }
  };

  // Handle URL character param
  useEffect(() => {
    if (charParam) {
      const found = characters.find(
        (c) => c.id === charParam || c.code.toLowerCase() === charParam.toLowerCase()
      );
      if (found) {
        const bp = found.profileData || ({} as any);
        setEditingChar({
          ...found,
          profileData: {
            ...bp,
            role: bp.role || '',
            status: bp.status || '',
            appearance: bp.appearance || '',
            personality: bp.personality || '',
            hobbies: bp.hobbies || '',
            dislikes: bp.dislikes || '',
            allergies: bp.allergies || '',
            habits: Array.isArray(bp.habits) ? bp.habits : [],
            specialNote: bp.specialNote || '',
            family: bp.family || '',
            relationshipStatus: bp.relationshipStatus || '',
            relationshipWithUser: bp.relationshipWithUser || '',
            about: bp.about || ''
          }
        });
        setActiveTab('characters');
      }
    }
  }, [charParam, characters]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user && res.user.email?.toLowerCase() === 'anhitoo8@gmail.com') {
        onToggleAdminStatus(true);
        setStatusMessage(`Đã đăng nhập: ${res.user.email} (Quyền Quản trị viên kích hoạt)`);
      } else {
        await signOut(auth);
        onToggleAdminStatus(false);
        setStatusMessage(
          `Từ chối truy cập: Tài khoản ${res.user?.email || ''} không có quyền Quản trị viên.`
        );
      }
    } catch (err: any) {
      console.warn('Google sign-in popup error:', err);
      setStatusMessage('Chưa hoàn tất đăng nhập. Vui lòng đăng nhập bằng tài khoản Quản trị viên.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setEditingChar(null);
    setIsCreatingChar(false);
    onToggleAdminStatus(false);
    setStatusMessage('Đã đăng xuất khỏi tài khoản Quản trị.');
  };

  const handleTestConnection = async () => {
    if (!isAdmin) return;
    setConnectionStatus('Đang kiểm tra kết nối Firestore...');
    const ok = await testConnection();
    if (ok) {
      setConnectionStatus('Kết nối Cloud Firestore hoạt động bình thường! (Verified)');
    } else {
      setConnectionStatus('Không thể kết nối Firestore trực tiếp.');
    }
  };

  // Character Actions
  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingChar) return;

    try {
      let finalChar: Character = { ...editingChar };
      const originalId = editingChar.id;

      // Auto-generate clean slug URL from character name if id is empty, generic, or legacy timestamp
      if ((!finalChar.id || finalChar.id.startsWith('char-')) && finalChar.name.trim()) {
        const cleanSlug = generateCharacterSlug(finalChar.name, characters, finalChar.id);
        finalChar.id = cleanSlug;
        finalChar.slug = cleanSlug;
      } else if (!finalChar.slug && finalChar.name.trim()) {
        finalChar.slug = slugifyVietnamese(finalChar.name);
      }

      // Fallback if still empty
      if (!finalChar.id) {
        finalChar.id = generateCharacterSlug(finalChar.name || `nhan-vat-${Date.now()}`, characters);
        finalChar.slug = finalChar.id;
      }

      await saveCharacter(finalChar);

      // If migrated from old 'char-timestamp' doc ID to a clean slug, delete the old document
      if (originalId && originalId !== finalChar.id && originalId.startsWith('char-')) {
        try {
          await deleteCharacter(originalId);
        } catch (_) {}
      }

      try {
        localStorage.removeItem(`ba_char_data_${originalId}`);
        localStorage.removeItem(`ba_char_data_${finalChar.id}`);
        if (finalChar.avatarUrl) localStorage.setItem(`ba_char_${finalChar.id}_avatarUrl`, finalChar.avatarUrl);
        if (finalChar.coverUrl) localStorage.setItem(`ba_char_${finalChar.id}_coverUrl`, finalChar.coverUrl);
        if (finalChar.posterUrl) localStorage.setItem(`ba_char_${finalChar.id}_posterUrl`, finalChar.posterUrl);
        if (finalChar.synopsisImageUrl) localStorage.setItem(`ba_char_${finalChar.id}_synopsisImageUrl`, finalChar.synopsisImageUrl);
        if (finalChar.posterObjectPosition) localStorage.setItem(`ba_char_${finalChar.id}_pos`, finalChar.posterObjectPosition);
      } catch (_) {}

      setEditingChar(null);
      setIsCreatingChar(false);
      setStatusMessage(`Đã lưu thành công nhân vật: ${finalChar.name} (Link: /character/${finalChar.id}) vào Firestore!`);
    } catch (err: any) {
      setStatusMessage('Lỗi lưu nhân vật: ' + (err?.message || 'Lỗi không xác định'));
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!isAdmin) return;
    await deleteCharacter(charId);
    setStatusMessage('Đã xóa nhân vật thành công.');
  };

  const startCreateNewCharacter = () => {
    if (!isAdmin) return;
    const nextCode = `BA-0${characters.length + 1}`;
    const newChar: Character = {
      id: '', // Will automatically populate as clean slug from character name
      slug: '',
      code: nextCode,
      name: '',
      originalChineseName: '',
      originalNovelTitle: '',
      avatarUrl: '',
      coverUrl: '',
      posterUrl: '',
      synopsisImageUrl: '',
      tagline: '',
      synopsis: '',
      isSynopsis18Plus: false,
      synopsis18WarningNote: '',
      genreIds: [],
      profileData: {
        alias: '',
        role: 'Nhân vật',
        age: '',
        birthday: '',
        height: '',
        affiliation: '',
        weapon: '',
        notes: '',
        quote: '',
        status: 'Hoạt động',
        appearance: '',
        personality: '',
        hobbies: '',
        dislikes: '',
        allergies: '',
        habits: [],
        specialNote: '',
        family: '',
        relationshipStatus: '',
        relationshipWithUser: ''
      },
      gallery: [],
      isRoleplayLocked: false,
      roleplayUnlockQuestion: '',
      roleplayUnlockAnswer: '',
      isPublished: true,
      order: characters.length + 1,
      views: 0,
      likes: 0,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingChar(newChar);
    setIsCreatingChar(true);
  };

  // Genre Actions
  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    const id = newGenreName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');
    const genre: Genre = {
      id,
      name: newGenreName.trim(),
      description: newGenreDesc.trim(),
      order: genres.length + 1
    };
    await saveGenre(genre);
    setNewGenreName('');
    setNewGenreDesc('');
    setStatusMessage('Đã thêm thể loại mới vào Firestore.');
  };

  // Quote Actions
  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    const q: Quote = {
      id: `q-${Date.now()}`,
      content: newQuoteText.trim(),
      author: newQuoteAuthor.trim() || 'BLACK APPLE Universe',
      source: newQuoteSource.trim(),
      order: quotes.length + 1
    };
    await saveQuote(q);
    setNewQuoteText('');
    setNewQuoteAuthor('');
    setNewQuoteSource('');
    setStatusMessage('Đã thêm trích dẫn mới vào Firestore.');
  };

  // Music Actions (Supports both Direct MP3 File Upload & YouTube/MP3 URL)
  const handleMusicUrlChange = async (val: string) => {
    setNewTrackUrl(val);
    if (extractYouTubeId(val) && !newTrackTitle.trim()) {
      const meta = await fetchYouTubeMetadata(val);
      if (meta) {
        setNewTrackTitle((prev) => prev.trim() || meta.title);
        setNewTrackArtist((prev) => prev.trim() || meta.artist);
      }
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploadingMusic(true);
      setMusicUploadProgress(5);
      const nextIdx = musicTracks.length;

      if (musicAddMode === 'file') {
        if (!selectedMusicFile) {
          setIsUploadingMusic(false);
          return;
        }
        await uploadMusicFileToFirestore(
          selectedMusicFile,
          newTrackTitle,
          newTrackArtist,
          nextIdx,
          (pct) => setMusicUploadProgress(pct)
        );
      } else {
        const candidateUrl =
          newTrackUrl.trim() ||
          (newTrackTitle.trim().startsWith('http') ? newTrackTitle.trim() : '');
        if (!candidateUrl) {
          setIsUploadingMusic(false);
          setStatusMessage('Vui lòng dán đường dẫn YouTube hoặc link MP3.');
          return;
        }
        let finalTitle = newTrackTitle.trim().startsWith('http') ? '' : newTrackTitle.trim();
        let finalArtist = newTrackArtist.trim();
        if (!finalTitle && extractYouTubeId(candidateUrl)) {
          const meta = await fetchYouTubeMetadata(candidateUrl);
          if (meta) {
            finalTitle = meta.title;
            finalArtist = finalArtist || meta.artist;
          }
        }
        const track: MusicTrack = {
          id: `track-${Date.now()}`,
          title: finalTitle || 'Bản nhạc mới',
          artist: finalArtist || 'BLACK APPLE Soundtrack',
          audioUrl: candidateUrl,
          duration: extractYouTubeId(candidateUrl) ? 'YouTube Audio' : 'MP3 Audio',
          isDefault: musicTracks.length === 0,
          order: nextIdx
        };
        await saveMusicTrack(track);
      }

      setNewTrackTitle('');
      setNewTrackArtist('');
      setNewTrackUrl('');
      setSelectedMusicFile(null);
      setIsUploadingMusic(false);
      setMusicUploadProgress(0);
      onSelectTrackIndex?.(nextIdx);
      onPlayTrack?.();
      setStatusMessage('Đã lưu bản nhạc vào Firestore và bắt đầu phát ngay!');
    } catch (err) {
      console.error('Lỗi thêm nhạc:', err);
      setIsUploadingMusic(false);
      setStatusMessage('Có lỗi khi tải bản nhạc lên Firestore.');
    }
  };

  // Profile Save
  const handleSaveProfile = async () => {
    await saveCreatorProfile(profileForm);
    setStatusMessage('Đã cập nhật hồ sơ tác giả vào Firestore.');
  };

  // Settings Save
  const handleSaveSettings = async () => {
    await saveSettings(settingsForm);
    setStatusMessage('Đã lưu cài đặt website vào Firestore.');
  };

  // Export / Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      characters,
      genres,
      quotes,
      creatorProfile,
      settings,
      musicTracks
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `black-apple-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Đã tải xuống tệp sao lưu dữ liệu toàn diện.');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#040406] text-neutral-200 font-serif antialiased pb-24 selection:bg-white selection:text-black">
      
      {/* Dedicated Full Top Header (Not a modal!) */}
      <header className="sticky top-0 z-40 bg-[#060608]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors group shrink-0 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform shrink-0" />
              <span>Quay lại</span>
            </button>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="text-[11px] sm:text-xs tracking-wider text-neutral-200 uppercase font-semibold truncate min-w-0">
              Không gian Quản trị · Black Apple
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-400 hidden sm:inline flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Quản trị viên (anhitoo8@gmail.com)
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 rounded text-xs flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-3 py-1 bg-white text-neutral-900 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập Quản trị</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Spacious Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6">
        
        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="mb-5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-neutral-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-500 hover:text-white text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {!isAdmin ? (
          /* Locked Screen When Not Logged In As Admin */
          <div className="max-w-md mx-auto my-14 sm:my-24 p-8 rounded-2xl bg-[#09090d] border border-white/[0.08] text-center space-y-6 shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.1] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-neutral-300" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 block font-sans font-medium">
                KHU VỰC BẢO MẬT · RESTRICTED
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Chưa đăng nhập chế độ Quản trị
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Bạn cần đăng nhập bằng tài khoản Quản trị viên chính thức để mở khóa quyền thêm mới, chỉnh sửa hoặc xóa hồ sơ nhân vật, thể loại, âm nhạc và cài đặt hệ thống.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3 font-sans">
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-white hover:bg-neutral-200 text-neutral-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập Quản trị viên (Google)</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
              >
                Quay về Trang chủ
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08] mb-6 scrollbar-none">
          {[
            { id: 'characters', label: `Nhân vật (${characters.length})`, icon: Users },
            { id: 'commissions', label: `Commission (${commissionRequests.length})`, icon: Sparkles },
            { id: 'genres', label: `Thể loại (${genres.length})`, icon: Tag },
            { id: 'quotes', label: `Trích dẫn (${quotes.length})`, icon: QuoteIcon },
            { id: 'creator', label: 'Hồ sơ Tác giả', icon: User },
            { id: 'music', label: `Âm nhạc (${musicTracks.length})`, icon: Music },
            { id: 'settings', label: 'Cài đặt giao diện', icon: Settings },
            { id: 'backup', label: 'Sao lưu & Firebase', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CHARACTERS MANAGEMENT */}
        {activeTab === 'characters' && (
          <div className="space-y-6">
            
            {/* If in edit/create character mode, render full spacious character form */}
            {editingChar ? (
              <div className="bg-[#09090d] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-widest block mb-0.5">
                      {isCreatingChar ? 'Thêm mới' : 'Chỉnh sửa hồ sơ'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {editingChar.name || 'Nhân vật mới'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingChar(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-white/[0.1] text-xs text-neutral-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCharacter}
                      className="px-4 py-1.5 rounded-lg bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu vào Firestore</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveCharacter} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Mã định danh (Code):</label>
                      <input
                        type="text"
                        value={editingChar.code || ''}
                        onChange={(e) => setEditingChar({ ...editingChar, code: e.target.value })}
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '15px' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Tên nhân vật (Việt):</label>
                      <input
                        type="text"
                        value={editingChar.name || ''}
                        onChange={(e) => {
                          const newName = e.target.value;
                          const isAutoEligible = isCreatingChar || !editingChar.id || editingChar.id.startsWith('char-');
                          if (isAutoEligible) {
                            const autoSlug = generateCharacterSlug(newName, characters, editingChar.id);
                            setEditingChar({ ...editingChar, name: newName, id: autoSlug, slug: autoSlug });
                          } else {
                            setEditingChar({ ...editingChar, name: newName, slug: editingChar.slug || slugifyVietnamese(newName) });
                          }
                        }}
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '15px' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">
                        Tên Hán tự / Chữ Hán (hiện tại thẻ Archive trang chủ):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 越 hoặc 魏肆越"
                        value={editingChar.originalChineseName || ''}
                        onChange={(e) => setEditingChar({ ...editingChar, originalChineseName: e.target.value })}
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Tác phẩm xuất xứ:</label>
                      <input
                        type="text"
                        value={editingChar.originalNovelTitle || ''}
                        onChange={(e) => setEditingChar({ ...editingChar, originalNovelTitle: e.target.value })}
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                  </div>

                  {/* URL Slug Path Configuration & Live Link Preview */}
                  <div className="p-3.5 bg-white/[0.03] border border-white/[0.1] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-200">
                          Đường dẫn URL / Slug nhân vật:
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          Tự động tạo từ tên
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Link truy cập: <code className="text-emerald-400 bg-black/60 px-2 py-0.5 rounded font-mono text-xs">/character/{editingChar.id || getCharacterSlug(editingChar) || 'ten-nhan-vat'}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={editingChar.id || ''}
                        onChange={(e) => {
                          const customSlug = slugifyVietnamese(e.target.value);
                          setEditingChar({ ...editingChar, id: customSlug, slug: customSlug });
                        }}
                        placeholder="ten-nhan-vat"
                        className="bg-[#121217] border border-white/[0.15] rounded-lg px-3 py-1.5 text-xs text-white font-mono w-48 sm:w-56"
                        title="Tùy chỉnh slug URL"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editingChar.name) {
                            const autoSlug = generateCharacterSlug(editingChar.name, characters, editingChar.id);
                            setEditingChar({ ...editingChar, id: autoSlug, slug: autoSlug });
                          }
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                        title="Tự động đồng bộ URL theo tên nhân vật"
                      >
                        Tạo từ tên
                      </button>
                    </div>
                  </div>

                  {/* GÁN THỂ LOẠI (CHỌN TỪ CÁC THỂ LOẠI ĐÃ TẠO HOẶC TẠO MỚI) */}
                  <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-xs text-neutral-200 font-semibold uppercase tracking-wider">
                          Thể Loại Nhân Vật (Chọn từ các thể loại đã tạo):
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400 font-sans">
                        {editingChar.genreIds?.length || 0} thể loại được chọn
                      </span>
                    </div>

                    {/* Danh sách thể loại đã tạo */}
                    {genres && genres.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {genres.map((g) => {
                          const isSelected = (editingChar.genreIds || []).includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                const current = editingChar.genreIds || [];
                                const next = isSelected
                                  ? current.filter((id) => id !== g.id)
                                  : [...current, g.id];
                                setEditingChar({ ...editingChar, genreIds: next });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-white text-neutral-900 font-bold shadow-md'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.08]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-neutral-900" />}
                              <span>{g.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">
                        Hiện tại chưa có thể loại nào được tạo. Bạn có thể tạo nhanh ngay bên dưới:
                      </p>
                    )}

                    {/* Tạo nhanh thể loại mới ngay trong form nhân vật */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={charFormNewGenre}
                        onChange={(e) => setCharFormNewGenre(e.target.value)}
                        placeholder="Tạo nhanh thể loại mới (VD: Thanh xuân vườn trường, Quyền anh, Hắc bang...)"
                        className="flex-1 bg-[#121217] border border-white/[0.1] rounded px-3 py-1.5 text-xs text-white"
                        style={{ fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!charFormNewGenre.trim()) return;
                          const name = charFormNewGenre.trim();
                          const id = name
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]/g, '-');
                          const newG: Genre = {
                            id,
                            name,
                            description: '',
                            order: genres.length + 1
                          };
                          await saveGenre(newG);
                          const nextIds = Array.from(new Set([...(editingChar.genreIds || []), id]));
                          setEditingChar({ ...editingChar, genreIds: nextIds });
                          setCharFormNewGenre('');
                          setStatusMessage(`Đã tạo thể loại "${name}" và gắn vào nhân vật!`);
                        }}
                        className="px-3 py-1.5 rounded bg-white/10 hover:bg-white text-white hover:text-black text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Thêm & Gắn</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Image Slots with Direct Device Upload */}
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                    <span className="text-xs text-neutral-300 font-semibold block">
                      Hình ảnh & Poster nhân vật (Tải trực tiếp từ máy hoặc URL):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Avatar (Chân dung)', field: 'avatarUrl' },
                        { label: 'Poster chính (Editorial)', field: 'posterUrl' },
                        { label: 'Ảnh bìa (Cover)', field: 'coverUrl' },
                        { label: 'Minh họa văn án', field: 'synopsisImageUrl' }
                      ].map((item) => (
                        <div key={item.field} className="space-y-1.5 text-center">
                          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-white/[0.1] bg-black">
                            <ImageWithFallback
                              src={(editingChar as any)[item.field]}
                              alt={editingChar.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[11px] text-neutral-400 block truncate">{item.label}</span>
                          <button
                            type="button"
                            onClick={() => onRequestChangeImage(editingChar, item.field)}
                            className="w-full py-1 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] rounded text-[11px] text-neutral-200 transition-colors"
                          >
                            Tải / Đổi ảnh
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tagline & Synopsis */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">
                        Câu trích dẫn đặc trưng (Quote / Thẻ trang chủ):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: “Ván này, anh chưa nhận thua.”"
                        value={editingChar.profileData.quote || editingChar.tagline || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingChar({
                            ...editingChar,
                            tagline: val,
                            profileData: { ...editingChar.profileData, quote: val }
                          });
                        }}
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '15px' }}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="block text-xs text-neutral-400">
                          Văn án cốt truyện (Giữ nguyên ngắt dòng):
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingChar({
                                ...editingChar,
                                isSynopsis18Plus: !editingChar.isSynopsis18Plus
                              })
                            }
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              editingChar.isSynopsis18Plus
                                ? 'bg-red-900/90 border-red-500 text-white shadow-sm'
                                : 'bg-white/[0.04] border-white/15 text-neutral-300 hover:border-red-500/50 hover:text-red-300'
                            }`}
                          >
                            <Lock className={`w-3.5 h-3.5 ${editingChar.isSynopsis18Plus ? 'text-red-300' : 'text-red-400'}`} />
                            <span>
                              {editingChar.isSynopsis18Plus
                                ? 'Khóa Văn Án 18+: ĐANG BẬT'
                                : 'Bật Khóa Văn Án 18+'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {editingChar.isSynopsis18Plus && (
                        <div className="mb-3 p-3 rounded-lg bg-red-950/30 border border-red-500/30 space-y-2">
                          <div className="flex items-center gap-2 text-[11px] text-red-300 font-medium">
                            <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>
                              Chế độ Khóa 18+ đang bật: Văn án sẽ hiển thị dấu khóa màu đỏ và yêu cầu người đọc xác nhận đủ 18 tuổi & hoàn toàn ý thức trước khi mở ra.
                            </span>
                          </div>
                          <div>
                            <label className="block text-[10px] text-red-300/80 mb-1">
                              Lời cảnh báo 18+ tùy chỉnh (Để trống sẽ dùng lời nhắc chuẩn mặc định):
                            </label>
                            <input
                              type="text"
                              value={editingChar.synopsis18WarningNote || ''}
                              onChange={(e) =>
                                setEditingChar({
                                  ...editingChar,
                                  synopsis18WarningNote: e.target.value
                                })
                              }
                              placeholder="VD: Văn án có yếu tố 18+, tâm lý nặng hoặc tình tiết nhạy cảm. Vui lòng cân nhắc kỹ trước khi đọc."
                              className="w-full bg-[#121217] border border-red-500/30 rounded px-3 py-1.5 text-xs text-white"
                              style={{ fontSize: '14px' }}
                            />
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={7}
                        value={editingChar.synopsis || ''}
                        onChange={(e) => setEditingChar({ ...editingChar, synopsis: e.target.value })}
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-3 text-xs text-white leading-relaxed font-sans"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                  </div>

                  {/* Character Profile Dossier Fields */}
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                    <span className="text-xs text-neutral-300 font-semibold block">
                      Thông tin cơ bản của nhân vật (Phù hợp mọi thể loại: Thanh xuân, Cổ trang, Hiện đại...):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Biệt danh / Danh xưng:
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.alias || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, alias: e.target.value }
                            })
                          }
                          placeholder="VD: Nam thần khối 12 / Tiểu hầu gia..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Thân phận / Vai trò:
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.role || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, role: e.target.value }
                            })
                          }
                          placeholder="VD: Học trưởng / Tướng quân / Tổng tài..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Tuổi & Ngày sinh:
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.age || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, age: e.target.value }
                            })
                          }
                          placeholder="VD: 18 tuổi · 14 tháng 10"
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Chiều cao / Ngoại hình:
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.height || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, height: e.target.value }
                            })
                          }
                          placeholder="VD: 185 cm"
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Xuất thân / Bối cảnh (Trường lớp, Gia tộc, Nơi ở...):
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.affiliation || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, affiliation: e.target.value }
                            })
                          }
                          placeholder="VD: THPT Nam Thành / Phủ Thừa tướng..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Đặc điểm / Sở thích / Vật gắn liền:
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.weapon || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, weapon: e.target.value }
                            })
                          }
                          placeholder="VD: Thích chơi bóng rổ, đeo đồng hồ bạc, quạt xếp..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-[11px] text-neutral-400 mb-1">
                          Tính cách / Khí chất:
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.status || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, status: e.target.value }
                            })
                          }
                          placeholder="VD: Ngoài lạnh trong nóng, dịu dàng, ngạo kiều..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CHUYÊN KHẢO HỒ SƠ CHI TIẾT (02 ĐẾN 06) */}
                  <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Chuyên Khảo Hồ Sơ Chi Tiết (Tự chủ chỉnh sửa không cần sửa code):
                      </span>
                      <span className="text-xs text-neutral-400 font-serif italic">
                        Hiển thị chuẩn Artbook
                      </span>
                    </div>

                    {/* 02. Ngoại hình */}
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        ˙✦ 02. Ngoại hình (Vóc dáng, đường nét gương mặt, trang phục...):
                      </label>
                      <textarea
                        rows={3}
                        value={editingChar.profileData.appearance || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, appearance: e.target.value }
                          })
                        }
                        placeholder="VD: Cao ráo 188cm, vai rộng, thân hình săn chắc nhờ tập boxing, mắt nâu đen, tóc đen tỉa nhiều lớp..."
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white leading-relaxed font-sans"
                        style={{ fontSize: '15px' }}
                      />
                    </div>

                    {/* 03. Tính cách */}
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        ˙✦ 03. Tính cách đặc trưng:
                      </label>
                      <textarea
                        rows={3}
                        value={editingChar.profileData.personality || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, personality: e.target.value }
                          })
                        }
                        placeholder="VD: Ngông nghênh, bất cần, nghịch ngợm, không thích làm học sinh gương mẫu nhưng không bắt nạt kẻ yếu..."
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white leading-relaxed font-sans"
                        style={{ fontSize: '15px' }}
                      />
                    </div>

                    {/* 04. Sở thích & Thói quen */}
                    <div className="p-3 bg-black/40 border border-white/[0.06] rounded-lg space-y-3">
                      <span className="text-[11px] font-semibold text-neutral-300 block">
                        ˙✦ 04. Sở thích & Thói quen:
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-emerald-400 mb-1">✓ Thích:</label>
                          <input
                            type="text"
                            value={editingChar.profileData.hobbies || ''}
                            onChange={(e) =>
                              setEditingChar({
                                ...editingChar,
                                profileData: { ...editingChar.profileData, hobbies: e.target.value }
                              })
                            }
                            placeholder="VD: Quyền Anh, chạy bộ sáng..."
                            className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                            style={{ fontSize: '15px' }}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-rose-400 mb-1">✕ Không thích:</label>
                          <input
                            type="text"
                            value={editingChar.profileData.dislikes || ''}
                            onChange={(e) =>
                              setEditingChar({
                                ...editingChar,
                                profileData: { ...editingChar.profileData, dislikes: e.target.value }
                              })
                            }
                            placeholder="VD: Đậu phụ, đồ ngọt, thuyết giáo..."
                            className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                            style={{ fontSize: '15px' }}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-amber-400 mb-1">⚠ Dị ứng:</label>
                          <input
                            type="text"
                            value={editingChar.profileData.allergies || ''}
                            onChange={(e) =>
                              setEditingChar({
                                ...editingChar,
                                profileData: { ...editingChar.profileData, allergies: e.target.value }
                              })
                            }
                            placeholder="VD: Phấn hoa..."
                            className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                            style={{ fontSize: '15px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">
                          Một vài thói quen đặc trưng (Mỗi thói quen một dòng):
                        </label>
                        <textarea
                          rows={3}
                          value={(editingChar.profileData.habits || []).join('\n')}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: {
                                ...editingChar.profileData,
                                habits: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                              }
                            })
                          }
                          placeholder="Không thích mang cặp sách&#10;Thích ngủ trong lớp nhưng dậy sớm chạy bộ&#10;Biết nấu ăn..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white leading-relaxed font-sans"
                          style={{ fontSize: '15px' }}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-amber-300 mb-1">
                          Điểm đặc biệt (Khác biệt / Yếu tố riêng độc đáo):
                        </label>
                        <input
                          type="text"
                          value={editingChar.profileData.specialNote || ''}
                          onChange={(e) =>
                            setEditingChar({
                              ...editingChar,
                              profileData: { ...editingChar.profileData, specialNote: e.target.value }
                            })
                          }
                          placeholder="VD: Không phân biệt trái và phải một cách đáng tin cậy..."
                          className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '15px' }}
                        />
                      </div>
                    </div>

                    {/* 05. Gia đình & Hoàn cảnh */}
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        ˙✦ 05. Gia đình & Hoàn cảnh cá nhân:
                      </label>
                      <textarea
                        rows={2}
                        value={editingChar.profileData.family || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, family: e.target.value }
                          })
                        }
                        placeholder="VD: Không còn bố mẹ, người thầy dạy quyền Anh hỗ trợ nhập học..."
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white leading-relaxed font-sans"
                        style={{ fontSize: '15px' }}
                      />
                    </div>

                    {/* 06. Mối quan hệ với bạn */}
                    <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-semibold text-rose-300">
                          ˙✦ 06. Mối quan hệ với bạn (Độc giả / Bạn):
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400">Trạng thái:</span>
                          <input
                            type="text"
                            value={editingChar.profileData.relationshipStatus || ''}
                            onChange={(e) =>
                              setEditingChar({
                                ...editingChar,
                                profileData: { ...editingChar.profileData, relationshipStatus: e.target.value }
                              })
                            }
                            placeholder="VD: Người yêu cũ / Bạn thân / Đối thủ..."
                            className="bg-[#121217] border border-white/[0.15] rounded px-2 py-1 text-xs text-rose-200"
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={editingChar.profileData.relationshipWithUser || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, relationshipWithUser: e.target.value }
                          })
                        }
                        placeholder="Mô tả bối cảnh và diễn biến tình cảm: Bạn từng cá cược theo đuổi, hẹn hò 2 tháng rồi chia tay, ảnh chụp màn hình bị lộ..."
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white leading-relaxed font-sans"
                        style={{ fontSize: '15px' }}
                      />
                    </div>

                    {/* 07. Một chút về nhân vật */}
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        ˙✦ 07. Một chút về nhân vật (Tự sự / Góc nhìn riêng):
                      </label>
                      <textarea
                        rows={3}
                        value={editingChar.profileData.about || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, about: e.target.value }
                          })
                        }
                        placeholder="VD: Không có tuổi thơ bất hạnh, được nuông chiều, không phải chờ Player cảm hóa..."
                        className="w-full bg-[#121217] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white leading-relaxed font-sans"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                  </div>

                  {/* QUẢN LÝ NPCS LIÊN QUAN TRỰC TIẾP */}
                  <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        Mạng Lưới NPCs Liên Quan (Quản lý trực tiếp từ Quản trị):
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {editingChar.npcs?.length || 0} NPC đã lưu
                      </span>
                    </div>

                    {/* NPC List */}
                    {editingChar.npcs && editingChar.npcs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editingChar.npcs.map((npc, idx) => (
                          <div
                            key={npc.id || idx}
                            className="p-3 rounded-lg bg-black/40 border border-white/[0.08] flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-xs">{npc.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-rose-300">
                                  {npc.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-serif">
                                {npc.description}
                              </p>
                              <span className="text-[11px] text-neutral-400 font-sans block">
                                {npc.avatarUrl ? 'Có ảnh đại diện' : 'Không dùng ảnh (Typography)'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChar({
                                  ...editingChar,
                                  npcs: editingChar.npcs?.filter((n) => n.id !== npc.id)
                                });
                              }}
                              className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Xóa NPC này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">
                        Chưa có NPC nào được gắn cho nhân vật này.
                      </p>
                    )}

                    {/* Quick Add NPC Box */}
                    <div className="p-3 bg-black/30 border border-dashed border-white/[0.1] rounded-lg space-y-3">
                      <span className="text-[11px] text-neutral-300 font-semibold block">
                        + Thêm NPC mới vào nhân vật này:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          value={adminNewNpcName}
                          onChange={(e) => setAdminNewNpcName(e.target.value)}
                          placeholder="Tên NPC (VD: Tần Thước, Chu Tấn...)"
                          className="bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-white"
                          style={{ fontSize: '14px' }}
                        />
                        <input
                          type="text"
                          value={adminNewNpcRole}
                          onChange={(e) => setAdminNewNpcRole(e.target.value)}
                          placeholder="Vai trò / Mối quan hệ (VD: Bạn thân...)"
                          className="bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1.5 text-white"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={adminNewNpcDesc}
                        onChange={(e) => setAdminNewNpcDesc(e.target.value)}
                        placeholder="Mô tả mối liên hệ giữa NPC này và nhân vật..."
                        className="w-full bg-[#121217] border border-white/[0.1] rounded p-2 text-xs text-white"
                        style={{ fontSize: '14px' }}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={adminNewNpcAvatar}
                            onChange={(e) => setAdminNewNpcAvatar(e.target.value)}
                            placeholder="URL Ảnh NPC (Để trống nếu không muốn thêm ảnh)"
                            className="w-full bg-[#121217] border border-white/[0.1] rounded px-2.5 py-1 text-[11px] text-neutral-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!adminNewNpcName.trim()) return;
                            const newNpc: CharacterNPC = {
                              id: `npc-${Date.now()}`,
                              name: adminNewNpcName.trim(),
                              role: adminNewNpcRole.trim(),
                              description: adminNewNpcDesc.trim(),
                              avatarUrl: adminNewNpcAvatar.trim()
                            };
                            setEditingChar({
                              ...editingChar,
                              npcs: [...(editingChar.npcs || []), newNpc]
                            });
                            setAdminNewNpcName('');
                            setAdminNewNpcRole('');
                            setAdminNewNpcDesc('');
                            setAdminNewNpcAvatar('');
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white text-white hover:text-neutral-900 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Gắn NPC vào nhân vật</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CỔNG KẾT NỐI LINK ROLEPLAY AI (GGAI LINK) */}
                  <div className="p-4 sm:p-5 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Cổng Kết Nối Link Roleplay AI (GGAI Link)
                        </span>
                      </div>
                      
                      {/* 2 Chế độ: Mục 1 Public vs Mục 2 Private */}
                      <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setEditingChar({ ...editingChar, isRoleplayLocked: false })}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            !editingChar.isRoleplayLocked
                              ? 'bg-emerald-400 text-black shadow'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mục 1: PUBLIC (Mở tự do)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChar({ ...editingChar, isRoleplayLocked: true })}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            editingChar.isRoleplayLocked
                              ? 'bg-amber-300 text-black shadow'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Mục 2: PRIVATE (Cần Pass)</span>
                        </button>
                      </div>
                    </div>

                    {/* Ô nhập đường dẫn link Roleplay */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-200 mb-1 flex items-center gap-1">
                        <span>Đường dẫn Link Roleplay AI (Link GGAI hoặc chat bot):</span>
                        <span className="text-neutral-400 text-[11px]">(Độc giả sẽ bấm vào link này để trò chuyện)</span>
                      </label>
                      <input
                        type="url"
                        value={editingChar.roleplayLink || ''}
                        onChange={(e) => setEditingChar({ ...editingChar, roleplayLink: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-[#121217] border border-white/[0.15] rounded-xl px-3.5 py-2.5 text-xs text-white font-sans focus:outline-none focus:border-white/30"
                        style={{ fontSize: '15px' }}
                      />
                    </div>

                    {/* Hướng dẫn và cài đặt theo chế độ đã chọn */}
                    {!editingChar.isRoleplayLocked ? (
                      <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Đang ở chế độ PUBLIC (Mở tự do):</span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80 leading-relaxed font-sans">
                          Bất kỳ ai ghé thăm hồ sơ nhân vật cũng có thể bấm thẳng vào link để bắt đầu trò chuyện trực tiếp với nhân vật mà không cần trả lời câu hỏi hay nhập mật mã.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-3">
                        <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Đang ở chế độ PRIVATE (Bảo mật / Cần giải câu hỏi hoặc nhập Pass):</span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                          Chỉ những độc giả trả lời đúng câu hỏi Canon hoặc nhập đúng mật khẩu bên dưới mới mở khóa được đường dẫn Link Roleplay.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-medium text-amber-200 mb-1">
                              Câu hỏi gợi ý mở khóa (Hiển thị cho độc giả):
                            </label>
                            <input
                              type="text"
                              value={editingChar.roleplayUnlockQuestion || ''}
                              onChange={(e) =>
                                setEditingChar({ ...editingChar, roleplayUnlockQuestion: e.target.value })
                              }
                              placeholder="VD: Nhập mật mã bí mật hoặc: Cuộc gặp gỡ đầu tiên ở đâu?"
                              className="w-full bg-[#121217] border border-white/[0.15] rounded px-3 py-1.5 text-xs text-white"
                              style={{ fontSize: '15px' }}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-amber-200 mb-1">
                              Mật khẩu / Đáp án chính xác (Pass mở khóa):
                            </label>
                            <input
                              type="text"
                              value={editingChar.roleplayUnlockAnswer || ''}
                              onChange={(e) =>
                                setEditingChar({ ...editingChar, roleplayUnlockAnswer: e.target.value })
                              }
                              placeholder="VD: 1410 hoặc Nam Thành..."
                              className="w-full bg-[#121217] border border-white/[0.15] rounded px-3 py-1.5 text-xs text-white"
                              style={{ fontSize: '15px' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setEditingChar(null)}
                      className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-semibold flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi vào Firestore</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Character List Table */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    Danh sách toàn bộ {characters.length} nhân vật trong vũ trụ Black Apple:
                  </span>
                  <button
                    onClick={startCreateNewCharacter}
                    className="px-3 py-1.5 rounded-lg bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm nhân vật mới</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char) => (
                    <div
                      key={char.id}
                      className="bg-[#09090d] border border-white/[0.08] hover:border-white/20 rounded-xl p-4 flex flex-col justify-between transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-18 rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
                          <ImageWithFallback
                            src={char.avatarUrl || char.posterUrl}
                            alt={char.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-0.5">
                            <span>#{char.code}</span>
                            <span>·</span>
                            <span className={char.isPublished !== false ? 'text-emerald-400' : 'text-amber-400'}>
                              {char.isPublished !== false ? 'Đã xuất bản' : 'Bản nháp'}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white truncate">{char.name}</h3>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {char.originalChineseName || char.originalNovelTitle || 'Chưa có thông tin phụ'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <Link
                          to={getCharacterPath(char)}
                          className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] font-mono"
                          title={`Xem hồ sơ /character/${getCharacterSlug(char)}`}
                        >
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                          <span>/{getCharacterSlug(char)}</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const bp = char.profileData || ({} as any);
                              const cleanSlug = char.slug || (char.name ? slugifyVietnamese(char.name) : char.id);
                              const effectiveId = char.id && !char.id.startsWith('char-') ? char.id : cleanSlug;
                              setEditingChar({
                                ...char,
                                id: effectiveId,
                                slug: cleanSlug,
                                profileData: {
                                  ...bp,
                                  role: bp.role || '',
                                  status: bp.status || '',
                                  appearance: bp.appearance || '',
                                  personality: bp.personality || '',
                                  hobbies: bp.hobbies || '',
                                  dislikes: bp.dislikes || '',
                                  allergies: bp.allergies || '',
                                  habits: Array.isArray(bp.habits) ? bp.habits : [],
                                  specialNote: bp.specialNote || '',
                                  family: bp.family || '',
                                  relationshipStatus: bp.relationshipStatus || '',
                                  relationshipWithUser: bp.relationshipWithUser || '',
                                  about: bp.about || ''
                                }
                              });
                            }}
                            className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.12] text-neutral-200 text-[11px] flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Chỉnh sửa</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCharacter(char.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400"
                            title="Xóa nhân vật"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: GENRES */}
        {activeTab === 'genres' && (
          <div className="space-y-6">
            <div className="p-5 bg-[#09090d] border border-white/[0.08] rounded-xl max-w-xl">
              <h3 className="text-sm font-bold text-white mb-3">Thêm thể loại mới:</h3>
              <form onSubmit={handleAddGenre} className="space-y-3">
                <input
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="Tên thể loại (VD: Hiện đại, Đô thị, Trinh thám)"
                  className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                  style={{ fontSize: '15px' }}
                  required
                />
                <input
                  type="text"
                  value={newGenreDesc}
                  onChange={(e) => setNewGenreDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt"
                  className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                  style={{ fontSize: '15px' }}
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-white text-neutral-900 text-xs font-semibold"
                >
                  Thêm thể loại
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
              {genres.map((g) => (
                <div
                  key={g.id}
                  className="p-4 bg-[#09090d] border border-white/[0.08] rounded-xl flex items-start justify-between gap-3 w-full overflow-hidden"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-semibold text-white block break-words">
                      {g.name}
                    </span>
                    <p className="text-[11px] sm:text-xs text-neutral-400 mt-1 leading-relaxed break-words">
                      {g.description || 'Không có mô tả'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteGenre(g.id);
                      setStatusMessage(`Đã xóa thể loại: ${g.name}`);
                    }}
                    className="text-neutral-500 hover:text-rose-400 p-1.5 shrink-0 cursor-pointer rounded-lg hover:bg-white/[0.04] transition-colors"
                    title="Xóa thể loại"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUOTES */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <div className="p-5 bg-[#09090d] border border-white/[0.08] rounded-xl max-w-xl">
              <h3 className="text-sm font-bold text-white mb-3">Thêm trích dẫn kinh điển:</h3>
              <form onSubmit={handleAddQuote} className="space-y-3">
                <textarea
                  rows={3}
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="Nội dung trích dẫn..."
                  className="w-full bg-[#121217] border border-white/[0.1] rounded p-2.5 text-xs text-white"
                  style={{ fontSize: '15px' }}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    placeholder="Tác giả / Nhân vật"
                    className="bg-[#121217] border border-white/[0.1] rounded px-3 py-1.5 text-xs text-white w-full"
                    style={{ fontSize: '15px' }}
                  />
                  <input
                    type="text"
                    value={newQuoteSource}
                    onChange={(e) => setNewQuoteSource(e.target.value)}
                    placeholder="Nguồn tác phẩm"
                    className="bg-[#121217] border border-white/[0.1] rounded px-3 py-1.5 text-xs text-white w-full"
                    style={{ fontSize: '15px' }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-white text-neutral-900 text-xs font-semibold cursor-pointer"
                >
                  Thêm trích dẫn
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="p-4 bg-[#09090d] border border-white/[0.08] rounded-xl flex items-start justify-between gap-3 w-full overflow-hidden"
                >
                  <div className="min-w-0 flex-1">
                    <blockquote className="text-xs sm:text-sm text-neutral-200 italic mb-1.5 break-words leading-relaxed">
                      "{q.content}"
                    </blockquote>
                    <span className="text-[11px] text-neutral-400 block break-words">
                      — {q.author} {q.source && `(${q.source})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteQuote(q.id);
                      setStatusMessage('Đã xóa trích dẫn.');
                    }}
                    className="text-neutral-500 hover:text-rose-400 p-1.5 shrink-0 cursor-pointer"
                    title="Xóa trích dẫn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CREATOR PROFILE */}
        {activeTab === 'creator' && (
          <div className="space-y-6 max-w-2xl">
            {/* Block 1: Basic Info & Bio */}
            <div className="p-6 bg-[#09090d] border border-white/[0.08] rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white mb-2">Hồ sơ Tác giả / Biên kịch:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Bút danh (Tác giả):</label>
                  <input
                    type="text"
                    value={profileForm.penName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, penName: e.target.value })}
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Châm ngôn / Trích dẫn đại diện:</label>
                  <input
                    type="text"
                    value={profileForm.quote || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, quote: e.target.value })}
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Giới thiệu bản thân (Bio):</label>
                  <textarea
                    rows={4}
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full bg-[#121217] border border-white/[0.1] rounded p-2.5 text-xs text-white leading-relaxed"
                    style={{ fontSize: '15px' }}
                  />
                </div>
              </div>
            </div>

            {/* Block 2: Social Media Edit & Add Custom Social Links */}
            <div className="p-6 bg-[#09090d] border border-white/[0.08] rounded-2xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Chỉnh sửa & Thêm Mạng Xã Hội (Social Links):
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cập nhật các liên kết mạng xã hội chính hoặc thêm nền tảng mới (TikTok, Threads, Wattpad, Telegram, X, YouTube...).
                </p>
              </div>

              {/* Core Social Networks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Facebook URL:</label>
                  <input
                    type="url"
                    value={profileForm.facebookUrl || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Instagram URL:</label>
                  <input
                    type="url"
                    value={profileForm.instagramUrl || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Discord URL:</label>
                  <input
                    type="url"
                    value={profileForm.discordUrl || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, discordUrl: e.target.value })}
                    placeholder="https://discord.gg/..."
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Email liên hệ:</label>
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="contact@blackapple.com"
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>
              </div>

              {/* Custom Social Networks List */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <span className="text-xs font-semibold text-neutral-200 block">
                  Danh sách Mạng xã hội mở rộng ({(profileForm.socialLinks || []).length}):
                </span>

                {(profileForm.socialLinks || []).length > 0 && (
                  <div className="space-y-2.5">
                    {(profileForm.socialLinks || []).map((link, idx) => (
                      <div
                        key={link.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-[#121217] border border-white/[0.08]"
                      >
                        <input
                          type="text"
                          value={link.platform || ''}
                          onChange={(e) => {
                            const updatedLinks = [...(profileForm.socialLinks || [])];
                            updatedLinks[idx] = { ...link, platform: e.target.value };
                            setProfileForm({ ...profileForm, socialLinks: updatedLinks });
                          }}
                          placeholder="Tên MXH (VD: TikTok)"
                          className="sm:w-36 bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={link.url || ''}
                          onChange={(e) => {
                            const updatedLinks = [...(profileForm.socialLinks || [])];
                            updatedLinks[idx] = { ...link, url: e.target.value };
                            setProfileForm({ ...profileForm, socialLinks: updatedLinks });
                          }}
                          placeholder="https://..."
                          className="flex-1 bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedLinks = (profileForm.socialLinks || []).filter(
                              (item) => item.id !== link.id
                            );
                            setProfileForm({ ...profileForm, socialLinks: updatedLinks });
                          }}
                          className="px-2.5 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 text-xs flex items-center justify-center gap-1 shrink-0"
                          title="Xóa mạng xã hội này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sm:hidden">Xóa</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Social Link Row */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-dashed border-white/15 space-y-2.5">
                  <span className="text-[11px] text-neutral-300 font-medium block">
                    + Thêm mạng xã hội mới:
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newSocialPlatform}
                      onChange={(e) => setNewSocialPlatform(e.target.value)}
                      placeholder="Tên nền tảng (VD: TikTok, Threads, Wattpad...)"
                      className="sm:w-48 bg-[#121217] border border-white/15 rounded px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="url"
                      value={newSocialUrl}
                      onChange={(e) => setNewSocialUrl(e.target.value)}
                      placeholder="Đường dẫn URL (https://...)"
                      className="flex-1 bg-[#121217] border border-white/15 rounded px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return;
                        const added = {
                          id: `soc-${Date.now()}`,
                          platform: newSocialPlatform.trim(),
                          url: newSocialUrl.trim()
                        };
                        setProfileForm({
                          ...profileForm,
                          socialLinks: [...(profileForm.socialLinks || []), added]
                        });
                        setNewSocialPlatform('');
                        setNewSocialUrl('');
                      }}
                      className="px-4 py-2 rounded bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm MXH</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Block 3: Avatar, Cover & Donate QR */}
            <div className="p-6 bg-[#09090d] border border-white/[0.08] rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Ảnh đại diện, Ảnh bìa & Ủng hộ (Donate):</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRequestChangeImage('avatarUrl')}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.07] hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Đổi Avatar Tác giả</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestChangeImage('coverUrl')}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.07] hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Đổi Ảnh bìa (Cover)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestChangeImage('donateQrUrl')}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.07] hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Đổi Ảnh Mã QR Donate</span>
                </button>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Lời nhắn mục Ủng hộ (Donate):</label>
                <input
                  type="text"
                  value={profileForm.supportText || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, supportText: e.target.value })}
                  className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                  style={{ fontSize: '15px' }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-900 text-xs font-bold flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu toàn bộ hồ sơ & mạng xã hội</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MUSIC */}
        {activeTab === 'music' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#09090d] border border-white/[0.08] rounded-2xl max-w-2xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Quản lý Nhạc nền (Tải File MP3 từ máy hoặc Dán Link YouTube / MP3):
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Hỗ trợ tải trực tiếp file <strong className="text-white">.mp3 / .m4a / .wav</strong> từ thiết bị của bạn hoặc dán thẳng đường dẫn <strong className="text-white">YouTube (youtu.be / youtube.com)</strong>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMusicAddMode('url')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    musicAddMode === 'url'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  1. Dán Link YouTube hoặc MP3 URL
                </button>
                <button
                  type="button"
                  onClick={() => setMusicAddMode('file')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    musicAddMode === 'file'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  2. Tải File MP3 từ máy (.mp3, .m4a, .wav)
                </button>
              </div>

              <form onSubmit={handleAddTrack} className="space-y-3.5">
                {musicAddMode === 'file' ? (
                  <div key="admin-music-file-pane" className="p-4 rounded-xl bg-[#121217] border border-dashed border-white/20 space-y-2">
                    <label className="block text-xs text-neutral-300 font-medium">
                      Chọn file MP3 / âm thanh từ thiết bị của bạn:
                    </label>
                    <input
                      key="admin-music-file-input"
                      type="file"
                      accept="audio/*,.mp3,.m4a,.wav,.ogg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedMusicFile(file);
                          if (!newTrackTitle.trim()) {
                            setNewTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
                          }
                        }
                      }}
                      className="block w-full text-xs text-neutral-300 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-neutral-200 cursor-pointer"
                    />
                    {selectedMusicFile && (
                      <p className="text-[11px] text-emerald-400">
                        Đã chọn: {selectedMusicFile.name} ({(selectedMusicFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div key="admin-music-url-pane">
                    <label className="block text-xs text-neutral-400 mb-1">
                      Đường dẫn YouTube (youtu.be / youtube.com) hoặc link MP3 trực tiếp *:
                    </label>
                    <input
                      key="admin-music-url-input"
                      type="text"
                      value={newTrackUrl ?? ''}
                      onChange={(e) => handleMusicUrlChange(e.target.value)}
                      placeholder="VD: https://youtu.be/pZEMAZyeFiE?si=... hoặc https://.../music.mp3"
                      className="w-full bg-[#121217] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">
                      Tên bài hát (để trống sẽ tự điền):
                    </label>
                    <input
                      type="text"
                      value={newTrackTitle ?? ''}
                      onChange={(e) => setNewTrackTitle(e.target.value)}
                      placeholder="VD: Playlist R&B · chill · mood"
                      className="w-full bg-[#121217] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">
                      Nghệ sĩ thể hiện:
                    </label>
                    <input
                      type="text"
                      value={newTrackArtist ?? ''}
                      onChange={(e) => setNewTrackArtist(e.target.value)}
                      placeholder="VD: afteraw. / Gaz Official"
                      className="w-full bg-[#121217] border border-white/[0.12] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {isUploadingMusic && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-300">
                      <span>Đang tải dữ liệu âm thanh lên Firestore...</span>
                      <span>{musicUploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-200"
                        style={{ width: `${musicUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingMusic || (musicAddMode === 'file' && !selectedMusicFile)}
                  className="px-5 py-2 rounded-lg bg-white hover:bg-neutral-200 disabled:opacity-50 text-neutral-900 text-xs font-bold cursor-pointer"
                >
                  {isUploadingMusic ? 'Đang tải lên...' : 'Lưu bản nhạc vào Firestore & Phát ngay'}
                </button>
              </form>
            </div>

            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-semibold text-neutral-300 block">
                Danh sách nhạc nền hiện tại ({musicTracks.length}):
              </span>
              {musicTracks.map((tr, idx) => {
                const isYt = Boolean(extractYouTubeId(tr.audioUrl));
                const isUploadedMp3 =
                  tr.audioUrl?.startsWith('firestore-chunked://') || Boolean(tr.chunkCount);
                return (
                  <div
                    key={tr.id}
                    className="p-3.5 bg-[#09090d] border border-white/[0.08] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate">
                        #{idx + 1} · {tr.title}
                      </span>
                      <span className="text-[11px] text-neutral-400 block truncate mt-0.5">
                        {tr.artist} ·{' '}
                        <span className="text-neutral-300">
                          {isYt
                            ? `YouTube (${extractYouTubeId(tr.audioUrl)})`
                            : isUploadedMp3
                            ? 'File MP3 đã tải lên Firestore'
                            : tr.audioUrl}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTrackIndex?.(idx);
                          onPlayTrack?.();
                          setStatusMessage(`Đang phát: ${tr.title}`);
                        }}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] cursor-pointer"
                      >
                        Phát ngay
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteMusicTrack(tr.id);
                          setStatusMessage(`Đã xóa bản nhạc: ${tr.title}`);
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1.5 cursor-pointer shrink-0"
                        title="Xóa bản nhạc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-6 bg-[#09090d] border border-white/[0.08] rounded-2xl max-w-2xl space-y-4">
            <h3 className="text-sm font-bold text-white mb-2">Cài đặt giao diện & thông tin web:</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Tiêu đề Website:</label>
                <input
                  type="text"
                  value={settingsForm.siteTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })}
                  className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                  style={{ fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Thông báo thanh đầu trang (Banner Notice):</label>
                <input
                  type="text"
                  value={settingsForm.bannerNotice || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bannerNotice: e.target.value })}
                  className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                  style={{ fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Chân trang (Footer text):</label>
                <input
                  type="text"
                  value={settingsForm.footerText || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                  className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                  style={{ fontSize: '15px' }}
                />
              </div>

              {/* HOT CHARACTER OF THE WEEK SPOTLIGHT CONFIGURATION */}
              <div className="pt-3 border-t border-white/[0.1] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Thiết lập Character Hot Trong Tuần (Laurel of the Week):
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Nhân vật được vinh danh trong tuần:
                  </label>
                  <select
                    value={settingsForm.hotCharacterId || 'phan-quy-man'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotCharacterId: e.target.value })}
                    className="w-full bg-[#121217] border border-white/[0.15] rounded px-3 py-2 text-xs text-white"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#121217] text-white">
                        {c.name} ({c.code}) — Lượt xem: {(c.views || 0).toLocaleString()} | Link Roleplay: {(c.roleplayClicks || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Tiêu đề danh hiệu / Giải thưởng tôn vinh:
                  </label>
                  <input
                    type="text"
                    value={settingsForm.hotCharacterAwardTitle || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotCharacterAwardTitle: e.target.value })}
                    placeholder="VD: NHÂN VẬT NỔI BẬT & ĐƯỢC QUAN TÂM NHẤT TUẦN"
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Lời nhận xét / Lý do tôn vinh (Citation):
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.hotCharacterReason || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotCharacterReason: e.target.value })}
                    placeholder="Lời khen ngợi nghệ thuật hoặc trích dẫn tiêu biểu..."
                    className="w-full bg-[#121217] border border-white/[0.1] rounded px-3 py-2 text-xs text-white leading-relaxed font-serif"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2 rounded bg-white text-neutral-900 text-xs font-semibold cursor-pointer shadow-md"
                >
                  Lưu cài đặt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COMMISSION ROLEPLAY AI MANAGEMENT */}
        {activeTab === 'commissions' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Editorial Overview Header & Stats */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0c0c10] border border-white/[0.08] shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-sans block">
                    TIẾN ĐỘ &amp; TỔNG QUAN
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-medium text-white tracking-wide">
                    Hồ Sơ Nhận Brief &amp; Slot Commission
                  </h3>
                </div>
                <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-serif text-neutral-300">
                  Tổng nhận: <span className="text-white font-semibold">{commissionRequests.length}</span> brief
                </div>
              </div>

              {/* 5 Status Cards - Pure Editorial & Monochromatic Luxury */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="p-3.5 rounded-xl bg-[#131318] border border-white/[0.06] hover:border-white/15 transition-colors">
                  <span className="text-xs text-neutral-400 block font-sans mb-1">
                    Tổng brief
                  </span>
                  <span className="text-2xl font-serif text-white block tracking-tight">
                    {commissionRequests.length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131318] border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs text-neutral-300 font-sans">
                      Chờ xử lý
                    </span>
                  </div>
                  <span className="text-2xl font-serif text-amber-200 block tracking-tight">
                    {commissionRequests.filter((r) => r.status === 'pending').length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131318] border border-white/[0.06] hover:border-white/15 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span className="text-xs text-neutral-300 font-sans">
                      Đang trao đổi
                    </span>
                  </div>
                  <span className="text-2xl font-serif text-neutral-200 block tracking-tight">
                    {commissionRequests.filter((r) => r.status === 'discussing').length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131318] border border-white/[0.06] hover:border-white/15 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs text-neutral-300 font-sans">
                      Đang viết prompt
                    </span>
                  </div>
                  <span className="text-2xl font-serif text-neutral-200 block tracking-tight">
                    {commissionRequests.filter((r) => r.status === 'writing').length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131318] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-neutral-300 font-sans">
                      Đã bàn giao
                    </span>
                  </div>
                  <span className="text-2xl font-serif text-emerald-200 block tracking-tight">
                    {commissionRequests.filter((r) => r.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Commission Settings Config Box - Clean & No Overflow */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0c0c10] border border-white/[0.08] shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-sans block">
                    CẤU HÌNH TRẠNG THÁI &amp; THÔNG TIN
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-medium text-white tracking-wide">
                    Thiết Lập Nhận Commission Roleplay AI
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCommissionSettingsForm({
                        ...commissionSettingsForm,
                        isOpen: !commissionSettingsForm.isOpen
                      })
                    }
                    className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                      commissionSettingsForm.isOpen
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/[0.05] border-white/10 text-neutral-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        commissionSettingsForm.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                      }`}
                    />
                    <span>
                      {commissionSettingsForm.isOpen ? 'Đang mở nhận slot' : 'Đang tạm đóng slot'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCommSettings}
                    disabled={isSavingCommSettings}
                    className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingCommSettings ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1.5">
                    Dòng chữ hiển thị trên Badge trạng thái:
                  </label>
                  <input
                    type="text"
                    value={commissionSettingsForm.statusBadgeText || ''}
                    onChange={(e) =>
                      setCommissionSettingsForm({
                        ...commissionSettingsForm,
                        statusBadgeText: e.target.value
                      })
                    }
                    placeholder="VD: Đang mở đăng ký slot"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.1] text-white text-sm font-sans placeholder:text-neutral-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Xuất hiện trên huy hiệu thông báo ở trang Commission của độc giả.
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1.5">
                    Tiêu đề thông báo trên Form:
                  </label>
                  <input
                    type="text"
                    value={commissionSettingsForm.announcementTitle || ''}
                    onChange={(e) =>
                      setCommissionSettingsForm({
                        ...commissionSettingsForm,
                        announcementTitle: e.target.value
                      })
                    }
                    placeholder="VD: Đăng ký Slot Commission Roleplay AI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.1] text-white text-sm font-sans placeholder:text-neutral-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Tiêu đề chính hiển thị ngay trên đầu mẫu đăng ký slot.
                  </p>
                </div>
              </div>

              <div className="font-sans text-xs">
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Đoạn lời nhắn / lưu ý gửi đến độc giả trước khi điền:
                </label>
                <textarea
                  rows={3}
                  value={commissionSettingsForm.announcementContent || ''}
                  onChange={(e) =>
                    setCommissionSettingsForm({
                      ...commissionSettingsForm,
                      announcementContent: e.target.value
                    })
                  }
                  placeholder="Nhập lời nhắn gửi đến các bạn đặt commission..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-white/[0.1] text-white text-sm font-serif leading-relaxed placeholder:text-neutral-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                />
              </div>
            </div>

            {/* Commission Slots Listing */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-serif font-medium text-white">
                    Danh Sách Slot Đăng Ký Commission
                  </span>
                  <span className="text-xs text-neutral-400 font-sans">
                    ({commissionRequests.length} lượt gửi)
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-sans">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'pending', label: 'Chờ xử lý' },
                    { id: 'discussing', label: 'Đang trao đổi' },
                    { id: 'writing', label: 'Đang làm' },
                    { id: 'completed', label: 'Đã xong' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCommStatusFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                        commStatusFilter === f.id
                          ? 'bg-white text-black font-medium shadow-sm'
                          : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Cards List */}
              {commissionRequests.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#0c0c10] border border-white/[0.06] text-center text-neutral-400 text-xs font-serif leading-relaxed">
                  Chưa có bạn nào điền form đăng ký slot commission. Khi có bạn đọc gửi form, thông tin liên hệ và brief thô sơ sẽ hiển thị tại đây.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {commissionRequests
                    .filter((r) => commStatusFilter === 'all' || r.status === commStatusFilter)
                    .map((req) => {
                      const briefText = req.roughBrief || req.personalityTone || '';
                      const timelineText = req.desiredTimeline || 'Không ghi chú';
                      return (
                        <div
                          key={req.id}
                          className="p-5 sm:p-6 rounded-2xl bg-[#0c0c10] border border-white/[0.08] hover:border-white/20 transition-all space-y-4 shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="text-base sm:text-lg font-serif font-medium text-white tracking-wide">
                                  {req.clientName}
                                </h4>
                                {req.isUrgent ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                    ⚡ Cần gấp
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans text-neutral-400 bg-white/[0.05] border border-white/[0.08]">
                                    Tiêu chuẩn
                                  </span>
                                )}
                                <span className="text-xs text-neutral-500 font-sans">
                                  {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-300 font-sans">
                                Liên hệ: <strong className="text-amber-200 font-medium">{req.contactMethod}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Status Selector */}
                              <select
                                value={req.status}
                                onChange={(e) =>
                                  handleUpdateCommStatus(req.id, e.target.value as CommissionStatus)
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium outline-none cursor-pointer border transition-colors ${
                                  req.status === 'pending'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                    : req.status === 'discussing'
                                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                                    : req.status === 'writing'
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                                    : req.status === 'completed'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                }`}
                              >
                                <option value="pending" className="bg-[#121217] text-white">
                                  Chờ xử lý
                                </option>
                                <option value="discussing" className="bg-[#121217] text-white">
                                  Đang trao đổi
                                </option>
                                <option value="writing" className="bg-[#121217] text-white">
                                  Đang thực hiện
                                </option>
                                <option value="completed" className="bg-[#121217] text-white">
                                  Đã hoàn thành
                                </option>
                                <option value="cancelled" className="bg-[#121217] text-white">
                                  Hủy slot
                                </option>
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCommission(req);
                                  setAdminNoteInput(req.adminNotes || '');
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white text-white hover:text-black text-xs font-sans font-medium transition-colors cursor-pointer"
                              >
                                Xem Chi Tiết
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteComm(req.id)}
                                className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Xóa đăng ký này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Brief & Timeline Preview */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs bg-black/40 p-4 rounded-xl border border-white/[0.04]">
                            <div className="sm:col-span-2 space-y-1">
                              <span className="text-neutral-400 block text-[11px] font-sans font-medium uppercase tracking-wider">
                                Brief thô sơ (Ý tưởng của bạn đọc):
                              </span>
                              <p className="text-neutral-200 font-serif leading-relaxed whitespace-pre-line line-clamp-3 break-words">
                                {briefText}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-neutral-400 block text-[11px] font-sans font-medium uppercase tracking-wider">
                                Thời gian mong muốn hoàn thành:
                              </span>
                              <span className="text-neutral-200 font-sans font-medium block">
                                {timelineText}
                              </span>
                            </div>
                          </div>

                          {req.adminNotes && (
                            <div className="text-xs text-amber-200/90 bg-amber-500/[0.08] px-3.5 py-2 rounded-xl border border-amber-500/20 font-serif">
                              <strong className="font-sans font-semibold">Ghi chú riêng:</strong> {req.adminNotes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Detailed Slot Modal */}
            {selectedCommission && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0e0e13] border border-white/15 p-6 sm:p-8 shadow-2xl text-neutral-200 space-y-5">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans tracking-[0.2em] text-neutral-400 uppercase block">
                        THÔNG TIN ĐĂNG KÝ SLOT COMMISSION
                      </span>
                      <h3 className="text-xl sm:text-2xl font-serif font-medium text-white tracking-wide">
                        {selectedCommission.clientName}
                      </h3>
                      <p className="text-xs text-amber-300 font-sans">
                        Liên hệ: {selectedCommission.contactMethod}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedCommission(null)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-sans mb-1">
                          Mức độ ưu tiên:
                        </span>
                        <span className="font-medium text-white text-xs">
                          {selectedCommission.isUrgent
                            ? '⚡ Cần gấp (Ưu tiên)'
                            : 'Tiêu chuẩn (Theo slot)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-sans mb-1">
                          Ngày gửi form:
                        </span>
                        <span className="font-medium text-white text-xs">
                          {new Date(selectedCommission.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-neutral-300 block text-xs font-medium uppercase tracking-wider mb-1.5">
                        Thời gian mong muốn hoàn thành:
                      </span>
                      <p className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-neutral-200 font-sans text-xs">
                        {selectedCommission.desiredTimeline || 'Không ghi chú'}
                      </p>
                    </div>

                    <div>
                      <span className="text-neutral-300 block text-xs font-medium uppercase tracking-wider mb-1.5">
                        Brief thô sơ (Ý tưởng của bạn đọc):
                      </span>
                      <p className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-neutral-200 font-serif leading-relaxed whitespace-pre-line break-words text-xs">
                        {selectedCommission.roughBrief || selectedCommission.personalityTone || ''}
                      </p>
                    </div>

                    {/* Admin Note Input */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <label className="block text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Ghi chú riêng của bạn (Báo giá, tiến độ,...):
                      </label>
                      <textarea
                        rows={3}
                        value={adminNoteInput}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                        placeholder="Nhập ghi chú riêng cho slot này..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-sans outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-neutral-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCommStatus(
                            selectedCommission.id,
                            selectedCommission.status,
                            adminNoteInput
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white text-white hover:text-black text-xs font-sans font-medium transition-colors cursor-pointer"
                      >
                        Lưu Ghi Chú
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleDeleteComm(selectedCommission.id)}
                      className="px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-sans"
                    >
                      Xóa Slot Này
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCommission(null)}
                      className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-sans font-medium transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: BACKUP & FIRESTORE */}
        {activeTab === 'backup' && (
          <div className="p-6 bg-[#09090d] border border-white/[0.08] rounded-2xl max-w-2xl space-y-5">
            <h3 className="text-sm font-bold text-white mb-1">Quản lý Dữ liệu Firestore:</h3>
            
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-xs text-neutral-300 font-semibold block">Kiểm tra kết nối Firestore:</span>
              <button
                onClick={handleTestConnection}
                className="px-3.5 py-1.5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-xs text-neutral-200"
              >
                Kiểm tra kết nối cơ sở dữ liệu
              </button>
              {connectionStatus && (
                <p className="text-xs text-neutral-400 mt-2">{connectionStatus}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <span className="text-xs text-neutral-300 font-semibold block">Xuất bản sao lưu dự phòng:</span>
              <p className="text-xs text-neutral-400">
                Lưu toàn bộ danh sách nhân vật, hình ảnh, văn án, trích dẫn về máy dưới dạng JSON.
              </p>
              <button
                onClick={handleExportBackup}
                className="px-4 py-1.5 rounded bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải tệp JSON sao lưu</span>
              </button>
            </div>
          </div>
        )}
          </>
        )}

      </div>

    </div>
  );
}
