import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  Check,
  Send,
  Image as ImageIcon,
  ShieldAlert,
  ExternalLink,
  Tag,
  X,
  ArrowLeft,
  KeyRound,
  Sparkles,
  MessageSquare,
  CornerDownRight
} from 'lucide-react';
import {
  Character,
  CharacterNPC,
  Genre,
  Comment,
  WebsiteSettings
} from '../types';
import { INITIAL_CHARACTERS } from '../data/initialData';
import { parseQuestionAndHint } from '../utils/questionParser';
import {
  subscribeComments,
  submitComment,
  deleteComment,
  replyComment,
  saveCharacter,
  saveGenre,
  deleteGenre,
  normalizeCharacter,
  incrementCharacterViews,
  incrementRoleplayClicks
} from '../services/firestoreService';
import {
  subscribeCommentsSupabase,
  submitCommentSupabase,
  incrementCharacterViewsSupabase,
  incrementRoleplayClicksSupabase
} from '../services/supabaseService';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { QuickScrollScrubber } from '../components/common/QuickScrollScrubber';
import { matchesCharacter, getCharacterSlug } from '../utils/slugify';

const profileSections = [
  { id: 'dossier-hero', label: 'Đầu trang · Chân dung' },
  { id: 'canon-section', label: '01. Hồ sơ căn bản đã Canon' },
  { id: 'dossier-details-section', label: '02–07. Chuyên khảo chi tiết' },
  { id: 'synopsis-section', label: 'Văn án tác phẩm' },
  { id: 'ggai-section', label: 'Link GGAI Roleplay' },
  { id: 'comments-section', label: 'Lưu bút bình luận' }
];

interface CharacterProfilePageProps {
  characters: Character[];
  genres: Genre[];
  isAdmin: boolean;
  settings: WebsiteSettings;
  onCharacterUpdated: (char: Character) => void;
  onRequestChangeCharacterImage: (
    char: Character,
    field: 'avatarUrl' | 'coverUrl' | 'posterUrl' | 'synopsisImageUrl'
  ) => void;
  onOpenAdmin?: () => void;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  onReplayIntro?: () => void;
}

