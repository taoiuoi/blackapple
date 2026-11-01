import React, { useState } from 'react';
import { Plus, X, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { Character, GalleryImage, WebsiteSettings } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  ImageWithFallback,
  isSampleBuildImage,
  resolveDirectImageUrl
} from '../components/common/ImageWithFallback';
import { saveCharacter, updateCharacterImageUrl } from '../services/firestoreService';

interface GalleryPageProps {
  characters: Character[];
  settings: WebsiteSettings;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

interface DisplayVisualItem {
  id: string;
  url: string;
  caption: string;
  characterId: string;
  characterName: string;
  sourceType: 'gallery' | 'posterUrl' | 'coverUrl' | 'avatarUrl' | 'synopsisImageUrl';
}

export function GalleryPage({
  characters,
  settings,
  isAdmin,
  onOpenAdmin,
  isAudioPlaying,
  onToggleAudio
}: GalleryPageProps) {
  const [selectedImage, setSelectedImage] = useState<DisplayVisualItem | null>(null);
  const [isAddingVisual, setIsAddingVisual] = useState(false);
  const [targetCharId, setTargetCharId] = useState<string>(characters[0]?.id || '');
  const [newVisualUrl, setNewVisualUrl] = useState('');
  const [newVisualCaption, setNewVisualCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Collect ONLY real user-provided/Firebase-stored images (never sample build images)
  const allImages: DisplayVisualItem[] = [];
  const seenUrls = new Set<string>();

  characters.forEach((char) => {
    // 1. Explicit gallery array items
    if (Array.isArray(char.gallery)) {
      char.gallery.forEach((img) => {
        const cleanUrl = resolveDirectImageUrl(img.url);
        if (cleanUrl && !isSampleBuildImage(cleanUrl) && !seenUrls.has(`${char.id}:${cleanUrl}`)) {
          seenUrls.add(`${char.id}:${cleanUrl}`);
          allImages.push({
            id: img.id,
            url: cleanUrl,
            caption: img.caption || img.alt || char.name,
            characterId: char.id,
            characterName: char.name,
            sourceType: 'gallery'
          });
        }
      });
    }

    // 2. Character main visual slots if user saved real links/uploads in Firebase
    const slots: { field: 'posterUrl' | 'coverUrl' | 'avatarUrl' | 'synopsisImageUrl'; label: string }[] = [
      { field: 'posterUrl', label: 'Poster chính' },
      { field: 'coverUrl', label: 'Ảnh bìa' },
      { field: 'synopsisImageUrl', label: 'Minh họa Canon' },
      { field: 'avatarUrl', label: 'Chân dung' }
    ];

    slots.forEach(({ field, label }) => {
      const rawUrl = char[field];
      const cleanUrl = resolveDirectImageUrl(rawUrl || '');
      if (cleanUrl && !isSampleBuildImage(cleanUrl) && !seenUrls.has(`${char.id}:${cleanUrl}`)) {
        seenUrls.add(`${char.id}:${cleanUrl}`);
        allImages.push({
          id: `${char.id}-${field}`,
          url: cleanUrl,
          caption: `${char.name} — ${label}`,
          characterId: char.id,
          characterName: char.name,
          sourceType: field
        });
      }
    });
  });

  const handleAddVisualToCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = resolveDirectImageUrl(newVisualUrl.trim());
    if (!resolved || isSampleBuildImage(resolved)) return;
    const char = characters.find((c) => c.id === (targetCharId || characters[0]?.id));
    if (!char) return;

    setIsSaving(true);
    try {
      const newItem: GalleryImage = {
        id: `vis-${Date.now()}`,
        url: resolved,
        alt: newVisualCaption.trim() || char.name,
        caption: newVisualCaption.trim() || char.name,
        objectPosition: '50% 30%',
        isVisible: true,
        order: (char.gallery?.length || 0) + 1
      };
      await saveCharacter({
        ...char,
        gallery: [...(char.gallery || []), newItem]
      });
      setNewVisualUrl('');
      setNewVisualCaption('');
      setIsAddingVisual(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVisualItem = async (item: DisplayVisualItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const char = characters.find((c) => c.id === item.characterId);
    if (!char) return;

    if (item.sourceType === 'gallery') {
      const nextGallery = (char.gallery || []).filter(
        (g) => g.id !== item.id && resolveDirectImageUrl(g.url) !== item.url
      );
      await saveCharacter({
        ...char,
        gallery: nextGallery
      });
    } else {
      await updateCharacterImageUrl(char.id, item.sourceType, '');
    }

    if (selectedImage?.id === item.id) {
      setSelectedImage(null);
    }
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 sm:py-16 space-y-12 pb-32">
        <div className="border-b border-white/[0.08] pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-times italic text-neutral-400 block mb-1">
              Kho thị giác & Nghệ thuật
            </span>
            <h1 className="font-editorial text-3xl sm:text-5xl font-light tracking-wide text-white uppercase">
              Bộ Sưu Tập Visual
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light mt-2 max-w-lg leading-relaxed">
              Tập hợp các tác phẩm nhiếp ảnh, minh họa và mỹ học tạo hình đã lưu trên Firebase cho các nhân vật trong vũ trụ BLACK APPLE.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-times text-neutral-400">
              {allImages.length} hình ảnh lưu trữ
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (!targetCharId && characters[0]) setTargetCharId(characters[0].id);
                  setIsAddingVisual(!isAddingVisual);
                }}
                className="px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm ảnh Visual</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Quick Add Visual Form */}
        {isAdmin && isAddingVisual && (
          <form
            onSubmit={handleAddVisualToCharacter}
            className="p-6 rounded-2xl bg-[#0b0b0f] border border-white/15 space-y-4 max-w-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Thêm ảnh mới vào Bộ sưu tập Visual (Lưu Firebase)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingVisual(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Thuộc về Nhân vật:</label>
                <select
                  value={targetCharId || characters[0]?.id || ''}
                  onChange={(e) => setTargetCharId(e.target.value)}
                  className="w-full bg-[#141419] border border-white/15 rounded-lg px-3 py-2 text-white"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Chú thích / Tên tác phẩm:</label>
                <input
                  type="text"
                  value={newVisualCaption}
                  onChange={(e) => setNewVisualCaption(e.target.value)}
                  placeholder="VD: Minh họa chương 1..."
                  className="w-full bg-[#141419] border border-white/15 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Dán đường dẫn ảnh (URL trực tiếp, Google Drive, Pinterest, Imgur...):</span>
              </label>
              <input
                type="text"
                required
                value={newVisualUrl}
                onChange={(e) => setNewVisualUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#141419] border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingVisual(false)}
                className="px-4 py-1.5 rounded-lg bg-white/10 text-xs text-neutral-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu vào Firebase'}
              </button>
            </div>
          </form>
        )}

        {allImages.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl space-y-2">
            <p className="text-xs text-neutral-300 font-serif">
              Chưa có hình ảnh nào trong bộ sưu tập.
            </p>
            <p className="text-[11px] text-neutral-500 font-serif">
              Chỉ những hình ảnh bạn cung cấp link hoặc tải lên lưu ở Firebase mới được hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {allImages.map((item, index) => (
              <div
                key={`${item.characterId}-${item.id}-${index}`}
                onClick={() => setSelectedImage(item)}
                className="group cursor-pointer space-y-3 relative"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-950 border border-white/[0.06] group-hover:border-white/30 transition-all duration-500">
                  <ImageWithFallback
                    src={item.url}
                    alt={item.caption || item.characterName}
                    objectPosition="center"
                    className="w-full h-full object-cover filter contrast-[1.05] grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <span className="absolute bottom-3 left-3 text-xs font-times italic text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.characterName}
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVisualItem(item, e)}
                      className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/75 hover:bg-rose-600 text-white border border-white/15 transition-colors"
                      title="Xóa ảnh này khỏi Firebase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 font-light">
                  <span className="font-editorial italic text-neutral-200 truncate">
                    {item.caption || item.characterName}
                  </span>
                  <span className="text-xs font-times text-neutral-400">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.caption}
              className="max-w-full max-h-[75vh] object-contain rounded-lg border border-white/10 shadow-2xl"
            />
            {selectedImage.caption && (
              <p className="mt-4 text-xs font-editorial italic text-neutral-300 tracking-wide text-center">
                {selectedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      <Footer settings={settings} onNavigate={() => {}} onOpenAdmin={onOpenAdmin} />
    </div>
  );
}
