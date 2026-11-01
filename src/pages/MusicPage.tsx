import { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Trash2,
  Disc,
  Upload,
  Link as LinkIcon,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { MusicTrack, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  saveMusicTrack,
  deleteMusicTrack,
  extractYouTubeId,
  fetchYouTubeMetadata,
  uploadMusicFileToFirestore
} from '../services/firestoreService';

interface MusicPageProps {
  tracks: MusicTrack[];
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  currentTrackIndex: number;
  onSelectTrackIndex: (index: number) => void;
}

export function MusicPage({
  tracks,
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio,
  currentTrackIndex,
  onSelectTrackIndex
}: MusicPageProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'file'>('url');
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const current = tracks[currentTrackIndex] || tracks[0];

  // Auto-fill title & artist when pasting a YouTube link
  const handleUrlChange = async (val: string) => {
    setNewUrl(val);
    if (extractYouTubeId(val) && !newTitle.trim()) {
      const meta = await fetchYouTubeMetadata(val);
      if (meta) {
        setNewTitle((prev) => prev.trim() || meta.title);
        setNewArtist((prev) => prev.trim() || meta.artist);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!newTitle.trim()) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      setIsUploading(true);
      setUploadProgress(5);
      const nextTrackIdx = tracks.length;

      if (addMode === 'file') {
        if (!selectedFile) {
          setIsUploading(false);
          return;
        }
        await uploadMusicFileToFirestore(
          selectedFile,
          newTitle,
          newArtist,
          nextTrackIdx,
          (pct) => setUploadProgress(pct)
        );
      } else {
        const candidateUrl = newUrl.trim() || (newTitle.trim().startsWith('http') ? newTitle.trim() : '');
        if (!candidateUrl) {
          setIsUploading(false);
          setStatusMsg('Vui lòng dán đường dẫn YouTube hoặc link MP3.');
          return;
        }
        let finalTitle = newTitle.trim().startsWith('http') ? '' : newTitle.trim();
        let finalArtist = newArtist.trim();
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
          isDefault: false,
          order: nextTrackIdx
        };
        await saveMusicTrack(track);
      }

      setNewTitle('');
      setNewArtist('');
      setNewUrl('');
      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      setIsAdding(false);
      onSelectTrackIndex(nextTrackIdx);
      if (!isAudioPlaying) onToggleAudio();
      setStatusMsg('Đã lưu bản nhạc vào Firestore và bắt đầu phát ngay!');
    } catch (err) {
      console.error('Lỗi tải nhạc:', err);
      setIsUploading(false);
      setStatusMsg('Có lỗi xảy ra khi lưu bản nhạc. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMusicTrack(id);
  };

  return (
    <div className="min-h-screen bg-[#030304] text-[#f4f4f6] font-content flex flex-col selection:bg-white selection:text-black">
      <Navbar
        onOpenAdmin={onOpenAdmin}
        isAdmin={isAdmin}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        siteTitle={settings.siteTitle}
        logoUrl={settings.logoUrl}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-12 py-12 sm:py-16 space-y-12 pb-32">
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-times italic text-neutral-400 block mb-1">
              Không gian âm hưởng
            </span>
            <h1 className="font-editorial text-3xl sm:text-5xl font-light tracking-wide text-white uppercase">
              Soundtrack Vũ Trụ
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light mt-2 max-w-lg leading-relaxed">
              Hỗ trợ phát trực tiếp cả <strong className="text-white font-medium">File MP3 tải từ máy</strong>, <strong className="text-white font-medium">Link YouTube</strong> và <strong className="text-white font-medium">URL MP3</strong>.
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setAddMode('file');
                  setIsAdding(true);
                }}
                className="px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-medium tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải file MP3 từ máy</span>
              </button>
              <button
                onClick={() => {
                  setAddMode('url');
                  setIsAdding(true);
                }}
                className="px-4 py-2 rounded-full border border-white/25 hover:border-white/60 bg-white/5 text-neutral-200 text-xs font-serif tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dán Link YouTube / MP3</span>
              </button>
            </div>
          )}
        </div>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Add Track Form (Supports both File Upload & YouTube/MP3 URL) */}
        {isAdding && (
          <form
            onSubmit={handleAddTrack}
            className="p-6 rounded-2xl bg-[#0b0b10] border border-white/15 space-y-5 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddMode('file')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    addMode === 'file'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải file MP3 từ máy (.mp3, .m4a, .wav)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('url')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    addMode === 'url'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Dán Link YouTube hoặc MP3 URL</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addMode === 'file' ? (
              <div key="music-file-pane" className="space-y-3">
                <label className="block text-xs text-neutral-300">
                  Chọn file âm thanh từ máy tính / điện thoại (.mp3, .m4a, .wav, .ogg):
                </label>
                <input
                  key="music-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border border-dashed border-white/25 hover:border-white/60 bg-white/[0.02] hover:bg-white/[0.04] text-center cursor-pointer transition-all"
                >
                  <Upload className="w-6 h-6 text-neutral-300 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-semibold text-white">{selectedFile.name}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Dung lượng: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Nhấn để đổi file khác
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-neutral-200 font-medium">
                        Bấm vào đây để chọn file MP3 từ thiết bị của bạn
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Hệ thống tự động chia nhỏ và lưu trữ trực tiếp lên Firebase Firestore
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key="music-url-pane">
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Đường dẫn YouTube (youtu.be / youtube.com) hoặc link file MP3 trực tiếp *:
                </label>
                <input
                  key="music-url-input"
                  type="text"
                  required
                  value={newUrl ?? ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="VD: https://youtu.be/pZEMAZyeFiE?si=... hoặc https://.../song.mp3"
                  className="w-full bg-white/[0.04] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Khi dán link YouTube, hệ thống sẽ tự động lấy tên bài hát và phát trực tiếp qua trình phát ẩn.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Tên bài hát (để trống sẽ tự lấy theo file / YouTube)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Drill Miên — 阿YueYue (Gaz Mix)"
                  className="w-full bg-white/[0.04] border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Nghệ sĩ trình bày</label>
                <input
                  type="text"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  placeholder="Gaz Official / Voheis"
                  className="w-full bg-white/[0.04] border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tải và đồng bộ lên Firebase Firestore...</span>
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isUploading || (addMode === 'file' && !selectedFile)}
                className="px-5 py-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 text-xs font-semibold rounded-lg cursor-pointer"
              >
                {isUploading ? 'Đang lưu...' : 'Lưu vào Firestore & Phát'}
              </button>
            </div>
          </form>
        )}

        {/* Central Record Vinyl / Player Focus */}
        <div className="relative p-8 sm:p-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 mb-8">
            <div
              className={`w-full h-full rounded-full border border-white/20 bg-neutral-900/80 shadow-[0_0_50px_rgba(255,255,255,0.06)] flex items-center justify-center ${
                isAudioPlaying ? 'animate-[spin_8s_linear_infinite]' : ''
              }`}
            >
              <div className="w-16 h-16 rounded-full border border-white/10 bg-black flex items-center justify-center">
                <Disc className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
          </div>

          <span className="text-xs font-times italic text-neutral-400 block mb-2">
            {isAudioPlaying ? 'Đang phát · Now playing' : 'Tạm dừng · Paused'}
          </span>
          <h2 className="font-editorial text-2xl sm:text-4xl font-light tracking-wide text-white max-w-xl">
            {current?.title || 'Chưa chọn bài hát'}
          </h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            {current?.artist || 'Voheis'}
          </p>

          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={() =>
                onSelectTrackIndex((currentTrackIndex - 1 + tracks.length) % tracks.length)
              }
              className="p-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Bài trước"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleAudio}
              className="w-14 h-14 rounded-full bg-white text-black hover:bg-neutral-200 transition-transform active:scale-95 flex items-center justify-center shadow-xl cursor-pointer"
              aria-label={isAudioPlaying ? 'Dừng' : 'Phát'}
            >
              {isAudioPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-1" />
              )}
            </button>

            <button
              onClick={() => onSelectTrackIndex((currentTrackIndex + 1) % tracks.length)}
              className="p-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Bài tiếp theo"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="space-y-2">
          <span className="text-xs font-times italic text-neutral-400 block mb-3">
            Danh sách bài hát ({tracks.length})
          </span>

          <div className="divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.01]">
            {tracks.map((t, idx) => {
              const isYt = Boolean(extractYouTubeId(t.audioUrl));
              const isUploadedMp3 =
                t.audioUrl?.startsWith('firestore-chunked://') || Boolean(t.chunkCount);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTrackIndex(idx);
                    if (!isAudioPlaying) onToggleAudio();
                  }}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                    idx === currentTrackIndex ? 'bg-white/[0.05]' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-times text-neutral-400 w-6 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4
                        className={`text-sm truncate ${
                          idx === currentTrackIndex
                            ? 'text-white font-medium'
                            : 'text-neutral-300 font-light'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <span className="text-xs text-neutral-500 font-light block truncate">
                        {t.artist} · {isYt ? 'YouTube Audio' : isUploadedMp3 ? 'File MP3 đã tải lên' : 'MP3 Stream'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {idx === currentTrackIndex && isAudioPlaying && (
                      <span className="text-xs font-times italic text-white/90 animate-pulse">
                        Đang phát
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t.id);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 cursor-pointer"
                        title="Xóa bài hát"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer settings={settings} onNavigate={() => {}} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