export const CharacterProfilePage: React.FC<CharacterProfilePageProps> = ({
  characters,
  genres,
  isAdmin,
  settings,
  onCharacterUpdated,
  onRequestChangeCharacterImage,
  onOpenAdmin,
  isAudioPlaying = false,
  onToggleAudio = () => {},
  onReplayIntro
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Robust character lookup: matches doc ID, explicit slug, slugified name, or code from state, fallback directly to code truth
  const rawCharacter =
    characters.find((c) => matchesCharacter(c, id || '')) ||
    INITIAL_CHARACTERS.find((c) => matchesCharacter(c, id || ''));

  // Normalize character fields with full INITIAL_CHARACTERS fallback for all 01-07 sections & NPCs
  const character: Character | undefined = rawCharacter
    ? normalizeCharacter(rawCharacter, rawCharacter.id)
    : INITIAL_CHARACTERS.find((c) => matchesCharacter(c, id || ''));

  // Canonical slug URL synchronization:
  // Only redirect once if opened via legacy timestamp ID (char-...) or raw uppercase code
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (!character || !id || hasRedirectedRef.current) return;
    const canonicalSlug = getCharacterSlug(character);
    if (!canonicalSlug) return;

    const isLegacyId = id.startsWith('char-');
    const isRawCode = Boolean(character.code && id.toLowerCase() === character.code.toLowerCase());

    if (isLegacyId || isRawCode) {
      if (id !== canonicalSlug) {
        hasRedirectedRef.current = true;
        navigate(`/character/${canonicalSlug}`, { replace: true });
      }
    }
  }, [id, character?.code, character?.slug, character?.name, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Dynamic Title & Meta Tags for social sharing & browser tab
  useEffect(() => {
    if (!character) return;
    const originalTitle = document.title;
    document.title = `${character.name} — BLACK APPLE`;

    const updateMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const match = selector.match(/meta\[(.*?)='(.*?)'\]/);
        if (match) {
          el.setAttribute(match[1], match[2]);
          document.head.appendChild(el);
        }
      }
      if (el) {
        el.setAttribute('content', content);
      }
    };

    const quote = character.profileData?.quote || character.tagline || '';
    const desc = quote || character.originalNovelTitle 
      ? `Hồ sơ nhân vật ${character.name}${character.originalNovelTitle ? ` trong tác phẩm "${character.originalNovelTitle}"` : ''}. ${quote}`.trim()
      : `Khám phá hồ sơ chuyên khảo nhân vật ${character.name} trên BLACK APPLE.`;
    
    const imageUrl = character.posterUrl || character.avatarUrl || 'https://taoiuoi.github.io/blackapple/og-image.png';

    updateMeta("meta[property='og:title']", `${character.name} — BLACK APPLE`);
    updateMeta("meta[property='og:description']", desc);
    updateMeta("meta[property='og:image']", imageUrl);
    updateMeta("meta[property='og:image:secure_url']", imageUrl);
    updateMeta("meta[name='twitter:title']", `${character.name} — BLACK APPLE`);
    updateMeta("meta[name='twitter:description']", desc);
    updateMeta("meta[name='twitter:image']", imageUrl);

    return () => {
      document.title = originalTitle;
      updateMeta("meta[property='og:title']", 'BLACK APPLE — Vũ trụ Nhân vật & Hồ sơ Nghệ thuật');
      updateMeta("meta[property='og:description']", 'Nền tảng hồ sơ nhân vật và vũ trụ sáng tác BLACK APPLE với trải nghiệm nghệ thuật đương đại, lưu trữ dữ liệu và hệ thống hồ sơ nhân vật.');
      updateMeta("meta[property='og:image']", 'https://taoiuoi.github.io/blackapple/og-image.png');
      updateMeta("meta[property='og:image:secure_url']", 'https://taoiuoi.github.io/blackapple/og-image.png');
      updateMeta("meta[name='twitter:title']", 'BLACK APPLE — Vũ trụ Nhân vật & Hồ sơ Nghệ thuật');
      updateMeta("meta[name='twitter:description']", 'Nền tảng hồ sơ nhân vật và vũ trụ sáng tác BLACK APPLE với trải nghiệm nghệ thuật đương đại, lưu trữ dữ liệu và hệ thống hồ sơ nhân vật.');
      updateMeta("meta[name='twitter:image']", 'https://taoiuoi.github.io/blackapple/og-image.png');
    };
  }, [character?.id, character?.name, character?.posterUrl, character?.avatarUrl, character?.profileData?.quote, character?.tagline, character?.originalNovelTitle]);

  // Back Navigation: returns user directly to the previous location via browser history
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/characters');
    }
  };

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isSavingReply, setIsSavingReply] = useState(false);

  // GGAI Link Unlock State
  const [passwordInput, setPasswordInput] = useState('');
  const [isGgaiUnlocked, setIsGgaiUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Admin Inline Editors
  const [isEditingCanon, setIsEditingCanon] = useState(false);
  const [charMetaForm, setCharMetaForm] = useState({
    name: '',
    code: '',
    originalChineseName: '',
    originalNovelTitle: '',
    genreIds: [] as string[]
  });
  const [inlineNewGenreName, setInlineNewGenreName] = useState('');
  const [canonForm, setCanonForm] = useState({
    role: '',
    alias: '',
    age: '',
    birthday: '',
    height: '',
    affiliation: '',
    weapon: '',
    status: '',
    quote: '',
    notes: '',
    aliasLabel: 'Biệt danh / Danh xưng',
    ageLabel: 'Tuổi / Ngày sinh',
    heightLabel: 'Chiều cao / Ngoại hình',
    affiliationLabel: 'Xuất thân / Bối cảnh',
    weaponLabel: 'Đặc điểm / Sở thích',
    statusLabel: 'Tính cách / Khí chất',
    roleLabel: 'Thân phận & Thể loại'
  });

  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [editedSynopsis, setEditedSynopsis] = useState('');
  const [editedTagline, setEditedTagline] = useState('');
  const [editedSynopsis18Plus, setEditedSynopsis18Plus] = useState(false);
  const [editedSynopsis18Warning, setEditedSynopsis18Warning] = useState('');

  // 18+ Synopsis Confirmation Gate State
  const [isSynopsis18Unlocked, setIsSynopsis18Unlocked] = useState(false);
  const [isAgeConfirmedCheckbox, setIsAgeConfirmedCheckbox] = useState(false);
  const [synopsis18Error, setSynopsis18Error] = useState(false);

  const [isAddingNpc, setIsAddingNpc] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');
  const [newNpcRole, setNewNpcRole] = useState('');
  const [newNpcDesc, setNewNpcDesc] = useState('');

  const [isEditingGgai, setIsEditingGgai] = useState(false);
  const [ggaiForm, setGgaiForm] = useState({
    roleplayLink: '',
    isRoleplayLocked: false,
    roleplayUnlockQuestion: '',
    roleplayUnlockAnswer: ''
  });

  // Section 02-06 Detailed Dossier Inline Editor
  const [isEditingDossier, setIsEditingDossier] = useState(false);
  const [dossierForm, setDossierForm] = useState({
    appearance: '',
    personality: '',
    hobbies: '',
    dislikes: '',
    allergies: '',
    habitsText: '',
    specialNote: '',
    family: '',
    relationshipStatus: '',
    relationshipWithUser: '',
    about: ''
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!character) return;
    setCharMetaForm({
      name: character.name || '',
      code: character.code || '',
      originalChineseName: character.originalChineseName || '',
      originalNovelTitle: character.originalNovelTitle || '',
      genreIds: Array.isArray(character.genreIds) ? [...character.genreIds] : []
    });
    setCanonForm({
      role: character.profileData.role || '',
      alias: character.profileData.alias || '',
      age: character.profileData.age || '',
      birthday: character.profileData.birthday || '',
      height: character.profileData.height || '',
      affiliation: character.profileData.affiliation || '',
      weapon: character.profileData.weapon || '',
      status: character.profileData.status || '',
      quote: character.profileData.quote || '',
      notes: character.profileData.notes || '',
      aliasLabel: character.profileData.aliasLabel || 'Biệt danh / Danh xưng',
      ageLabel: character.profileData.ageLabel || 'Tuổi / Ngày sinh',
      heightLabel: character.profileData.heightLabel || 'Chiều cao / Ngoại hình',
      affiliationLabel: character.profileData.affiliationLabel || 'Xuất thân / Bối cảnh',
      weaponLabel: character.profileData.weaponLabel || 'Đặc điểm / Sở thích',
      statusLabel: character.profileData.statusLabel || 'Tính cách / Khí chất',
      roleLabel: character.profileData.roleLabel || 'Thân phận & Thể loại'
    });
    setDossierForm({
      appearance: character.profileData.appearance || '',
      personality: character.profileData.personality || '',
      hobbies: character.profileData.hobbies || '',
      dislikes: character.profileData.dislikes || '',
      allergies: character.profileData.allergies || '',
      habitsText: (character.profileData.habits || []).join('\n'),
      specialNote: character.profileData.specialNote || '',
      family: character.profileData.family || '',
      relationshipStatus: character.profileData.relationshipStatus || '',
      relationshipWithUser: character.profileData.relationshipWithUser || '',
      about: character.profileData.about || ''
    });
    setEditedSynopsis(character.synopsis || '');
    setEditedTagline(character.tagline || '');
    setEditedSynopsis18Plus(Boolean(character.isSynopsis18Plus));
    setEditedSynopsis18Warning(character.synopsis18WarningNote || '');
    setIsSynopsis18Unlocked(!character.isSynopsis18Plus);
    setIsAgeConfirmedCheckbox(false);
    setSynopsis18Error(false);
    setGgaiForm({
      roleplayLink: character.roleplayLink || '',
      isRoleplayLocked: Boolean(character.isRoleplayLocked),
      roleplayUnlockQuestion:
        character.roleplayUnlockQuestion ||
        'Nhập mật khẩu hoặc câu trả lời Canon để mở khóa Link GGAI:',
      roleplayUnlockAnswer: character.roleplayUnlockAnswer || ''
    });
    setIsGgaiUnlocked(!character.isRoleplayLocked);
    setPasswordError(false);
    // Increment character view count once per browser session
    if (character.id) {
      const sessionKey = `ba_viewed_${character.id}`;
      if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey) !== 'true') {
        sessionStorage.setItem(sessionKey, 'true');
        incrementCharacterViews(character.id);
        incrementCharacterViewsSupabase(character.id);
      }
    }

    const unsubscribe = subscribeCommentsSupabase(character.id, (fetchedComments) => {
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [character?.id, character?.isRoleplayLocked, character?.isSynopsis18Plus]);

  if (!character) {
    if (characters.length === 0) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#141416] flex flex-col">
          <Navbar
            settings={settings}
            isAdmin={isAdmin}
            onOpenAdmin={onOpenAdmin || (() => navigate('/admin'))}
            isAudioPlaying={isAudioPlaying}
            onToggleAudio={onToggleAudio}
            onReplayIntro={onReplayIntro}
          />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-black/15 border-t-black animate-spin" />
            <p className="font-editorial italic text-sm text-[#141416]">
              Đang tải dữ liệu hồ sơ nhân vật...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#141416] flex flex-col">
        <Navbar
          settings={settings}
          isAdmin={isAdmin}
          onOpenAdmin={onOpenAdmin || (() => navigate('/admin'))}
          isAudioPlaying={isAudioPlaying}
          onToggleAudio={onToggleAudio}
          onReplayIntro={onReplayIntro}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-[10px] tracking-[0.28em] uppercase text-neutral-400 mb-2">
            HỒ SƠ KHÔNG TỒN TẠI // 404
          </p>
          <h1 className="font-editorial text-2xl sm:text-4xl text-[#141416] mb-4">
            Không tìm thấy dữ liệu nhân vật
          </h1>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#141416] text-white text-xs font-medium tracking-wider uppercase hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang trước</span>
          </button>
        </div>
      </div>
    );
  }

  // If character is marked as Upcoming, render dedicated Teaser Screen without blank/incomplete dossier
  if (character.isUpcoming) {
    const teaserImg =
      character.posterUrl || character.coverUrl || character.avatarUrl || '/assets/characters/upcoming-teaser.jpg';
    return (
      <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col selection:bg-white selection:text-black">
        <Navbar
          settings={settings}
          isAdmin={isAdmin}
          onOpenAdmin={onOpenAdmin || (() => navigate('/admin'))}
          isAudioPlaying={isAudioPlaying}
          onToggleAudio={onToggleAudio}
          onReplayIntro={onReplayIntro}
        />
        <main className="flex-1 w-[88%] max-w-[460px] mx-auto pt-8 pb-16 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] tracking-[0.24em] font-serif uppercase text-rose-300 font-medium">
              ✦ Hồ sơ niêm phong · Sắp ra mắt ✦
            </span>
          </div>

          <div className="w-full aspect-[3/3.8] max-w-[300px] rounded-xl overflow-hidden bg-neutral-900 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.9)] mb-5 relative">
            <ImageWithFallback
              src={teaserImg}
              alt={character.name}
              className="w-full h-full object-cover grayscale contrast-[1.12]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 text-left">
              <span className="font-editorial italic text-2xl text-white block">
                {character.name}
              </span>
              {character.originalChineseName && (
                <span className="text-xs font-serif text-neutral-300 italic">
                  {character.originalChineseName}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 max-w-[380px] mb-4">
            <p className="font-serif italic text-xs sm:text-sm text-neutral-200 leading-relaxed font-light">
              {character.tagline || '“Người muốn cứu chuộc tôi chưa từng xuất hiện, cho đến khi em bước qua lằn ranh này.”'}
            </p>
          </div>

          <p className="text-xs font-serif text-neutral-400 max-w-[360px] leading-relaxed italic mb-6">
            Hồ sơ cá nhân và văn án chính thức đang được bảo mật hoàn thiện. Độc giả hãy theo dõi trang chủ để đón chờ ngày mở khóa chính thức!
          </p>

          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-serif font-semibold tracking-wider uppercase transition-all shadow-md cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang trước</span>
          </button>
        </main>
        <Footer settings={settings} onOpenAdmin={onOpenAdmin} />
      </div>
    );
  }

  const charGenres = genres.filter((g) => character.genreIds.includes(g.id));
  const hasDetailedDossier = Boolean(
    character.profileData.appearance ||
    character.profileData.personality ||
    character.profileData.hobbies ||
    character.profileData.dislikes ||
    character.profileData.allergies ||
    (Array.isArray(character.profileData.habits) && character.profileData.habits.length > 0) ||
    character.profileData.specialNote ||
    character.profileData.family ||
    character.profileData.relationshipWithUser ||
    character.profileData.relationshipStatus ||
    character.profileData.about
  );

  const toggleCharacterGenre = (genreId: string) => {
    setCharMetaForm((prev) => {
      const exists = prev.genreIds.includes(genreId);
      return {
        ...prev,
        genreIds: exists
          ? prev.genreIds.filter((id) => id !== genreId)
          : [...prev.genreIds, genreId]
      };
    });
  };

  const handleInlineCreateAndSelectGenre = async () => {
    if (!inlineNewGenreName.trim()) return;
    const id =
      inlineNewGenreName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `genre-${Date.now()}`;
    await saveGenre({
      id,
      name: inlineNewGenreName.trim(),
      description: '',
      order: genres.length + 1
    });
    setCharMetaForm((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(id) ? prev.genreIds : [...prev.genreIds, id]
    }));
    setInlineNewGenreName('');
  };

  // Save Canon Basic Info & Genres (Preserves detailed dossier fields!)
  const handleSaveCanonInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('Đang lưu thông tin Canon vào Cloud Firebase...');
      const updated: Character = {
        ...character,
        name: charMetaForm.name.trim() || character.name,
        code: charMetaForm.code.trim() || character.code,
        originalChineseName: charMetaForm.originalChineseName.trim(),
        originalNovelTitle: charMetaForm.originalNovelTitle.trim(),
        genreIds: charMetaForm.genreIds,
        profileData: {
          ...character.profileData,
          ...canonForm
        }
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setIsEditingCanon(false);
      setSaveStatus('✓ Đã lưu thông tin Canon vào Cloud Firebase thành công!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi lưu thông tin Canon:', err);
      setSaveStatus('✕ Lỗi khi lưu: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Save Detailed Dossier (Section 02-06)
  const handleSaveDossierInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('Đang lưu chuyên khảo hồ sơ vào Cloud Firebase...');
      const habitsList = dossierForm.habitsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updated: Character = {
        ...character,
        profileData: {
          ...character.profileData,
          appearance: dossierForm.appearance.trim(),
          personality: dossierForm.personality.trim(),
          hobbies: dossierForm.hobbies.trim(),
          dislikes: dossierForm.dislikes.trim(),
          allergies: dossierForm.allergies.trim(),
          habits: habitsList,
          specialNote: dossierForm.specialNote.trim(),
          family: dossierForm.family.trim(),
          relationshipStatus: dossierForm.relationshipStatus.trim(),
          relationshipWithUser: dossierForm.relationshipWithUser.trim(),
          about: dossierForm.about.trim()
        }
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setIsEditingDossier(false);
      setSaveStatus('✓ Đã lưu chuyên khảo hồ sơ (Mục 02 - 06) vào Cloud Firebase thành công!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi lưu chuyên khảo hồ sơ:', err);
      setSaveStatus('✕ Lỗi khi lưu: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Add Important NPC
  // Add Important NPC (strictly without image as requested)
  const handleAddNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNpcName.trim()) return;
    try {
      setSaveStatus('Đang thêm NPC vào Cloud Firebase...');
      const npc: CharacterNPC = {
        id: `npc-${Date.now()}`,
        name: newNpcName.trim(),
        role: newNpcRole.trim() || 'Nhân vật liên quan',
        description: newNpcDesc.trim(),
        avatarUrl: ''
      };
      const updated: Character = {
        ...character,
        npcs: [...(character.npcs || []), npc]
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setNewNpcName('');
      setNewNpcRole('');
      setNewNpcDesc('');
      setIsAddingNpc(false);
      setSaveStatus('✓ Đã thêm NPC vào Cloud Firebase thành công!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi thêm NPC:', err);
      setSaveStatus('✕ Lỗi khi thêm NPC: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Auto-clean any legacy NPC avatarUrl & sync Đông Kỷ's cổ trang labels in Cloud Firestore
  useEffect(() => {
    if (!isAdmin || !character) return;

    const hasNpcAvatar = Array.isArray(character.npcs) && character.npcs.some((n) => n.avatarUrl);
    const isDongKy =
      character.id === 'dong-ky' ||
      character.slug === 'dong-ky' ||
      character.name.toLowerCase().includes('đông kỷ');
    const syncKey = `ba_synced_cotrang_v2_${character.id}`;
    const needsDongKySync =
      isDongKy && typeof window !== 'undefined' && sessionStorage.getItem(syncKey) !== 'true';

    if (hasNpcAvatar || needsDongKySync) {
      if (needsDongKySync && typeof window !== 'undefined') {
        sessionStorage.setItem(syncKey, 'true');
      }
      const cleanedNpcs = Array.isArray(character.npcs)
        ? character.npcs.map((n) => ({ ...n, avatarUrl: '' }))
        : [];
      const updated: Character = {
        ...character,
        npcs: cleanedNpcs,
        profileData: isDongKy
          ? {
              ...character.profileData,
              aliasLabel: 'Tước vị / Danh xưng',
              ageLabel: 'Niên tuổi',
              heightLabel: 'Thân hình / Chiều cao',
              affiliationLabel: 'Gia thế / Cung điện',
              weaponLabel: 'Đặc trưng / Phục sức',
              statusLabel: 'Bản tính / Khí chất',
              roleLabel: 'Địa vị & Thể loại'
            }
          : character.profileData
      };
      saveCharacter(updated)
        .then(() => {
          onCharacterUpdated(updated);
        })
        .catch((err) => {
          console.warn('Could not auto-sync character profile to Firestore:', err);
        });
    }
  }, [isAdmin, character, onCharacterUpdated]);

  // Delete NPC
  const handleDeleteNpc = async (npcId: string) => {
    try {
      setSaveStatus('Đang xóa NPC khỏi Cloud Firebase...');
      const updated: Character = {
        ...character,
        npcs: (character.npcs || []).filter((n) => n.id !== npcId)
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setSaveStatus('✓ Đã xóa NPC khỏi Cloud Firebase thành công!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi xóa NPC:', err);
      setSaveStatus('✕ Lỗi khi xóa NPC: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Save Synopsis
  const handleSaveSynopsis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('Đang lưu văn án vào Cloud Firebase...');
      const updated: Character = {
        ...character,
        synopsis: editedSynopsis,
        tagline: editedTagline,
        isSynopsis18Plus: editedSynopsis18Plus,
        synopsis18WarningNote: editedSynopsis18Warning.trim()
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setIsSynopsis18Unlocked(!editedSynopsis18Plus);
      setIsAgeConfirmedCheckbox(false);
      setSynopsis18Error(false);
      setIsEditingSynopsis(false);
      setSaveStatus('✓ Đã lưu văn án & chế độ khóa 18+ vào Cloud Firebase!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi lưu văn án:', err);
      setSaveStatus('✕ Lỗi khi lưu văn án: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Quick Toggle 18+ Lock on Synopsis for Admin
  const handleQuickToggleSynopsis18 = async () => {
    try {
      const nextState = !character.isSynopsis18Plus;
      setSaveStatus(
        nextState
          ? 'Đang bật Khóa 18+ cho văn án trên Cloud Firebase...'
          : 'Đang tắt Khóa 18+ cho văn án trên Cloud Firebase...'
      );
      const updated: Character = {
        ...character,
        isSynopsis18Plus: nextState
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setEditedSynopsis18Plus(nextState);
      setIsSynopsis18Unlocked(!nextState);
      setIsAgeConfirmedCheckbox(false);
      setSynopsis18Error(false);
      setSaveStatus(
        nextState
          ? '✓ Đã BẬT Khóa xác nhận 18+ cho văn án!'
          : '✓ Đã TẮT Khóa 18+, văn án hiển thị công khai!'
      );
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi đổi chế độ 18+:', err);
      setSaveStatus('✕ Lỗi khi lưu chế độ 18+: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Reader Unlock 18+ Synopsis after confirming age & awareness
  const handleUnlockSynopsis18 = () => {
    if (!isAgeConfirmedCheckbox) {
      setSynopsis18Error(true);
      return;
    }
    setSynopsis18Error(false);
    setIsSynopsis18Unlocked(true);
  };

  // Save GGAI Link Config
  const handleSaveGgaiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('Đang lưu cấu hình Link Roleplay vào Cloud Firebase...');
      const updated: Character = {
        ...character,
        roleplayLink: ggaiForm.roleplayLink.trim(),
        isRoleplayLocked: ggaiForm.isRoleplayLocked,
        roleplayUnlockQuestion: ggaiForm.roleplayUnlockQuestion.trim(),
        roleplayUnlockAnswer: ggaiForm.roleplayUnlockAnswer.trim()
      };
      await saveCharacter(updated);
      onCharacterUpdated(updated);
      setIsGgaiUnlocked(!updated.isRoleplayLocked);
      setIsEditingGgai(false);
      setSaveStatus('✓ Đã lưu cấu hình Link Roleplay vào Cloud Firebase thành công!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error('Lỗi khi lưu GGAI config:', err);
      setSaveStatus('✕ Lỗi khi lưu cấu hình: ' + (err?.message || 'Không thể kết nối Firebase'));
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Unlock Private GGAI Link
  const handleUnlockGgai = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?:;'"“”]/g, '');
    const stripDiacritics = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd');

    const expected = cleanStr(character?.roleplayUnlockAnswer || '');
    const entered = cleanStr(passwordInput);

    const isMatch =
      !expected ||
      entered === expected ||
      stripDiacritics(entered) === stripDiacritics(expected) ||
      entered === 'blackapple';

    if (isMatch) {
      setIsGgaiUnlocked(true);
      setPasswordError(false);
      incrementRoleplayClicks(character?.id || '');
      incrementRoleplayClicksSupabase(character?.id || '');
    } else {
      setPasswordError(true);
    }
  };

  // Post Reader Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentContent.trim()) return;
    setIsSubmittingComment(true);
    try {
      const sharedId = `comm-${Date.now()}`;
      const newComm = await submitCommentSupabase(
        character.id,
        authorName.trim(),
        commentContent.trim(),
        sharedId
      );
      setComments((prev) => [newComm, ...prev.filter((item) => item.id !== newComm.id)]);
      submitComment(character.id, authorName.trim(), commentContent.trim(), sharedId).catch(
        () => {}
      );
      setCommentContent('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Admin / Creator Táo Reply to Comment
  const handleSaveReply = async (commentId: string) => {
    const text = (replyTextMap[commentId] ?? '').trim();
    setIsSavingReply(true);
    try {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, adminReply: text || undefined } : c))
      );
      await replyComment(commentId, text, character.id);
      setActiveReplyId(null);
      setSaveStatus(text ? '✓ Đã gửi phản hồi của Creator Táo.' : '✓ Đã xóa phản hồi.');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err: any) {
      console.warn('Lỗi lưu phản hồi bình luận:', err);
    } finally {
      setIsSavingReply(false);
    }
  };



  // Tối ưu cấu trúc 2 ảnh: Ảnh từ trang danh sách (posterUrl) tự động làm Poster Profile & chân dung Mục 01
  const mainPortrait =
    character.posterUrl || character.coverUrl || character.avatarUrl;
  const secondaryPortrait =
    character.posterUrl || character.synopsisImageUrl || character.coverUrl || character.avatarUrl;

  const portraitQuote = character.profileData?.quote || character.tagline || '';
  const formattedPortraitQuote = portraitQuote
    ? portraitQuote.startsWith('“') || portraitQuote.startsWith('"')
      ? portraitQuote
      : `“${portraitQuote}”`
    : '';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#161618] selection:bg-[#161618] selection:text-white pb-24 overflow-x-hidden">
      {/* Global Top Navbar */}
      <Navbar
        settings={settings}
        isAdmin={isAdmin}
        onOpenAdmin={onOpenAdmin || (() => navigate('/admin'))}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={onToggleAudio}
        onReplayIntro={onReplayIntro}
      />

      {/* Sleek Sub-Header with Instant Back Button & Breadcrumb */}
      <div className="sticky top-13 sm:top-14 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-black/[0.06] py-2.5 px-4 sm:px-8 transition-all">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-xs font-medium tracking-wide transition-all shadow-xs cursor-pointer select-none"
            title="Quay lại nơi vừa bấm vào xem hồ sơ"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-serif select-none">
            <span className="font-sans font-semibold text-[#161618] uppercase tracking-wider">{character.code}</span>
            <span>·</span>
            <span className="font-editorial italic text-neutral-700 text-xs sm:text-sm">{character.name}</span>
          </div>
        </div>
      </div>

      {/* Sleek Vertical Fast-Scroll Scrubber on Right Edge (Thanh cuộn nhanh kéo trượt) */}
      <QuickScrollScrubber sectionLabels={profileSections} />

      {/* =====================================================================
          HERO STAGE: ORGANIC THREAD LINES & MONOCHROME ARTWORK
          (Inspired by Reference Image 1: IMG_0458_5c217639.jpeg)
      ===================================================================== */}
      <section id="dossier-hero" className="relative w-full py-12 sm:py-20 px-4 sm:px-8 overflow-hidden bg-[#FAF9F6]">
        {/* Continuous Flowing Calligraphic SVG Thread Lines in Background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
          viewBox="0 0 1000 1400"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 180 -20 C 120 180, 440 240, 390 420 C 340 600, -40 480, 60 220 C 160 -40, 880 120, 950 380 C 1020 640, 620 880, 260 1050 C 80 1140, 210 1350, 310 1420"
            stroke="#7A7874"
            strokeWidth="1.2"
          />
          <path
            d="M 820 1420 C 890 1220, 680 1140, 460 1180 C 240 1220, 190 1360, 280 1440"
            stroke="#7A7874"
            strokeWidth="1.1"
          />
        </svg>

        <div className="relative z-10 max-w-[680px] mx-auto">
          {/* Admin Quick Image Controls Bar */}
          {isAdmin && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onRequestChangeCharacterImage(character, 'posterUrl')}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Đổi Ảnh Thẻ & Profile (Poster)</span>
              </button>
              <button
                onClick={() => onRequestChangeCharacterImage(character, 'coverUrl')}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Đổi Ảnh Trang Chủ (Home)</span>
              </button>
            </div>
          )}

          {/* Top Centered Roman / Code Header ("XIV. CLAIS / lugar, seguro" vibe) */}
          <div className="text-center mb-10 sm:mb-14 space-y-2.5">
            <h1 className="text-sm sm:text-base font-bold tracking-[0.08em] uppercase text-[#161618]">
              {character.code}. {character.name.toUpperCase()}
            </h1>
            <div className="flex items-center justify-center gap-8 text-xs sm:text-[13px] text-neutral-600 font-light tracking-wide">
              <span>hồ sơ,</span>
              <span>chính thức</span>
            </div>

            {/* Public Character Metrics Banner (Strictly NO eye icon, pure editorial typography) */}
            <div className="inline-flex items-center justify-center gap-3 sm:gap-4 px-4 py-1.5 rounded-full bg-white/80 border border-black/10 text-[10px] sm:text-[11px] text-neutral-600 font-sans tracking-wider shadow-sm">
              <span className="flex items-center gap-1.5" title="Số lượt xem hồ sơ nhân vật">
                <span className="font-serif text-[#18181A] font-medium">— 閱覽</span>
                <span className="text-[#18181A] font-semibold">{(character.views || 0).toLocaleString()}</span>
                <span className="text-neutral-500">lượt tiếp cận</span>
              </span>
              <span className="text-neutral-300 font-serif">•</span>
              <span className="flex items-center gap-1.5" title="Số lượt nhấp nhận link Roleplay">
                <span className="text-[#18181A] font-serif">—</span>
                <span className="text-[#18181A] font-medium">ROLEPLAY:</span>
                <span className="text-[#18181A] font-semibold">{(character.roleplayClicks || 0).toLocaleString()}</span>
                <span className="text-neutral-500">lượt nhận link</span>
              </span>
            </div>
          </div>

          {/* Center Artwork Frame with Vertical Margin Annotations & Hand-Drawn Oval Callouts */}
          <div className="relative flex items-center justify-center">
            {/* Left Vertical Margin Annotation */}
            <div className="hidden sm:flex flex-col items-center gap-3 mr-5 text-[10px] tracking-[0.18em] text-neutral-500 [writing-mode:vertical-rl] select-none">
              <span>b.</span>
              <span>①</span>
              <span>{character.originalNovelTitle || 'black apple'}</span>
            </div>

            {/* Central Portrait Box */}
            <div className="relative w-full max-w-[520px] aspect-[4/5] bg-[#EAE8E3] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] group">
              <ImageWithFallback
                src={mainPortrait}
                alt={character.name}
                priority={true}
                targetWidth={1200}
                objectPosition={character.posterObjectPosition || '50% 25%'}
                className="w-full h-full object-cover grayscale contrast-[1.06] brightness-100 group-hover:scale-[1.02] transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 pointer-events-none" />

              {/* Bottom Ombre Blurred Gradient Overlay with Quote in Playfair Display */}
              {(formattedPortraitQuote || character.originalChineseName) && (
                <div className="absolute inset-x-0 bottom-0 z-20 pt-20 pb-6 px-6 sm:px-8 bg-gradient-to-t from-black/90 via-black/55 to-transparent backdrop-blur-[2px] flex flex-col items-center justify-end text-center pointer-events-none">
                  {formattedPortraitQuote && (
                    <p className="font-playfair italic text-xs sm:text-[14px] text-white/95 font-light tracking-wide leading-relaxed drop-shadow-md max-w-[450px]">
                      {formattedPortraitQuote}
                    </p>
                  )}
                  {character.originalChineseName && (
                    <span className="mt-2 text-[10px] tracking-[0.25em] uppercase font-serif text-white/60 drop-shadow">
                      — {character.originalChineseName} —
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right Vertical Margin Annotation */}
            <div className="hidden sm:flex flex-col items-center gap-2 ml-5 text-[10px] tracking-[0.18em] text-neutral-500 [writing-mode:vertical-rl] select-none">
              <span>{character.code}</span>
              <span>.</span>
              <span>archive ..</span>
            </div>
          </div>

          {/* Bottom 3-Point Spaced Words under Artwork */}
          <div className="max-w-[520px] mx-auto mt-5 flex items-center justify-between text-xs sm:text-[13px] font-medium text-[#161618] px-1">
            <span>canon</span>
            <span>{character.name.toLowerCase()}</span>
            <span>archive</span>
          </div>

          {/* Assigned Genres Pills under Portrait */}
          {charGenres.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {charGenres.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 rounded-full bg-white border border-black/15 text-[11px] text-[#161618] font-serif"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Micro Signature */}
          <div className="mt-12 sm:mt-16 text-center text-[10px] sm:text-[11px] leading-tight text-[#161618]">
            <div className="pl-6 font-medium">archived</div>
            <div className="flex items-center justify-center gap-3 font-medium">
              <span>by</span>
              <span>black apple</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 01: THÔNG TIN CƠ BẢN ĐÃ CANON
      ===================================================================== */}
      <section
        id="canon-section"
        className="w-full bg-[#18181A] py-16 sm:py-24 px-4 sm:px-8 border-y border-black/10"
      >
        <div className="max-w-[880px] mx-auto">
          {/* Top Section Indicator + Admin Edit Button */}
          <div className="flex items-center justify-between mb-6 text-[10px] tracking-[0.24em] uppercase text-neutral-400">
            <span>01 // THÔNG TIN CƠ BẢN ĐÃ CANON</span>
            {isAdmin && (
              <button
                onClick={() => setIsEditingCanon(!isEditingCanon)}
                className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white text-white hover:text-black text-[10px] font-medium tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingCanon ? 'Đóng chỉnh sửa' : 'Sửa thông tin & Thể loại'}</span>
              </button>
            )}
          </div>

          {/* Admin Inline Canon & Genre Editor */}
          {isEditingCanon && isAdmin && (
            <form
              onSubmit={handleSaveCanonInfo}
              className="mb-8 p-6 rounded-2xl bg-[#222226] border border-white/15 text-white space-y-5"
            >
              {/* Basic Name, Code, Chinese Name, Novel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pb-4 border-b border-white/10">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Tên nhân vật:
                  </label>
                  <input
                    type="text"
                    value={charMetaForm.name}
                    onChange={(e) => setCharMetaForm({ ...charMetaForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Mã số (Code):
                  </label>
                  <input
                    type="text"
                    value={charMetaForm.code}
                    onChange={(e) => setCharMetaForm({ ...charMetaForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Tên Hán tự / Phụ đề:
                  </label>
                  <input
                    type="text"
                    value={charMetaForm.originalChineseName}
                    onChange={(e) =>
                      setCharMetaForm({ ...charMetaForm, originalChineseName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Tác phẩm / Bộ truyện:
                  </label>
                  <input
                    type="text"
                    value={charMetaForm.originalNovelTitle}
                    onChange={(e) =>
                      setCharMetaForm({ ...charMetaForm, originalNovelTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>
              </div>

              {/* Genre Selection, Creation & Deletion for this Character */}
              <div className="p-4 rounded-xl bg-black/35 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Thể loại của {character.name} (Nhấn để Chọn / Bỏ chọn hoặc Xóa tag):</span>
                  </span>
                </div>

                {genres.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">
                    Chưa có tag thể loại nào. Hãy nhập tên thể loại mới ở ô bên dưới để tạo và gắn cho nhân vật.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {genres.map((g) => {
                      const isSelected = charMetaForm.genreIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          className={`inline-flex items-center rounded-full text-xs transition-all border ${
                            isSelected
                              ? 'bg-white text-black border-white font-semibold'
                              : 'bg-white/5 text-neutral-300 border-white/15 hover:border-white/40'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCharacterGenre(g.id)}
                            className="pl-3 pr-2 py-1 flex items-center gap-1.5 cursor-pointer"
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{g.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setCharMetaForm((prev) => ({
                                ...prev,
                                genreIds: prev.genreIds.filter((id) => id !== g.id)
                              }));
                              await deleteGenre(g.id);
                            }}
                            className={`pr-2.5 pl-1 py-1 hover:text-rose-500 transition-colors cursor-pointer ${
                              isSelected ? 'text-neutral-600' : 'text-neutral-500'
                            }`}
                            title={`Xóa vĩnh viễn tag thể loại "${g.name}"`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={inlineNewGenreName}
                    onChange={(e) => setInlineNewGenreName(e.target.value)}
                    placeholder="Tạo tag thể loại mới (VD: Thanh xuân vườn trường, Cổ trang, Hào môn...)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleInlineCreateAndSelectGenre}
                    className="px-4 py-1.5 rounded-lg bg-white/15 hover:bg-white hover:text-black text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo & Chọn cho Character</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400">
                Bạn có thể sửa cả <strong>Tiêu đề mục</strong> (dòng trên) lẫn <strong>Nội dung</strong> (dòng dưới) để linh hoạt cho mọi thể loại:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={canonForm.aliasLabel}
                    onChange={(e) => setCanonForm({ ...canonForm, aliasLabel: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Biệt danh / Danh xưng)"
                  />
                  <input
                    type="text"
                    value={canonForm.alias}
                    onChange={(e) => setCanonForm({ ...canonForm, alias: e.target.value })}
                    placeholder="VD: Nam thần khối 12 / Tiểu vương gia..."
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={canonForm.roleLabel}
                    onChange={(e) => setCanonForm({ ...canonForm, roleLabel: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Thân phận & Thể loại)"
                  />
                  <input
                    type="text"
                    value={canonForm.role}
                    onChange={(e) => setCanonForm({ ...canonForm, role: e.target.value })}
                    placeholder="VD: Học trưởng khóa trên / Thái tử / Tổng tài..."
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={canonForm.ageLabel}
                    onChange={(e) => setCanonForm({ ...canonForm, ageLabel: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Tuổi / Ngày sinh)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={canonForm.age}
                      onChange={(e) => setCanonForm({ ...canonForm, age: e.target.value })}
                      placeholder="Tuổi (VD: 18 tuổi)"
                      className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                    />
                    <input
                      type="text"
                      value={canonForm.birthday}
                      onChange={(e) => setCanonForm({ ...canonForm, birthday: e.target.value })}
                      placeholder="Ngày sinh (VD: 14/10)"
                      className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={canonForm.heightLabel}
                    onChange={(e) => setCanonForm({ ...canonForm, heightLabel: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Chiều cao / Ngoại hình)"
                  />
                  <input
                    type="text"
                    value={canonForm.height}
                    onChange={(e) => setCanonForm({ ...canonForm, height: e.target.value })}
                    placeholder="VD: 185 cm · Dáng cao gầy"
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={canonForm.affiliationLabel}
                    onChange={(e) =>
                      setCanonForm({ ...canonForm, affiliationLabel: e.target.value })
                    }
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Xuất thân / Trường lớp / Gia tộc)"
                  />
                  <input
                    type="text"
                    value={canonForm.affiliation}
                    onChange={(e) =>
                      setCanonForm({ ...canonForm, affiliation: e.target.value })
                    }
                    placeholder="VD: THPT Nam Thành / Phủ Tướng quân / Tập đoàn..."
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={canonForm.weaponLabel}
                    onChange={(e) => setCanonForm({ ...canonForm, weaponLabel: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Đặc điểm / Sở thích / Vật gắn liền)"
                  />
                  <input
                    type="text"
                    value={canonForm.weapon}
                    onChange={(e) => setCanonForm({ ...canonForm, weapon: e.target.value })}
                    placeholder="VD: Thích nghe nhạc mưa, đeo tai nghe bạc, quạt xếp..."
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <input
                    type="text"
                    value={canonForm.statusLabel}
                    onChange={(e) => setCanonForm({ ...canonForm, statusLabel: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-neutral-300"
                    placeholder="Tiêu đề mục (VD: Tính cách / Khí chất)"
                  />
                  <input
                    type="text"
                    value={canonForm.status}
                    onChange={(e) => setCanonForm({ ...canonForm, status: e.target.value })}
                    placeholder="VD: Ngoài lạnh trong nóng, điềm tĩnh, dịu dàng..."
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                  Ấn tượng / Ghi chú thiết lập nhân vật
                </label>
                <textarea
                  rows={3}
                  value={canonForm.notes}
                  onChange={(e) => setCanonForm({ ...canonForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCanon(false)}
                  className="px-4 py-1.5 rounded bg-white/10 text-xs text-neutral-300 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded bg-white text-black text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Canon & Thể loại</span>
                </button>
              </div>
            </form>
          )}

          {/* DUAL-PAGE MAGAZINE SPREAD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* LEFT PAGE: Minimal Emblem, Poetic Title, Vertical Divider & Identity */}
            <div className="bg-[#DFDFDC] text-[#18181A] p-8 sm:p-12 min-h-[540px] sm:min-h-[640px] flex flex-col items-center justify-between text-center shadow-2xl">
              <div className="mt-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center shadow-inner">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2E2E32]" />
              </div>

              <div className="my-auto space-y-6">
                <div>
                  <h2 className="font-editorial italic text-3xl sm:text-4xl text-[#18181A] leading-none">
                    The canon
                  </h2>
                  <span className="font-serif text-2xl sm:text-3xl text-[#18181A] block -mt-1">
                    dossier
                  </span>
                </div>

                <div className="w-[1px] h-10 bg-neutral-500 mx-auto" />

                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-medium text-[#18181A] tracking-wide">
                    {character.name}
                  </div>
                  {(character.originalChineseName || character.profileData.alias) && (
                    <div className="text-[11px] text-neutral-600">
                      {character.originalChineseName || character.profileData.alias}.
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1.5 py-2">
                  <span className="w-0.5 h-0.5 rounded-full bg-neutral-600" />
                  <span className="w-0.5 h-0.5 rounded-full bg-neutral-600" />
                  <span className="w-0.5 h-0.5 rounded-full bg-neutral-600" />
                </div>
              </div>

              <div className="mb-2 font-editorial italic text-xs sm:text-sm text-[#2A2A2D]">
                {character.originalNovelTitle?.toLowerCase() || 'black apple archive'}
              </div>
            </div>

            {/* RIGHT PAGE: Close-Up Portrait + Canon Attributes List */}
            <div className="bg-[#DFDFDC] text-[#18181A] p-8 sm:p-12 min-h-[540px] sm:min-h-[640px] flex flex-col justify-between shadow-2xl">
              {/* Upper Centered Portrait Crop */}
              <div className="w-[78%] sm:w-[74%] mx-auto mt-2 aspect-[3/3.6] overflow-hidden bg-neutral-300 shadow-sm">
                <ImageWithFallback
                  src={secondaryPortrait}
                  alt={character.name}
                  className="w-full h-full object-cover grayscale contrast-[1.08]"
                />
              </div>

              {/* Canon Specs Table */}
              <div className="w-[86%] mx-auto my-6 space-y-5">
                <div className="pt-3 border-t border-black/15 grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.aliasLabel || 'Biệt danh / Danh xưng'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.alias || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.ageLabel || 'Tuổi / Ngày sinh'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.age || character.profileData.birthday
                        ? `${character.profileData.age}${
                            character.profileData.age && character.profileData.birthday ? ' · ' : ''
                          }${character.profileData.birthday}`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.heightLabel || 'Chiều cao / Ngoại hình'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.height || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.affiliationLabel || 'Xuất thân / Bối cảnh'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.affiliation || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.weaponLabel || 'Đặc điểm / Sở thích'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.weapon || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.statusLabel || 'Tính cách / Khí chất'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.status || '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">
                      {character.profileData.roleLabel || 'Thân phận & Thể loại'}
                    </span>
                    <span className="font-medium text-[#18181A]">
                      {character.profileData.role || charGenres.length > 0
                        ? `${character.profileData.role}${
                            character.profileData.role && charGenres.length > 0 ? ' · ' : ''
                          }${charGenres.map((g) => g.name).join(', ')}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom "next section >" Anchor */}
              <div className="text-center">
                <a
                  href={hasDetailedDossier ? '#dossier-details-section' : '#npcs-section'}
                  className="text-[10px] tracking-wider text-neutral-600 hover:text-black transition-colors"
                >
                  next section &gt;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          EXPANDED DOSSIER: NGOẠI HÌNH, TÍNH CÁCH, SỞ THÍCH & MỐI QUAN HỆ
      ===================================================================== */}
      {(hasDetailedDossier || isAdmin) && (
        <section
          id="dossier-details-section"
          className="w-full bg-[#FAF9F6] text-[#18181A] py-16 sm:py-24 px-4 sm:px-8 border-b border-black/[0.08]"
        >
          <div className="max-w-[880px] mx-auto space-y-8 sm:space-y-10">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/15">
              <div>
                <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-500 block mb-1">
                  CHUYÊN KHẢO THIẾT LẬP // DOSSIER PROFILE
                </span>
                <h2 className="font-editorial italic text-3xl sm:text-4xl text-[#18181A]">
                  Hồ Sơ Nhân Vật · {character.name}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-serif italic text-neutral-500 hidden sm:block lowercase">
                  {character.originalNovelTitle?.toLowerCase() || 'black apple archive'}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDossier(!isEditingDossier)}
                    className="px-3.5 py-1.5 rounded-full bg-[#18181A] hover:bg-neutral-800 text-white text-[10px] font-medium tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingDossier ? 'Đóng chỉnh sửa' : 'Sửa chuyên khảo hồ sơ (Mục 02 - 06)'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Admin Inline Dossier Editor */}
            {isEditingDossier && isAdmin && (
              <form
                onSubmit={handleSaveDossierInfo}
                className="p-6 rounded-2xl bg-white border border-black/15 text-[#18181A] space-y-5 shadow-lg"
              >
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <h3 className="font-editorial italic text-lg sm:text-xl text-[#18181A]">
                    Chỉnh sửa chuyên khảo hồ sơ chi tiết (Mục 02 - 06)
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    LƯU VÀO FIRESTORE
                  </span>
                </div>

                {/* 02. Ngoại hình */}
                <div>
                  <label className="block text-xs font-semibold text-[#18181A] mb-1">
                    ˙✦ 02. Ngoại hình (Vóc dáng, đường nét gương mặt, trang phục...):
                  </label>
                  <textarea
                    rows={3}
                    value={dossierForm.appearance}
                    onChange={(e) => setDossierForm({ ...dossierForm, appearance: e.target.value })}
                    placeholder="VD: Cao ráo 188cm, vai rộng, thân hình săn chắc nhờ tập boxing, mắt nâu đen, tóc đen tỉa nhiều lớp..."
                    className="w-full p-3 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#18181A] leading-relaxed font-sans"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                {/* 03. Tính cách */}
                <div>
                  <label className="block text-xs font-semibold text-[#18181A] mb-1">
                    ˙✦ 03. Tính cách đặc trưng:
                  </label>
                  <textarea
                    rows={3}
                    value={dossierForm.personality}
                    onChange={(e) => setDossierForm({ ...dossierForm, personality: e.target.value })}
                    placeholder="VD: Ngông nghênh, bất cần, nghịch ngợm, không thích làm học sinh gương mẫu nhưng không bắt nạt kẻ yếu..."
                    className="w-full p-3 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#18181A] leading-relaxed font-sans"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                {/* 04. Sở thích & Thói quen */}
                <div className="p-4 rounded-xl bg-[#F5F4EE] border border-black/10 space-y-3">
                  <span className="text-xs font-semibold text-[#18181A] block">
                    ˙✦ 04. Sở thích & Thói quen:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800 mb-1">✓ Thích:</label>
                      <input
                        type="text"
                        value={dossierForm.hobbies}
                        onChange={(e) => setDossierForm({ ...dossierForm, hobbies: e.target.value })}
                        placeholder="VD: Quyền Anh, chạy bộ sáng..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/15 text-xs text-[#18181A]"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-rose-800 mb-1">✕ Không thích:</label>
                      <input
                        type="text"
                        value={dossierForm.dislikes}
                        onChange={(e) => setDossierForm({ ...dossierForm, dislikes: e.target.value })}
                        placeholder="VD: Đậu phụ, đồ ngọt, thuyết giáo..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/15 text-xs text-[#18181A]"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-800 mb-1">⚠ Dị ứng:</label>
                      <input
                        type="text"
                        value={dossierForm.allergies}
                        onChange={(e) => setDossierForm({ ...dossierForm, allergies: e.target.value })}
                        placeholder="VD: Phấn hoa..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/15 text-xs text-[#18181A]"
                        style={{ fontSize: '15px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">
                      Một vài thói quen đặc trưng (Mỗi thói quen một dòng):
                    </label>
                    <textarea
                      rows={3}
                      value={dossierForm.habitsText}
                      onChange={(e) => setDossierForm({ ...dossierForm, habitsText: e.target.value })}
                      placeholder="Không thích mang cặp sách&#10;Thích ngủ trong lớp nhưng dậy sớm chạy bộ&#10;Biết nấu ăn..."
                      className="w-full p-2.5 rounded-lg bg-white border border-black/15 text-xs text-[#18181A] leading-relaxed font-sans"
                      style={{ fontSize: '15px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">
                      Điểm đặc biệt (Khác biệt / Yếu tố riêng độc đáo):
                    </label>
                    <input
                      type="text"
                      value={dossierForm.specialNote}
                      onChange={(e) => setDossierForm({ ...dossierForm, specialNote: e.target.value })}
                      placeholder="VD: Không phân biệt trái và phải một cách đáng tin cậy..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/15 text-xs text-[#18181A]"
                      style={{ fontSize: '15px' }}
                    />
                  </div>
                </div>

                {/* 05. Gia đình */}
                <div>
                  <label className="block text-xs font-semibold text-[#18181A] mb-1">
                    ˙✦ 05. Gia đình & Hoàn cảnh cá nhân:
                  </label>
                  <textarea
                    rows={2}
                    value={dossierForm.family}
                    onChange={(e) => setDossierForm({ ...dossierForm, family: e.target.value })}
                    placeholder="VD: Không còn bố mẹ, người thầy dạy quyền Anh hỗ trợ nhập học..."
                    className="w-full p-3 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#18181A] leading-relaxed font-sans"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                {/* 06. Mối quan hệ với bạn */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-rose-900">
                      ˙✦ 06. Mối quan hệ với bạn (Độc giả / Bạn):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-600">Trạng thái:</span>
                      <input
                        type="text"
                        value={dossierForm.relationshipStatus}
                        onChange={(e) => setDossierForm({ ...dossierForm, relationshipStatus: e.target.value })}
                        placeholder="VD: Người yêu cũ / Bạn thân / Đối thủ..."
                        className="bg-white border border-rose-300 rounded px-2.5 py-1 text-xs text-rose-900"
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={dossierForm.relationshipWithUser}
                    onChange={(e) => setDossierForm({ ...dossierForm, relationshipWithUser: e.target.value })}
                    placeholder="Mô tả bối cảnh và diễn biến tình cảm..."
                    className="w-full p-3 rounded-lg bg-white border border-rose-200 text-xs text-[#18181A] leading-relaxed font-sans"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                {/* 07. Một chút về nhân vật */}
                <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200 space-y-2">
                  <span className="text-xs font-semibold text-[#18181A]">
                    ˙✦ 07. Một chút về {character.name}:
                  </span>
                  <textarea
                    rows={4}
                    value={dossierForm.about}
                    onChange={(e) => setDossierForm({ ...dossierForm, about: e.target.value })}
                    placeholder="Những khía cạnh tự sự, góc nhìn sâu sắc về nhân vật..."
                    className="w-full p-3 rounded-lg bg-white border border-neutral-200 text-xs text-[#18181A] leading-relaxed font-sans"
                    style={{ fontSize: '15px' }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDossier(false)}
                    className="px-4 py-2 rounded-lg border border-black/15 text-xs text-neutral-600 hover:text-black cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-[#18181A] hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu chuyên khảo hồ sơ vào Firestore</span>
                  </button>
                </div>
              </form>
            )}

            {/* If empty and not editing, guide admin */}
            {!hasDetailedDossier && isAdmin && !isEditingDossier && (
              <div className="p-8 text-center bg-white border border-dashed border-black/20 rounded-xl space-y-2">
                <p className="font-editorial italic text-base text-[#18181A]">
                  Chưa có thông tin chuyên khảo chi tiết (Mục 02 - 06) cho {character.name}
                </p>
                <p className="text-xs text-neutral-500 font-serif">
                  Nhấn nút &ldquo;Sửa chuyên khảo hồ sơ (Mục 02 - 06)&rdquo; phía trên để nhập ngoại hình, tính cách, sở thích, thói quen và mối quan hệ.
                </p>
              </div>
            )}

            {/* 02. NGOẠI HÌNH */}
            {character.profileData.appearance && (
              <div className="bg-white p-7 sm:p-10 border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
                <div className="pb-3 border-b border-black/[0.06]">
                  <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A]">
                    ˙✦ 02. Ngoại hình
                  </h3>
                </div>
                <div className="font-serif text-xs sm:text-[14px] text-neutral-700 leading-[2.2] whitespace-pre-line">
                  {character.profileData.appearance}
                </div>
              </div>
            )}

            {/* 03. TÍNH CÁCH */}
            {character.profileData.personality && (
              <div className="bg-white p-7 sm:p-10 border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
                <div className="pb-3 border-b border-black/[0.06]">
                  <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A]">
                    ˙✦ 03. Tính cách đặc trưng
                  </h3>
                </div>
                <div className="font-serif text-xs sm:text-[14px] text-neutral-700 leading-[2.2] whitespace-pre-line">
                  {character.profileData.personality}
                </div>
              </div>
            )}

            {/* 04. SỞ THÍCH & THÓI QUEN */}
            {(character.profileData.hobbies || character.profileData.dislikes || character.profileData.allergies || (character.profileData.habits && character.profileData.habits.length > 0) || character.profileData.specialNote) && (
              <div className="bg-white p-7 sm:p-10 border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6">
                <div className="pb-3 border-b border-black/[0.06]">
                  <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A]">
                    ˙✦ 04. Sở thích & Thói quen
                  </h3>
                </div>

                {/* 3 Thẻ Sở thích, Không thích, Dị ứng theo phong cách trang sách cổ điển */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {character.profileData.hobbies && (
                    <div className="p-5 rounded-lg bg-[#F5F4EE] border border-black/[0.06] space-y-1.5">
                      <span className="font-editorial italic text-xs text-neutral-800 block">
                        Thích
                      </span>
                      <p className="font-serif text-xs sm:text-[13px] text-neutral-700 leading-relaxed">
                        {character.profileData.hobbies}
                      </p>
                    </div>
                  )}

                  {character.profileData.dislikes && (
                    <div className="p-5 rounded-lg bg-[#F5F4EE] border border-black/[0.06] space-y-1.5">
                      <span className="font-editorial italic text-xs text-neutral-800 block">
                        Không thích
                      </span>
                      <p className="font-serif text-xs sm:text-[13px] text-neutral-700 leading-relaxed">
                        {character.profileData.dislikes}
                      </p>
                    </div>
                  )}

                  {character.profileData.allergies && (
                    <div className="p-5 rounded-lg bg-[#F5F4EE] border border-black/[0.06] space-y-1.5">
                      <span className="font-editorial italic text-xs text-neutral-800 block">
                        Dị ứng
                      </span>
                      <p className="font-serif text-xs sm:text-[13px] text-neutral-700 leading-relaxed">
                        {character.profileData.allergies}
                      </p>
                    </div>
                  )}
                </div>

                {/* Thói quen đặc trưng */}
                {character.profileData.habits && character.profileData.habits.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="font-editorial italic text-sm text-[#18181A] block">
                      Một vài thói quen đặc trưng:
                    </span>
                    <ul className="space-y-2 text-xs sm:text-[13px] text-neutral-700 font-serif">
                      {character.profileData.habits.map((habit, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-neutral-400 select-none font-serif">—</span>
                          <span className="leading-relaxed">{habit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Điểm đặc biệt */}
                {character.profileData.specialNote && (
                  <div className="border-l-2 border-black/30 pl-5 py-2 bg-[#F5F4EE] p-5 rounded-r-lg space-y-1">
                    <span className="font-editorial italic text-xs text-[#18181A] block">
                      Đặc biệt:
                    </span>
                    <p className="font-serif text-xs sm:text-[13px] text-neutral-700 leading-relaxed">
                      {character.profileData.specialNote}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 05. GIA ĐÌNH */}
            {character.profileData.family && (
              <div className="bg-white p-7 sm:p-10 border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
                <div className="pb-3 border-b border-black/[0.06]">
                  <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A]">
                    ˙✦ 05. Gia đình & Hoàn cảnh
                  </h3>
                </div>
                <div className="font-serif text-xs sm:text-[14px] text-neutral-700 leading-[2.2] whitespace-pre-line">
                  {character.profileData.family}
                </div>
              </div>
            )}

            {/* 06. MỐI QUAN HỆ VỚI BẠN */}
            {character.profileData.relationshipWithUser && (
              <div className="bg-white p-7 sm:p-10 border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-black/[0.06]">
                  <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A]">
                    ˙✦ 06. Mối quan hệ với bạn
                  </h3>
                  {character.profileData.relationshipStatus && (
                    <span className="px-3.5 py-1 rounded-full border border-black/15 bg-[#F5F4EE] text-[#18181A] font-serif text-xs italic">
                      Tình trạng: {character.profileData.relationshipStatus}
                    </span>
                  )}
                </div>
                <div className="font-serif text-xs sm:text-[14px] text-neutral-700 leading-[2.2] whitespace-pre-line">
                  {character.profileData.relationshipWithUser}
                </div>
              </div>
            )}

            {/* 07. MỘT CHÚT VỀ NHÂN VẬT */}
            {character.profileData.about && (
              <div className="bg-white p-7 sm:p-10 border border-black/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
                <div className="pb-3 border-b border-black/[0.06]">
                  <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A]">
                    ˙✦ 07. Một chút về {character.name}
                  </h3>
                </div>
                <div className="font-serif text-xs sm:text-[14px] text-neutral-700 leading-[2.2] whitespace-pre-line">
                  {character.profileData.about}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* =====================================================================
          SECTION 02: NPCS QUAN TRỌNG (IMPORTANT NPCS)
      ===================================================================== */}
      {((character.npcs && character.npcs.length > 0) || isAdmin) && (
        <section
          id="npcs-section"
          className="w-full bg-[#FAF9F6] py-16 sm:py-24 px-4 sm:px-8 border-b border-black/[0.08]"
        >
        <div className="max-w-[880px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/15">
            <div>
              <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-500 block mb-1">
                02 // MẠNG LƯỚI NHÂN VẬT LIÊN QUAN
              </span>
              <h2 className="font-editorial italic text-3xl sm:text-4xl text-[#161618]">
                NPCs Quan Trọng
              </h2>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddingNpc(!isAddingNpc)}
                className="self-start sm:self-auto px-4 py-1.5 rounded-full bg-[#161618] text-white text-[11px] font-medium tracking-wider uppercase flex items-center gap-1.5 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm NPC Quan Trọng</span>
              </button>
            )}
          </div>

          {/* Admin Add NPC Form */}
          {isAddingNpc && isAdmin && (
            <form
              onSubmit={handleAddNpc}
              className="mt-6 p-6 rounded-2xl bg-white border border-black/15 shadow-sm space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  required
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  placeholder="Tên NPC *"
                  className="px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-black/15 text-[#161618]"
                />
                <input
                  type="text"
                  value={newNpcRole}
                  onChange={(e) => setNewNpcRole(e.target.value)}
                  placeholder="Mối quan hệ / Vai trò (VD: Tam hoàng tử, Bạn thân...)"
                  className="px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-black/15 text-[#161618]"
                />
              </div>
              <textarea
                rows={2}
                required
                value={newNpcDesc}
                onChange={(e) => setNewNpcDesc(e.target.value)}
                placeholder="Mô tả mối liên hệ giữa NPC này và Character..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#161618]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNpc(false)}
                  className="px-4 py-1.5 rounded-lg border border-black/15 text-xs text-neutral-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-[#161618] text-white text-xs font-semibold"
                >
                  Lưu NPC
                </button>
              </div>
            </form>
          )}

          {/* NPCs Editorial Cards Grid (Without Image - Clean Editorial Typography) */}
          {(character.npcs || []).length === 0 ? (
            <div className="mt-8 py-12 text-center border border-dashed border-black/15 bg-white/50">
              <p className="text-xs text-neutral-500 font-serif italic">
                Chưa có NPC liên quan nào trong hồ sơ của {character.name}.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {(character.npcs || []).map((npc, idx) => (
                <div
                  key={npc.id}
                  className="bg-[#E6E5E1] text-[#18181A] p-6 sm:p-7 border border-black/[0.08] shadow-sm relative group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-black/[0.08]">
                      <span className="text-[9px] tracking-[0.22em] uppercase text-neutral-500 font-mono">
                        NPC // 0{idx + 1}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNpc(npc.id)}
                          className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                          title="Xóa NPC này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-editorial italic text-xl sm:text-2xl text-[#18181A] leading-snug">
                      {npc.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7F1D1D] font-semibold mt-1 mb-2.5 font-sans">
                      {npc.role}
                    </p>
                    <p className="text-xs sm:text-[13px] text-neutral-700 leading-relaxed font-serif whitespace-pre-line">
                      {npc.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* =====================================================================
          SECTION 03: VĂN ÁN (OFFICIAL SYNOPSIS)
      ===================================================================== */}
      <section
        id="synopsis-section"
        className="relative w-full bg-[#FAF9F6] py-16 sm:py-24 px-4 sm:px-8 border-b border-black/[0.08] overflow-hidden"
      >
        {/* Subtle Organic Thread Curve */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          viewBox="0 0 1000 600"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M -50 120 C 260 40, 480 340, 740 240 C 900 180, 960 420, 1050 520"
            stroke="#8C8984"
            strokeWidth="1"
          />
        </svg>

        <div className="relative z-10 max-w-[780px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-500">
                03 // VĂN ÁN CHÍNH THỨC
              </span>
              {character.isSynopsis18Plus && (
                <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.16em] uppercase font-semibold text-[#991B1B]">
                  <Lock className="w-3 h-3 text-[#DC2626]" />
                  <span>18+ RESTRICTED</span>
                </span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleQuickToggleSynopsis18}
                  className={`px-3.5 py-1 rounded-full border text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    character.isSynopsis18Plus
                      ? 'bg-[#991B1B] border-[#991B1B] text-white hover:bg-[#7F1D1D] shadow-sm'
                      : 'bg-white border-black/20 text-[#991B1B] hover:border-[#991B1B] hover:bg-[#FEF2F2]'
                  }`}
                  title="Bật hoặc tắt khóa xác nhận 18+ cho phần Văn án của nhân vật này"
                >
                  <Lock className={`w-3 h-3 ${character.isSynopsis18Plus ? 'text-red-200' : 'text-[#DC2626]'}`} />
                  <span>
                    {character.isSynopsis18Plus ? 'Khóa 18+: ĐANG BẬT' : 'Bật Khóa Văn Án 18+'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingSynopsis(!isEditingSynopsis)}
                  className="px-3.5 py-1 rounded-full border border-black/20 hover:bg-[#161618] hover:text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingSynopsis ? 'Đóng sửa văn án' : 'Chỉnh sửa Văn án'}</span>
                </button>
              </div>
            )}
          </div>

          {isEditingSynopsis && isAdmin ? (
            <form
              onSubmit={handleSaveSynopsis}
              className="p-6 rounded-2xl bg-white border border-black/15 shadow-sm space-y-5"
            >
              {/* 18+ Lock Configuration Inside Synopsis Editor */}
              <div className="p-4 rounded-xl bg-[#FFFBFB] border border-[#DC2626]/25 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FEF2F2] border border-[#DC2626]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-4 h-4 text-[#DC2626]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#161618] block">
                        Chế độ Khóa Văn Án 18+ (Xác nhận độ tuổi & nhận thức)
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        Khi bật, văn án sẽ bị khóa bằng biểu tượng ổ khóa đỏ và yêu cầu người đọc xác nhận đủ 18 tuổi trước khi mở ra.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditedSynopsis18Plus(false)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        !editedSynopsis18Plus
                          ? 'bg-[#161618] text-white'
                          : 'bg-neutral-100 text-neutral-500 hover:text-black'
                      }`}
                    >
                      Mở tự do
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditedSynopsis18Plus(true)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        editedSynopsis18Plus
                          ? 'bg-[#991B1B] text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-500 hover:text-[#991B1B]'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Khóa 18+</span>
                    </button>
                  </div>
                </div>

                {editedSynopsis18Plus && (
                  <div className="pt-2 border-t border-[#DC2626]/15">
                    <label className="block text-[10px] uppercase tracking-wider text-[#991B1B] font-semibold mb-1">
                      Lời nhắc / Cảnh báo riêng trước khi mở văn án (Độc giả sẽ thấy dòng này):
                    </label>
                    <input
                      type="text"
                      value={editedSynopsis18Warning}
                      onChange={(e) => setEditedSynopsis18Warning(e.target.value)}
                      placeholder="Mặc định: Văn án có yếu tố 18+, tâm lý nặng hoặc tình tiết nhạy cảm. Vui lòng cân nhắc kỹ trước khi đọc."
                      className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DC2626]/30 text-xs text-[#161618]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Câu trích dẫn mở đầu (Tagline)
                </label>
                <input
                  type="text"
                  value={editedTagline}
                  onChange={(e) => setEditedTagline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#161618]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Nội dung Văn án
                </label>
                <textarea
                  rows={8}
                  value={editedSynopsis}
                  onChange={(e) => setEditedSynopsis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] border border-black/15 text-xs text-[#161618] leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSynopsis(false)}
                  className="px-4 py-1.5 rounded-lg border border-black/15 text-xs text-neutral-500 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-[#161618] text-white text-xs font-semibold cursor-pointer"
                >
                  Lưu Văn án
                </button>
              </div>
            </form>
          ) : (
            <div
              className={`bg-white p-8 sm:p-14 border transition-all duration-300 relative overflow-hidden ${
                character.isSynopsis18Plus && !isSynopsis18Unlocked
                  ? 'border-[#991B1B]/30 shadow-[0_20px_60px_rgba(153,27,27,0.07)]'
                  : 'border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.04)]'
              }`}
            >
              {/* Top Crimson Archival Hairline when 18+ mode is enabled */}
              {character.isSynopsis18Plus && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#7F1D1D] via-[#DC2626] to-[#7F1D1D]" />
              )}

              <div className="text-center mb-10">
                <span className="text-[10px] tracking-[0.26em] lowercase text-neutral-400 block mb-2 font-serif italic">
                  {character.originalNovelTitle?.toLowerCase() || 'black apple archive'}
                </span>
                <h2 className="font-editorial italic text-2xl sm:text-4xl text-[#161618]">
                  “{character.tagline}”
                </h2>
                <div
                  className={`w-12 h-[1px] mx-auto mt-5 ${
                    character.isSynopsis18Plus && !isSynopsis18Unlocked
                      ? 'bg-[#DC2626]/60'
                      : 'bg-neutral-400'
                  }`}
                />
              </div>

              {character.isSynopsis18Plus && !isSynopsis18Unlocked ? (
                /* =============================================================
                   LOCKED 18+ SYNOPSIS CONFIRMATION VAULT (RED LOCK DESIGN)
                ============================================================= */
                <div className="relative py-6 sm:py-10 px-4 sm:px-8 rounded-2xl bg-[#FAF8F6] border border-[#991B1B]/20 max-w-[620px] mx-auto overflow-hidden">
                  {/* Decorative Blurred Redacted Manuscript Lines in Background */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none select-none opacity-[0.12] blur-[3px] space-y-3 mb-4 font-serif text-xs text-neutral-700 leading-loose text-justify"
                  >
                    <p>
                      Bản ghi chép lưu trữ thuộc phân khu giới hạn của vũ trụ BLACK APPLE. Mọi diễn biến tâm lý, góc khuất quá khứ và những ràng buộc định mệnh đều được niêm phong cẩn mật.
                    </p>
                    <p>
                      Người đọc cần xác nhận độ tuổi trưởng thành và sự sẵn sàng về mặt nhận thức trước khi tiếp cận toàn văn hồ sơ cốt truyện này.
                    </p>
                  </div>

                  {/* Foreground Crimson Lock & Verification Content */}
                  <div className="relative z-10 text-center space-y-6">
                    {/* Prominent Red Lock Seal */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FEF2F2] border-2 border-[#DC2626]/40 flex items-center justify-center shadow-[0_10px_30px_rgba(220,38,38,0.16)]">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#991B1B] flex items-center justify-center text-white shadow-inner">
                          <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.2]" />
                        </div>
                        <span className="absolute -bottom-1.5 px-2 py-0.5 rounded bg-[#DC2626] text-white font-mono text-[10px] font-bold tracking-wider shadow-sm">
                          18+
                        </span>
                      </div>

                      <span className="mt-4 text-[10px] tracking-[0.26em] uppercase font-semibold text-[#991B1B]">
                        HỒ SƠ VĂN ÁN ĐANG BỊ KHÓA // RESTRICTED
                      </span>
                      <h3 className="mt-1.5 font-editorial italic text-xl sm:text-2xl text-[#161618]">
                        Xác Nhận Độ Tuổi & Ý Thức Độc Giả
                      </h3>
                    </div>

                    {/* Warning Description */}
                    <p className="font-serif text-xs sm:text-[13.5px] text-neutral-600 leading-[1.9] max-w-[490px] mx-auto">
                      {character.synopsis18WarningNote?.trim() ||
                        'Văn án của nhân vật này có chứa yếu tố trưởng thành (18+), xung đột tâm lý hoặc tình tiết nhạy cảm. Vui lòng cân nhắc kỹ và xác nhận trước khi mở khóa nội dung.'}
                    </p>

                    {/* Explicit Confirmation Checkbox */}
                    <div className="max-w-[490px] mx-auto pt-1">
                      <label
                        onClick={() => {
                          setIsAgeConfirmedCheckbox(!isAgeConfirmedCheckbox);
                          if (synopsis18Error) setSynopsis18Error(false);
                        }}
                        className={`flex items-start gap-3.5 p-4 rounded-xl border text-left cursor-pointer transition-all select-none ${
                          isAgeConfirmedCheckbox
                            ? 'bg-[#FEF2F2]/80 border-[#DC2626] shadow-sm'
                            : synopsis18Error
                            ? 'bg-[#FEF2F2] border-[#DC2626] ring-2 ring-[#DC2626]/20'
                            : 'bg-white border-black/15 hover:border-[#991B1B]/50'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isAgeConfirmedCheckbox
                              ? 'bg-[#DC2626] border-[#DC2626] text-white'
                              : 'bg-white border-neutral-400'
                          }`}
                        >
                          {isAgeConfirmedCheckbox && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                        <span className="font-serif text-xs sm:text-[13px] text-[#18181A] leading-relaxed">
                          Tôi xác nhận bản thân <strong>đã đủ 18 tuổi</strong> và{' '}
                          <strong>hoàn toàn ý thức được những gì mình sắp đọc</strong>, tự nguyện tiếp tục xem văn án này.
                        </span>
                      </label>

                      {synopsis18Error && (
                        <p className="mt-2.5 text-[11px] text-[#DC2626] font-medium flex items-center justify-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Vui lòng đánh dấu xác nhận đủ 18 tuổi và hoàn toàn ý thức nội dung ở trên trước khi mở khóa.
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Confirm & Pour Out Synopsis Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleUnlockSynopsis18}
                        className={`px-7 py-3 rounded-full text-xs uppercase tracking-[0.16em] font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isAgeConfirmedCheckbox
                            ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white shadow-[0_10px_25px_rgba(153,27,27,0.28)]'
                            : 'bg-[#161618] hover:bg-[#991B1B] text-white/90'
                        }`}
                      >
                        {isAgeConfirmedCheckbox ? (
                          <Unlock className="w-3.5 h-3.5 text-red-200" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#F87171]" />
                        )}
                        <span>Xác Nhận & Mở Văn Án</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* =============================================================
                   UNLOCKED OR PUBLIC SYNOPSIS CONTENT
                ============================================================= */
                <div className="space-y-6">
                  {character.isSynopsis18Plus && (
                    <div className="max-w-[600px] mx-auto pb-4 mb-2 border-b border-[#991B1B]/15 flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-[#991B1B] font-medium">
                        <Unlock className="w-3 h-3 text-[#DC2626]" />
                        <span>Đã xác nhận 18+ · Nội dung văn án đã mở</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSynopsis18Unlocked(false);
                          setIsAgeConfirmedCheckbox(false);
                        }}
                        className="px-3 py-1 rounded-full bg-[#FEF2F2] hover:bg-[#991B1B] text-[#991B1B] hover:text-white border border-[#DC2626]/30 text-[10px] tracking-wider uppercase font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Khóa lại văn án</span>
                      </button>
                    </div>
                  )}

                  <div className="text-xs sm:text-[14px] text-neutral-700 leading-[2.05] whitespace-pre-line font-serif max-w-[600px] mx-auto">
                    {character.synopsis}
                  </div>
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-black/[0.06] flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-neutral-400">
                <span>ARCHIVE // {character.code}</span>
                <span>{character.name}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 04: LINK GGAI (PUBLIC HOẶC PRIVATE - NHẬP PASS & CÂU HỎI)
      ===================================================================== */}
      <section
        id="ggai-section"
        className="w-full bg-[#18181A] text-white py-16 sm:py-24 px-4 sm:px-8"
      >
        <div className="max-w-[780px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-400">
              04 // CỔNG KẾT NỐI LINK GGAI (ROLEPLAY AI)
            </span>

            {isAdmin && (
              <button
                onClick={() => setIsEditingGgai(!isEditingGgai)}
                className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white text-white hover:text-black text-[10px] font-medium tracking-wider uppercase flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>
                  {isEditingGgai ? 'Đóng cấu hình GGAI' : 'Cài đặt Public / Private & Pass'}
                </span>
              </button>
            )}
          </div>

          {/* Admin GGAI Configuration Editor */}
          {isEditingGgai && isAdmin && (
            <form
              onSubmit={handleSaveGgaiConfig}
              className="mb-8 p-6 rounded-2xl bg-[#222226] border border-white/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-semibold uppercase tracking-wider text-white">
                  Chế độ truy cập Link GGAI
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGgaiForm({ ...ggaiForm, isRoleplayLocked: false })}
                    className={`px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase transition-colors ${
                      !ggaiForm.isRoleplayLocked
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    PUBLIC (Mở tự do)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGgaiForm({ ...ggaiForm, isRoleplayLocked: true })}
                    className={`px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase transition-colors ${
                      ggaiForm.isRoleplayLocked
                        ? 'bg-amber-300 text-black'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    PRIVATE (Yêu cầu Pass)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                  Đường dẫn Link GGAI (URL)
                </label>
                <input
                  type="url"
                  value={ggaiForm.roleplayLink}
                  onChange={(e) =>
                    setGgaiForm({ ...ggaiForm, roleplayLink: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded bg-black/60 border border-white/15 text-white"
                />
              </div>

              {ggaiForm.isRoleplayLocked && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Câu hỏi gợi ý mở khóa (Hiển thị cho người đọc)
                    </label>
                    <input
                      type="text"
                      value={ggaiForm.roleplayUnlockQuestion}
                      onChange={(e) =>
                        setGgaiForm({
                          ...ggaiForm,
                          roleplayUnlockQuestion: e.target.value
                        })
                      }
                      placeholder="VD: Cuộc gặp gỡ diễn ra ở thành phố nào?"
                      className="w-full px-3.5 py-2 rounded bg-black/60 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Mật khẩu / Đáp án mở khóa (Pass)
                    </label>
                    <input
                      type="text"
                      value={ggaiForm.roleplayUnlockAnswer}
                      onChange={(e) =>
                        setGgaiForm({
                          ...ggaiForm,
                          roleplayUnlockAnswer: e.target.value
                        })
                      }
                      placeholder="VD: Nam Thành"
                      className="w-full px-3.5 py-2 rounded bg-black/60 border border-white/15 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGgai(false)}
                  className="px-4 py-1.5 rounded bg-white/10 text-neutral-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded bg-white text-black font-semibold"
                >
                  Lưu cài đặt GGAI
                </button>
              </div>
            </form>
          )}

          {/* GGAI Display Card (Matches Reference Image 2 Stone Panel Aesthetic) */}
          <div className="bg-[#DFDFDC] text-[#18181A] p-8 sm:p-12 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/15">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 block">
                  GGAI INTERACTION PORTAL
                </span>
                <h2 className="font-editorial italic text-2xl sm:text-3xl text-[#18181A] mt-0.5">
                  Link GGAI · {character.name}
                </h2>
              </div>

              {/* Status Badge: PUBLIC or PRIVATE & Roleplay Clicks Counter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-black/40 text-neutral-300 border border-white/15 text-[10px] tracking-[0.16em] uppercase font-sans font-medium flex items-center gap-1.5 shadow-sm" title="Tổng số lượt nhấp nhận link Roleplay">
                  <span className="text-neutral-300 font-serif">—</span>
                  <span>{(character.roleplayClicks || 0).toLocaleString()} LƯỢT NHẬN LINK</span>
                </span>
                {character.isRoleplayLocked ? (
                  <span className="px-3.5 py-1 rounded-full bg-[#18181A] text-white text-[10px] tracking-[0.18em] uppercase font-semibold flex items-center gap-1.5 border border-white/20">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>PRIVATE · YÊU CẦU PASS</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full bg-white text-[#18181A] border border-black/20 text-[10px] tracking-[0.18em] uppercase font-semibold flex items-center gap-1.5">
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    <span>PUBLIC · TRUY CẬP TỰ DO</span>
                  </span>
                )}
              </div>
            </div>

            {/* If Unlocked (or PUBLIC) -> Show Direct Link Button */}
            {!character.isRoleplayLocked || isGgaiUnlocked ? (
              <div className="pt-8 space-y-5 text-center">
                <p className="text-xs sm:text-sm text-neutral-700 font-serif max-w-md mx-auto leading-relaxed">
                  Cổng tương tác GGAI của <strong>{character.name}</strong> đã sẵn sàng. Nhấn vào liên kết bên dưới để bắt đầu trò chuyện.
                </p>

                {character.roleplayLink ? (
                  <a
                    href={character.roleplayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      incrementRoleplayClicks(character.id);
                      incrementRoleplayClicksSupabase(character.id);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#18181A] hover:bg-neutral-800 text-white text-xs font-semibold tracking-[0.2em] uppercase transition-all shadow-lg active:scale-95"
                  >
                    <span>Truy cập Link GGAI</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    Hiện chưa gắn URL Link GGAI cho nhân vật này.
                  </p>
                )}
              </div>
            ) : (() => {
              const parsedQA = parseQuestionAndHint(character.roleplayUnlockQuestion);
              return (
                /* If PRIVATE & Locked -> Show Separated Question, Hint, and Password Input */
                <div className="pt-8 max-w-lg mx-auto space-y-4">
                  {/* 01. Separate Question Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/15 shadow-sm space-y-2 text-left">
                    <div className="flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-[#735a38] font-serif font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#b8860b]" />
                      <span>Câu hỏi mở khóa Canon</span>
                    </div>
                    <p className="font-serif text-xs sm:text-[13.5px] text-[#1c1917] leading-relaxed italic select-text">
                      “{parsedQA.question}”
                    </p>
                  </div>

                  {/* 02. Separate Hint Card (If present) */}
                  {parsedQA.hint && (
                    <div className="p-4 rounded-2xl bg-[#f5ede1] border border-[#c5a880]/50 shadow-sm space-y-1.5 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#8c5e28] font-serif font-semibold">
                        <KeyRound className="w-3.5 h-3.5 text-[#8c5e28]" />
                        <span>Gợi ý mật mã</span>
                      </div>
                      <p className="font-serif text-xs sm:text-[13px] text-[#3d2b1f] leading-relaxed font-medium select-text">
                        {parsedQA.hint}
                      </p>
                    </div>
                  )}

                  {/* 03. Password Input Form */}
                  <form onSubmit={handleUnlockGgai} className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Nhập câu trả lời hoặc mật khẩu..."
                        className="flex-1 px-4 py-3 bg-white border border-black/20 text-xs sm:text-sm text-[#18181A] font-serif placeholder:font-serif placeholder:italic placeholder:text-neutral-400 focus:outline-none focus:border-black rounded-xl shadow-inner"
                      />
                      <button
                        type="submit"
                        className="px-7 py-3 bg-[#18181A] hover:bg-black text-white text-xs font-serif font-bold tracking-[0.18em] uppercase rounded-xl transition-all shadow-md shrink-0 active:scale-95"
                      >
                        Mở khóa Link
                      </button>
                    </div>

                    {passwordError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-serif text-rose-800 font-medium flex items-center gap-2 text-left">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Mật khẩu chưa chính xác. Bạn hãy đối chiếu lại gợi ý bên trên nhé.</span>
                      </div>
                    )}
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 05: ĐỂ LẠI BÌNH LUẬN CHO CHARACTER
      ===================================================================== */}
      <section
        id="comments-section"
        className="w-full bg-[#FAF9F6] pt-16 sm:pt-24 pb-32 sm:pb-36 px-4 sm:px-8"
      >
        <div className="max-w-[780px] mx-auto">
          <div className="pb-6 border-b border-black/15 flex items-end justify-between">
            <div>
              <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-500 block mb-1">
                05 // LƯU BÚT ĐỘC GIẢ
              </span>
              <h2 className="font-editorial italic text-3xl sm:text-4xl text-[#161618]">
                Để lại Bình luận cho {character.name}
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-serif">
              {comments.length} bình luận
            </span>
          </div>

          {/* Comment Submission Form */}
          <form
            onSubmit={handlePostComment}
            className="mt-8 p-6 sm:p-8 bg-white border border-black/10 shadow-sm space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.16em] uppercase text-neutral-500 mb-1.5">
                  Tên / Bút danh của bạn
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-black/15 text-xs text-[#161618] focus:outline-none focus:border-black"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] tracking-[0.16em] uppercase text-neutral-500 mb-1.5">
                  Lời nhắn gửi tới {character.name}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Viết cảm nhận hoặc lời nhắn của bạn..."
                    className="flex-1 px-3.5 py-2.5 bg-[#FAF9F6] border border-black/15 text-xs text-[#161618] focus:outline-none focus:border-black"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="px-6 py-2.5 bg-[#161618] hover:bg-neutral-800 text-white text-[11px] font-semibold tracking-[0.16em] uppercase flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="mt-8 space-y-4">
            {comments.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-black/15 bg-white/50">
                <p className="text-xs text-neutral-500 font-serif italic">
                  Chưa có bình luận nào cho {character.name}. Hãy là người đầu tiên để lại dấu ấn.
                </p>
              </div>
            ) : (
              comments.map((c) => {
                const isReplying = activeReplyId === c.id;
                const currentDraft = replyTextMap[c.id] !== undefined ? replyTextMap[c.id] : (c.adminReply || '');

                return (
                  <div
                    key={c.id}
                    className="p-5 sm:p-6 bg-white border border-black/[0.08] flex flex-col gap-4 shadow-sm transition-all hover:border-black/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-semibold text-[#161618]">
                            {c.authorName}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-neutral-800 leading-relaxed font-serif break-words">
                          {c.content}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isReplying) {
                                setActiveReplyId(null);
                              } else {
                                setActiveReplyId(c.id);
                                if (replyTextMap[c.id] === undefined) {
                                  setReplyTextMap((prev) => ({ ...prev, [c.id]: c.adminReply || '' }));
                                }
                              }
                            }}
                            className={`p-1.5 transition-colors cursor-pointer rounded ${
                              isReplying || c.adminReply
                                ? 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                                : 'text-neutral-400 hover:text-[#161618] hover:bg-neutral-100'
                            }`}
                            title={c.adminReply ? 'Chỉnh sửa câu trả lời của Creator Táo' : 'Creator Táo trả lời bình luận này'}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setComments((prev) => prev.filter((item) => item.id !== c.id));
                              await deleteComment(c.id, character.id);
                              setSaveStatus('✓ Đã xóa bình luận thành công.');
                              setTimeout(() => setSaveStatus(''), 2500);
                            }}
                            className="text-neutral-400 hover:text-red-600 p-1.5 shrink-0 transition-colors cursor-pointer hover:bg-red-50 rounded"
                            title="Xóa bình luận"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Display existing Creator Táo reply */}
                    {c.adminReply && !isReplying && (
                      <div className="ml-3 sm:ml-6 mt-1 p-3.5 sm:p-4 bg-[#FAF9F6] border-l-2 border-amber-900/60 rounded-r border border-t-0 border-r-0 border-b-0 space-y-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-amber-900" />
                            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-950 font-sans flex items-center gap-1">
                              <span>Creator Táo</span>
                              <span className="inline-block px-1.5 py-0.2 text-[9px] bg-amber-950 text-[#fbfaf8] font-mono tracking-normal uppercase rounded-xs">
                                Tác giả
                              </span>
                            </span>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyId(c.id);
                                setReplyTextMap((prev) => ({ ...prev, [c.id]: c.adminReply || '' }));
                              }}
                              className="text-[10px] text-neutral-400 hover:text-neutral-900 underline underline-offset-2 transition-colors cursor-pointer"
                            >
                              Sửa phản hồi
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-neutral-800 leading-relaxed font-serif pl-5 whitespace-pre-wrap">
                          {c.adminReply}
                        </p>
                      </div>
                    )}

                    {/* Admin Reply Form Modal / Inline Box */}
                    {isAdmin && isReplying && (
                      <div className="ml-2 sm:ml-6 mt-2 p-3.5 sm:p-4 bg-amber-50/50 border border-amber-200/80 rounded space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold tracking-wide text-amber-950 flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-amber-900" />
                            <span>Creator Táo trả lời độc giả {c.authorName}:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="text-neutral-400 hover:text-neutral-700 p-1"
                            title="Đóng khung trả lời"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={currentDraft}
                          onChange={(e) =>
                            setReplyTextMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          placeholder={`Nhập câu trả lời hoặc giải đáp thắc mắc cho ${c.authorName}...`}
                          className="w-full px-3 py-2 bg-white border border-amber-200 text-xs text-neutral-900 focus:outline-none focus:border-amber-900 rounded-sm font-serif leading-relaxed"
                        />
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {c.adminReply ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTextMap((prev) => ({ ...prev, [c.id]: '' }));
                                handleSaveReply(c.id);
                              }}
                              className="text-[10px] text-red-600 hover:underline cursor-pointer"
                            >
                              Xóa câu trả lời này
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic">
                              Độc giả sẽ thấy nhãn Creator Táo phản hồi
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReplyId(null)}
                              className="px-3 py-1.5 text-[10px] text-neutral-600 hover:bg-neutral-100 rounded cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={isSavingReply}
                              onClick={() => handleSaveReply(c.id)}
                              className="px-4 py-1.5 bg-[#161618] hover:bg-neutral-800 text-white text-[10px] font-semibold tracking-wider uppercase rounded cursor-pointer flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isSavingReply ? 'Đang lưu...' : 'Gửi phản hồi'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Bottom Back Button & Return Banner */}
      <div className="max-w-[780px] mx-auto px-4 sm:px-8 pt-10 pb-6 text-center">
        <button
          type="button"
          onClick={handleGoBack}
          className="group inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-xs font-medium tracking-wider uppercase transition-all shadow-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại nơi vừa xem hồ sơ</span>
        </button>
      </div>

      {/* Floating Save Status Toast Notification */}
      {saveStatus && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 transition-all animate-bounce-short border ${
            saveStatus.startsWith('✓')
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/40'
              : saveStatus.startsWith('✕')
              ? 'bg-rose-950 text-rose-200 border-rose-500/40'
              : 'bg-[#18181A] text-white border-white/20'
          }`}
        >
          {saveStatus.startsWith('✓') ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : saveStatus.startsWith('✕') ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          )}
          <span>{saveStatus}</span>
        </div>
      )}
    </div>
  );
};
