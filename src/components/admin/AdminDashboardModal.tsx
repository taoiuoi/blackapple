import { useState } from 'react';
import {
  X,
  Shield,
  Users,
  Image as ImageIcon,
  Tag,
  Quote as QuoteIcon,
  MessageSquare,
  User,
  Settings,
  Music,
  Download,
  Database,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  LogIn,
  LogOut
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, testConnection } from '../../lib/firebase';
import {
  Character,
  Genre,
  Quote,
  CreatorProfile,
  WebsiteSettings,
  MusicTrack
} from '../../types';
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
  deleteMusicTrack
} from '../../services/firestoreService';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onToggleAdminStatus: (status: boolean) => void;
  characters: Character[];
  genres: Genre[];
  quotes: Quote[];
  creatorProfile: CreatorProfile;
  settings: WebsiteSettings;
  musicTracks: MusicTrack[];
  onRequestChangeImage: (
    charOrField: any,
    fieldOrNone?: any
  ) => void;
}

export function AdminDashboardModal({
  isOpen,
  onClose,
  isAdmin,
  onToggleAdminStatus,
  characters,
  genres,
  quotes,
  creatorProfile,
  settings,
  musicTracks,
  onRequestChangeImage
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<
    'characters' | 'genres' | 'quotes' | 'creator' | 'settings' | 'music' | 'backup'
  >('characters');

  // Character editing state
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isCreatingChar, setIsCreatingChar] = useState(false);

  // Genre form
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDesc, setNewGenreDesc] = useState('');

  // Quote form
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');

  // Music form
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');

  // Editable Profile & Settings copies
  const [profileForm, setProfileForm] = useState<CreatorProfile>({ ...creatorProfile });
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({ ...settings });

  // Test connection state
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user && res.user.email?.toLowerCase() === 'anhitoo8@gmail.com') {
        onToggleAdminStatus(true);
        setStatusMessage('Đã đăng nhập Quản trị viên thành công: ' + res.user.email);
      } else {
        await signOut(auth);
        onToggleAdminStatus(false);
        setStatusMessage(`Từ chối truy cập: Tài khoản ${res.user?.email || ''} không có quyền Quản trị viên.`);
      }
    } catch (err: any) {
      console.warn('Google sign-in popup note:', err);
      setStatusMessage('Chưa hoàn tất đăng nhập. Vui lòng đăng nhập bằng tài khoản Quản trị viên.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
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
      await saveCharacter(editingChar);
      setEditingChar(null);
      setIsCreatingChar(false);
      setStatusMessage(`Đã lưu thành công nhân vật: ${editingChar.name} vào Firestore!`);
    } catch (err) {
      setStatusMessage('Lỗi lưu nhân vật vào Firestore');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!isAdmin) return;
    await deleteCharacter(charId);
    setStatusMessage('Đã xóa nhân vật thành công.');
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

  // Music Actions
  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim() || !newTrackUrl.trim()) return;
    const track: MusicTrack = {
      id: `track-${Date.now()}`,
      title: newTrackTitle.trim(),
      artist: newTrackArtist.trim() || 'BLACK APPLE Soundtrack',
      audioUrl: newTrackUrl.trim(),
      duration: '03:00',
      isDefault: musicTracks.length === 0,
      order: musicTracks.length + 1
    };
    await saveMusicTrack(track);
    setNewTrackTitle('');
    setNewTrackArtist('');
    setNewTrackUrl('');
    setStatusMessage('Đã thêm bài hát URL MP3 vào Firestore.');
  };

  // Profile Save
  const handleSaveProfile = async () => {
    await saveCreatorProfile(profileForm);
    setStatusMessage('Đã cập nhật hồ sơ tác giả vào Firestore.');
  };

  // Settings Save
  const handleSaveSettings = async () => {
    await saveSettings(settingsForm);
    setStatusMessage('Đã lưu cấu hình website vào Firestore.');
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
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0c0c11] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#101015] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <Shield className="w-4 h-4 text-neutral-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bảng Quản trị Toàn phần</span>
                <span className="text-[10px] font-serif px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  BLACK APPLE CMS
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Toàn quyền quản lý dữ liệu lưu trữ trực tiếp trên Cloud Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin ? (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-200 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập Admin</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Quyền Admin đã mở
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white border border-neutral-800 rounded"
                >
                  <LogOut className="w-3 h-3 inline mr-1" /> Thoát
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              aria-label="Đóng bảng quản trị"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="px-6 py-2 bg-neutral-900/90 border-b border-neutral-800 text-xs text-neutral-200 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-neutral-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-[#0d0d12] border-b border-neutral-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => { setActiveTab('characters'); setEditingChar(null); }}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'characters' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Nhân vật ({characters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('genres')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'genres' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Mục lục thể loại ({genres.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quotes' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QuoteIcon className="w-4 h-4" />
            <span>Trích dẫn ({quotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('creator')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'creator' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Tác giả & QR Donate</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cấu hình Website</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'music' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Nhạc nền MP3 ({musicTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup' ? 'border-neutral-200 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Sao lưu & Firestore</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {/* TAB: CHARACTERS */}
          {activeTab === 'characters' && (
            <div>
              {editingChar ? (
                /* Character Editor Form */
                <form onSubmit={handleSaveCharacter} className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {isCreatingChar ? 'Thêm nhân vật mới' : `Chỉnh sửa: ${editingChar.name}`}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setEditingChar(null); setIsCreatingChar(false); }}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      ← Quay lại danh sách
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Tên nhân vật *</label>
                      <input
                        type="text"
                        required
                        value={editingChar.name}
                        onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })}
                        className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Mã số hồ sơ (Code) *</label>
                      <input
                        type="text"
                        required
                        value={editingChar.code}
                        onChange={(e) => setEditingChar({ ...editingChar, code: e.target.value })}
                        placeholder="Ví dụ: 10-0 / BA-01"
                        className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Tagline định hướng *</label>
                    <input
                      type="text"
                      required
                      value={editingChar.tagline}
                      onChange={(e) => setEditingChar({ ...editingChar, tagline: e.target.value })}
                      className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* Image URLs direct input */}
                  <div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                      Hệ thống URL hình ảnh trực tiếp (Direct Image URL)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">URL Avatar *</label>
                        <input
                          type="url"
                          required
                          value={editingChar.avatarUrl}
                          onChange={(e) => setEditingChar({ ...editingChar, avatarUrl: e.target.value })}
                          className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">URL Poster Carousel *</label>
                        <input
                          type="url"
                          required
                          value={editingChar.posterUrl}
                          onChange={(e) => setEditingChar({ ...editingChar, posterUrl: e.target.value })}
                          className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">URL Ảnh bìa (Cover)</label>
                        <input
                          type="url"
                          value={editingChar.coverUrl || ''}
                          onChange={(e) => setEditingChar({ ...editingChar, coverUrl: e.target.value })}
                          className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">URL Minh họa Văn án</label>
                        <input
                          type="url"
                          value={editingChar.synopsisImageUrl || ''}
                          onChange={(e) => setEditingChar({ ...editingChar, synopsisImageUrl: e.target.value })}
                          className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Synopsis */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Văn án tác phẩm *</label>
                    <textarea
                      required
                      rows={4}
                      value={editingChar.synopsis}
                      onChange={(e) => setEditingChar({ ...editingChar, synopsis: e.target.value })}
                      className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white resize-none"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* Profile data fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Vai trò</label>
                      <input
                        type="text"
                        value={editingChar.profileData.role || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, role: e.target.value }
                          })
                        }
                        className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Vũ khí / Khí tài</label>
                      <input
                        type="text"
                        value={editingChar.profileData.weapon || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, weapon: e.target.value }
                          })
                        }
                        className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Trạng thái</label>
                      <input
                        type="text"
                        value={editingChar.profileData.status || ''}
                        onChange={(e) =>
                          setEditingChar({
                            ...editingChar,
                            profileData: { ...editingChar.profileData, status: e.target.value }
                          })
                        }
                        className="w-full bg-[#14141a] border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => { setEditingChar(null); setIsCreatingChar(false); }}
                      className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu hồ sơ vào Firestore</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Character List Table */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400">
                      Danh sách nhân vật trong cơ sở dữ liệu Firestore. Mọi thay đổi sẽ có hiệu lực ngay lập tức.
                    </p>
                    <button
                      onClick={() => {
                        const newId = `char-${Date.now()}`;
                        setEditingChar({
                          id: newId,
                          name: '',
                          code: 'BA-NEW',
                          tagline: '',
                          genreIds: ['dark-fantasy'],
                          avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600',
                          coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200',
                          posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
                          synopsis: '',
                          profileData: { role: 'Nhân vật mới', status: 'Hoạt động' },
                          gallery: [],
                          views: 0,
                          likes: 0,
                          featured: false,
                          order: characters.length + 1,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        });
                        setIsCreatingChar(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-200 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo nhân vật mới</span>
                    </button>
                  </div>

                  <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-[#101015]">
                    {characters.map((char) => (
                      <div key={char.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={char.avatarUrl}
                            alt={char.name}
                            targetWidth={120}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-900 border border-neutral-700 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-serif text-neutral-400 mr-2">#{char.code}</span>
                            <span className="text-sm font-semibold text-white">{char.name}</span>
                            <p className="text-xs text-neutral-400 line-clamp-1">{char.tagline}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onRequestChangeImage(char, 'avatarUrl')}
                            className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 flex items-center gap-1"
                            title="Thay URL avatar"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Đổi ảnh</span>
                          </button>
                          <button
                            onClick={() => setEditingChar(char)}
                            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCharacter(char.id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400"
                            title="Xóa nhân vật"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GENRES */}
          {activeTab === 'genres' && (
            <div className="space-y-6">
              <form onSubmit={handleAddGenre} className="p-4 bg-[#121218] border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Thêm thể loại mới</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Tên thể loại *</label>
                    <input
                      type="text"
                      required
                      value={newGenreName}
                      onChange={(e) => setNewGenreName(e.target.value)}
                      placeholder="Ví dụ: Kỳ Ảo Đô Thị"
                      className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Mô tả ngắn</label>
                    <input
                      type="text"
                      value={newGenreDesc}
                      onChange={(e) => setNewGenreDesc(e.target.value)}
                      placeholder="Mô tả đặc trưng thể loại"
                      className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-200 text-neutral-900 rounded text-xs font-semibold hover:bg-white"
                >
                  Thêm vào Firestore
                </button>
              </form>

              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl bg-[#101015]">
                {genres.map((g) => (
                  <div key={g.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white mr-2">{g.name}</span>
                      <span className="text-neutral-500 font-serif text-[11px]">({g.id})</span>
                      <p className="text-neutral-400 text-[11px] mt-0.5">{g.description}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Xóa thể loại này?')) {
                          await deleteGenre(g.id);
                        }
                      }}
                      className="text-neutral-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: QUOTES */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <form onSubmit={handleAddQuote} className="p-4 bg-[#121218] border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Thêm trích dẫn mới</h4>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Nội dung trích dẫn *</label>
                  <textarea
                    required
                    rows={2}
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    placeholder="Câu nói mang tính triết học hoặc ấn tượng..."
                    className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Tác giả / Nhân vật phát biểu</label>
                    <input
                      type="text"
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      placeholder="Ngụy Tứ Việt"
                      className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Nguồn trích / Chương</label>
                    <input
                      type="text"
                      value={newQuoteSource}
                      onChange={(e) => setNewQuoteSource(e.target.value)}
                      placeholder="Tập 1: Khởi Nguyên"
                      className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-200 text-neutral-900 rounded text-xs font-semibold hover:bg-white"
                >
                  Lưu trích dẫn vào Firestore
                </button>
              </form>

              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl bg-[#101015]">
                {quotes.map((q) => (
                  <div key={q.id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <p className="font-editorial italic text-neutral-200 text-sm">"{q.content}"</p>
                      <span className="text-neutral-400 text-[11px] block mt-1">
                        — {q.author} {q.source ? `(${q.source})` : ''}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Xóa trích dẫn này?')) {
                          await deleteQuote(q.id);
                        }
                      }}
                      className="text-neutral-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CREATOR PROFILE */}
          {activeTab === 'creator' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Thông tin tác giả, mạng xã hội và liên kết ảnh QR Donate
                </span>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu hồ sơ tác giả
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Bút danh (Pen Name)</label>
                  <input
                    type="text"
                    value={profileForm.penName}
                    onChange={(e) => setProfileForm({ ...profileForm, penName: e.target.value })}
                    className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Câu nói tâm đắc (Quote)</label>
                <input
                  type="text"
                  value={profileForm.quote}
                  onChange={(e) => setProfileForm({ ...profileForm, quote: e.target.value })}
                  className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Tiểu sử tác giả (Bio)</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">URL Avatar Tác giả</label>
                  <input
                    type="url"
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                    className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">URL Ảnh QR Donate *</label>
                  <input
                    type="url"
                    value={profileForm.donateQrUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, donateQrUrl: e.target.value })}
                    placeholder="https://... ảnh QR"
                    className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Liên kết Facebook</label>
                  <input
                    type="url"
                    value={profileForm.facebookUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, facebookUrl: e.target.value })}
                    className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Liên kết Discord</label>
                  <input
                    type="url"
                    value={profileForm.discordUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, discordUrl: e.target.value })}
                    className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Cấu hình tiêu đề, logo và thông điệp hiển thị toàn website
                </span>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu cấu hình
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Tiêu đề Website (Site Title)</label>
                <input
                  type="text"
                  value={settingsForm.siteTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })}
                  className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">URL Logo (Tùy chọn)</label>
                <input
                  type="url"
                  value={settingsForm.logoUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Thông báo Banner chạy đầu trang</label>
                <input
                  type="text"
                  value={settingsForm.bannerNotice || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bannerNotice: e.target.value })}
                  className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Dòng chữ bản quyền Chân trang (Footer)</label>
                <input
                  type="text"
                  value={settingsForm.footerText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                  className="w-full bg-[#14141a] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          )}

          {/* TAB: MUSIC */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-neutral-400">
                <strong className="text-neutral-200 block mb-0.5">Cơ chế phát nhạc không phụ thuộc Storage tính phí:</strong>
                Admin cung cấp trực tiếp đường dẫn file âm thanh công khai (MP3 URL). Metadata và URL được lưu vào Firestore.
              </div>

              <form onSubmit={handleAddTrack} className="p-4 bg-[#121218] border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Thêm bản nhạc mới vào Playlist</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Tên bài hát / Giai điệu *</label>
                    <input
                      type="text"
                      required
                      value={newTrackTitle}
                      onChange={(e) => setNewTrackTitle(e.target.value)}
                      placeholder="Swim — So Hard to Ignore You"
                      className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Nghệ sĩ / Trình bày</label>
                    <input
                      type="text"
                      value={newTrackArtist}
                      onChange={(e) => setNewTrackArtist(e.target.value)}
                      placeholder="Voheis & Ambient Collective"
                      className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">URL file MP3 (HTTPS) *</label>
                  <input
                    type="url"
                    required
                    value={newTrackUrl}
                    onChange={(e) => setNewTrackUrl(e.target.value)}
                    placeholder="https://assets.mixkit.co/music/preview/..."
                    className="w-full bg-[#16161c] border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-200 text-neutral-900 rounded text-xs font-semibold hover:bg-white"
                >
                  Lưu bài hát vào Firestore
                </button>
              </form>

              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl bg-[#101015]">
                {musicTracks.map((t) => (
                  <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white mr-2">{t.title}</span>
                      <span className="text-neutral-400">{t.artist}</span>
                      <p className="text-[10px] text-neutral-500 truncate max-w-md mt-0.5">{t.audioUrl}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Xóa bài hát này?')) {
                          await deleteMusicTrack(t.id);
                        }
                      }}
                      className="text-neutral-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: BACKUP & FIRESTORE STATUS */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#121218] border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Trạng thái kết nối Cloud Firestore
                </h4>
                <p className="text-xs text-neutral-400">
                  Kiểm tra tính sẵn sàng của cơ sở dữ liệu thời gian thực và quyền ghi dữ liệu.
                </p>
                <button
                  onClick={handleTestConnection}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700"
                >
                  Kiểm tra kết nối máy chủ Firestore
                </button>
                {connectionStatus && (
                  <p className="text-xs text-emerald-400 mt-2 font-serif">{connectionStatus}</p>
                )}
              </div>

              <div className="p-5 bg-[#121218] border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Sao lưu dữ liệu (Data Backup)
                </h4>
                <p className="text-xs text-neutral-400">
                  Xuất toàn bộ hồ sơ nhân vật, thể loại, trích dẫn, thông tin tác giả và cấu hình hiện tại thành tệp JSON để lưu trữ an toàn.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-neutral-200 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-2 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp sao lưu JSON về máy tính</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
