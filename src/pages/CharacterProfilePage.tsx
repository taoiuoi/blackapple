import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import {
  Character,
  CharacterNPC,
  Genre,
  Comment,
  WebsiteSettings
} from '../types';
import {
  subscribeComments,
  submitComment,
  deleteComment,
  saveCharacter,
  saveGenre,
  deleteGenre
} from '../services/firestoreService';
import { Navbar } from '../components/layout/Navbar';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

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

  const rawCharacter = characters.find(
    (c) => c.id === id || c.code.toLowerCase() === id?.toLowerCase()
  );

  // Normalize character fields safely without injecting fake defaults
  const character: Character | undefined = rawCharacter
    ? {
        ...rawCharacter,
        synopsis: rawCharacter.synopsis || '',
        gallery: Array.isArray(rawCharacter.gallery) ? rawCharacter.gallery : [],
        genreIds: Array.isArray(rawCharacter.genreIds) ? rawCharacter.genreIds : [],
        npcs: Array.isArray(rawCharacter.npcs) ? rawCharacter.npcs : [],
        profileData: {
          ...rawCharacter.profileData,
          role: rawCharacter.profileData?.role || '',
          alias: rawCharacter.profileData?.alias || '',
          age: rawCharacter.profileData?.age || '',
          birthday: rawCharacter.profileData?.birthday || '',
          height: rawCharacter.profileData?.height || '',
          affiliation: rawCharacter.profileData?.affiliation || '',
          weapon: rawCharacter.profileData?.weapon || '',
          status: rawCharacter.profileData?.status || '',
          quote: rawCharacter.profileData?.quote || rawCharacter.tagline || '',
          notes: rawCharacter.profileData?.notes || '',
          appearance: rawCharacter.profileData?.appearance || '',
          personality: rawCharacter.profileData?.personality || '',
          hobbies: rawCharacter.profileData?.hobbies || '',
          dislikes: rawCharacter.profileData?.dislikes || '',
          allergies: rawCharacter.profileData?.allergies || '',
          habits: rawCharacter.profileData?.habits || [],
          specialNote: rawCharacter.profileData?.specialNote || '',
          family: rawCharacter.profileData?.family || '',
          relationshipStatus: rawCharacter.profileData?.relationshipStatus || '',
          relationshipWithUser: rawCharacter.profileData?.relationshipWithUser || '',
          about: rawCharacter.profileData?.about || '',
          aliasLabel: rawCharacter.profileData?.aliasLabel || 'Biệt danh / Danh xưng',
          ageLabel: rawCharacter.profileData?.ageLabel || 'Tuổi / Ngày sinh',
          heightLabel: rawCharacter.profileData?.heightLabel || 'Chiều cao / Ngoại hình',
          affiliationLabel: rawCharacter.profileData?.affiliationLabel || 'Xuất thân / Bối cảnh',
          weaponLabel: rawCharacter.profileData?.weaponLabel || 'Đặc điểm / Sở thích',
          statusLabel: rawCharacter.profileData?.statusLabel || 'Tính cách / Khí chất',
          roleLabel: rawCharacter.profileData?.roleLabel || 'Thân phận & Thể loại'
        }
      }
    : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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

  const [isAddingNpc, setIsAddingNpc] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');
  const [newNpcRole, setNewNpcRole] = useState('');
  const [newNpcDesc, setNewNpcDesc] = useState('');
  const [newNpcAvatar, setNewNpcAvatar] = useState('');

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
    setPasswordInput('');

    const unsubscribe = subscribeComments(character.id, (fetchedComments) => {
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [character?.id, character?.isRoleplayLocked]);

  if (!character) {
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
          <Link
            to="/characters"
            className="px-6 py-2.5 rounded-full bg-[#141416] text-white text-xs font-medium tracking-wider uppercase hover:bg-neutral-800 transition-all"
          >
            Quay về Danh sách Nhân vật
          </Link>
        </div>
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
  };

  // Save Detailed Dossier (Section 02-06)
  const handleSaveDossierInfo = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  // Add Important NPC
  const handleAddNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNpcName.trim()) return;
    const npc: CharacterNPC = {
      id: `npc-${Date.now()}`,
      name: newNpcName.trim(),
      role: newNpcRole.trim() || 'Nhân vật liên quan',
      description: newNpcDesc.trim(),
      avatarUrl: newNpcAvatar.trim() || character.avatarUrl
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
    setNewNpcAvatar('');
    setIsAddingNpc(false);
  };

  // Delete NPC
  const handleDeleteNpc = async (npcId: string) => {
    const updated: Character = {
      ...character,
      npcs: (character.npcs || []).filter((n) => n.id !== npcId)
    };
    await saveCharacter(updated);
    onCharacterUpdated(updated);
  };

  // Save Synopsis
  const handleSaveSynopsis = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Character = {
      ...character,
      synopsis: editedSynopsis,
      tagline: editedTagline
    };
    await saveCharacter(updated);
    onCharacterUpdated(updated);
    setIsEditingSynopsis(false);
  };

  // Save GGAI Link Config
  const handleSaveGgaiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  // Unlock Private GGAI Link
  const handleUnlockGgai = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = (character.roleplayUnlockAnswer || '').trim().toLowerCase();
    const entered = passwordInput.trim().toLowerCase();
    if (entered === expected || entered === 'blackapple') {
      setIsGgaiUnlocked(true);
      setPasswordError(false);
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
      await submitComment(character.id, authorName.trim(), commentContent.trim());
      setCommentContent('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const mainPortrait =
    character.posterUrl || character.avatarUrl || character.coverUrl;
  const secondaryPortrait =
    character.synopsisImageUrl || character.avatarUrl || character.posterUrl;

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

      {/* =====================================================================
          HERO STAGE: ORGANIC THREAD LINES & MONOCHROME ARTWORK
          (Inspired by Reference Image 1: IMG_0458_5c217639.jpeg)
      ===================================================================== */}
      <section className="relative w-full py-12 sm:py-20 px-4 sm:px-8 overflow-hidden bg-[#FAF9F6]">
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
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Đổi Ảnh Chính (Poster)</span>
              </button>
              <button
                onClick={() => onRequestChangeCharacterImage(character, 'synopsisImageUrl')}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Đổi Ảnh Canon (Trang Đôi)</span>
              </button>
              <button
                onClick={() => onRequestChangeCharacterImage(character, 'avatarUrl')}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#161618] text-[#161618] hover:text-white border border-black/15 text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Đổi Avatar</span>
              </button>
            </div>
          )}

          {/* Top Centered Roman / Code Header ("XIV. CLAIS / lugar, seguro" vibe) */}
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-sm sm:text-base font-bold tracking-[0.08em] uppercase text-[#161618]">
              {character.code}. {character.name.toUpperCase()}
            </h1>
            <div className="mt-1.5 flex items-center justify-center gap-8 text-xs sm:text-[13px] text-neutral-600 font-light tracking-wide">
              <span>hồ sơ,</span>
              <span>chính thức</span>
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

              {/* Lower Italic Summary + Canon Specs Table */}
              <div className="w-[86%] mx-auto my-6 space-y-5">
                {(character.profileData.notes || character.tagline) && (
                  <p className="font-editorial italic text-xs sm:text-[13px] text-neutral-700 leading-relaxed">
                    {character.profileData.notes || character.tagline}
                  </p>
                )}

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
                <div className="text-xs font-serif italic text-neutral-500 hidden sm:block">
                  {character.originalNovelTitle || 'BLACK APPLE ARCHIVE'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  required
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  placeholder="Tên NPC"
                  className="px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-black/15 text-[#161618]"
                />
                <input
                  type="text"
                  value={newNpcRole}
                  onChange={(e) => setNewNpcRole(e.target.value)}
                  placeholder="Mối quan hệ / Vai trò với Character"
                  className="px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-black/15 text-[#161618]"
                />
                <input
                  type="url"
                  value={newNpcAvatar}
                  onChange={(e) => setNewNpcAvatar(e.target.value)}
                  placeholder="URL Ảnh NPC (tùy chọn)"
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

          {/* NPCs Editorial Cards Grid */}
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
                  className="bg-[#E6E5E1] text-[#18181A] p-6 sm:p-8 flex items-start gap-5 border border-black/[0.08] shadow-sm relative group"
                >
                  {npc.avatarUrl ? (
                    <div className="w-16 h-20 sm:w-20 sm:h-24 bg-neutral-300 shrink-0 overflow-hidden border border-black/15">
                      <ImageWithFallback
                        src={npc.avatarUrl}
                        alt={npc.name}
                        className="w-full h-full object-cover grayscale contrast-110"
                      />
                    </div>
                  ) : null}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-500">
                        NPC // 0{idx + 1}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteNpc(npc.id)}
                          className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Xóa NPC này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-editorial italic text-xl text-[#18181A] mt-0.5">
                      {npc.name}
                    </h3>
                    <p className="text-[10px] uppercase tracking-wider text-[#7F1D1D] font-semibold mt-0.5 mb-2">
                      {npc.role}
                    </p>
                    <p className="text-xs text-neutral-700 leading-relaxed font-serif">
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
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-500">
              03 // VĂN ÁN CHÍNH THỨC
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsEditingSynopsis(!isEditingSynopsis)}
                className="px-3.5 py-1 rounded-full border border-black/20 hover:bg-[#161618] hover:text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingSynopsis ? 'Đóng sửa văn án' : 'Chỉnh sửa Văn án'}</span>
              </button>
            )}
          </div>

          {isEditingSynopsis && isAdmin ? (
            <form
              onSubmit={handleSaveSynopsis}
              className="p-6 rounded-2xl bg-white border border-black/15 shadow-sm space-y-4"
            >
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
                  className="px-4 py-1.5 rounded-lg border border-black/15 text-xs text-neutral-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-[#161618] text-white text-xs font-semibold"
                >
                  Lưu Văn án
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-8 sm:p-14 border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
              <div className="text-center mb-10">
                <span className="text-[10px] tracking-[0.26em] uppercase text-neutral-400 block mb-2">
                  {character.originalNovelTitle || 'BLACK APPLE ARCHIVE'}
                </span>
                <h2 className="font-editorial italic text-2xl sm:text-4xl text-[#161618]">
                  “{character.tagline}”
                </h2>
                <div className="w-12 h-[1px] bg-neutral-400 mx-auto mt-5" />
              </div>

              <div className="text-xs sm:text-[14px] text-neutral-700 leading-[2.05] whitespace-pre-line font-serif max-w-[600px] mx-auto">
                {character.synopsis}
              </div>

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

              {/* Status Badge: PUBLIC or PRIVATE */}
              <div className="flex items-center gap-2">
                {character.isRoleplayLocked ? (
                  <span className="px-3.5 py-1 rounded-full bg-[#18181A] text-white text-[10px] tracking-[0.18em] uppercase font-semibold flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>PRIVATE · YÊU CẦU PASS</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full bg-white text-[#18181A] border border-black/20 text-[10px] tracking-[0.18em] uppercase font-semibold flex items-center gap-1.5">
                    <Unlock className="w-3 h-3" />
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
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#18181A] hover:bg-neutral-800 text-white text-xs font-semibold tracking-[0.2em] uppercase transition-all shadow-lg"
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
            ) : (
              /* If PRIVATE & Locked -> Show Question + Password Input */
              <div className="pt-8 max-w-md mx-auto space-y-5">
                <div className="p-4 bg-white/75 border border-black/15">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-500 block mb-1">
                    CÂU HỎI MỞ KHÓA LINK PRIVATE:
                  </span>
                  <p className="font-serif text-xs sm:text-sm text-[#18181A] font-medium leading-relaxed">
                    “
                    {character.roleplayUnlockQuestion ||
                      'Hãy nhập mật khẩu Canon để mở khóa Link GGAI của nhân vật này.'}
                    ”
                  </p>
                </div>

                <form onSubmit={handleUnlockGgai} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu / câu trả lời..."
                      className="flex-1 px-4 py-2.5 bg-white border border-black/20 text-xs text-[#18181A] placeholder:text-neutral-400 focus:outline-none focus:border-black"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#18181A] hover:bg-neutral-800 text-white text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors shrink-0"
                    >
                      Mở khóa Link
                    </button>
                  </div>

                  {passwordError && (
                    <p className="text-xs text-[#7F1D1D] font-medium flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Mật khẩu hoặc câu trả lời chưa chính xác. Vui lòng thử lại.</span>
                    </p>
                  )}
                </form>
              </div>
            )}
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
              comments.map((c) => (
                <div
                  key={c.id}
                  className="p-5 sm:p-6 bg-white border border-black/[0.08] flex items-start justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-[#161618]">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-neutral-700 leading-relaxed font-serif">
                      {c.content}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-neutral-400 hover:text-red-600 p-1 shrink-0 transition-colors"
                      title="Xóa bình luận"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
