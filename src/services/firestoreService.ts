import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  increment
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { isSampleBuildImage } from '../components/common/ImageWithFallback';
import { slugifyVietnamese } from '../utils/slugify';
import {
  Character,
  CharacterNPC,
  CharacterProfileData,
  Genre,
  Quote,
  Confession,
  Comment,
  CreatorProfile,
  WebsiteSettings,
  MusicTrack,
  GalleryImage,
  CommissionRequest,
  CommissionSettings,
  CommissionStatus
} from '../types';
import {
  INITIAL_CHARACTERS,
  INITIAL_GENRES,
  INITIAL_QUOTES,
  INITIAL_CREATOR_PROFILE,
  INITIAL_SETTINGS,
  INITIAL_TRACKS,
  INITIAL_COMMISSION_SETTINGS
} from '../data/initialData';

// Track if initial seed/migration was checked
let isInitialized = false;

export const CANONICAL_CHAR_IDS = new Set([
  'nguy-tu-viet',
  'gian-di-ninh',
  'chu-lac-thien',
  'luc-tu-hien',
  'phan-quy-man',
  'dong-ky'
]);

const LEGACY_SAMPLE_CHAR_IDS = new Set([
  'klaus-voheis',
  'gregor-cuervo',
  'char-1',
  'char-2',
  'char-3'
]);

const LEGACY_SAMPLE_GENRE_IDS = new Set([
  'dark-fantasy',
  'psychological-noir',
  'cyber-gothic',
  'tragic-romance'
]);

const LEGACY_SAMPLE_QUOTE_IDS = new Set(['q-1', 'q-2', 'q-3']);

const LEGACY_SAMPLE_STRINGS = new Set([
  'Bạch Hắc Vương',
  'Người thừa kế kín tiếng của tập đoàn Ngụy thị tại Nam Thành',
  'Trùm trường trung học Nam Thành / Tập đoàn Ngụy thị',
  'Chiếc bật lửa bạc & Khuyên tai đá đen',
  'Đang hoạt động bí mật',
  'Đằng sau vẻ ngoài lịch duyệt và chiếc kính gọng mảnh là một kẻ cầm cờ tàn nhẫn, kiên định.',
  'Ba năm trước, cuộc gặp gỡ định mệnh diễn ra ở thành phố nào?',
  'Hồ sơ nhân vật đang được cập nhật.'
]);

const GENERIC_DEFAULT_LABELS = new Set([
  'Danh tiếng / Biệt danh',
  'Tuổi / Giới tính',
  'Chiều cao / Cân nặng',
  'Trường học / Khối lớp',
  'Nghề nghiệp / Sở trường',
  'Tính cách / Khí chất',
  'Thân phận & Thể loại',
  'Biệt danh / Danh xưng',
  'Tuổi / Ngày sinh',
  'Chiều cao / Ngoại hình',
  'Xuất thân / Bối cảnh',
  'Đặc điểm / Sở thích'
]);

export function sanitizeImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || isSampleBuildImage(trimmed)) return '';
  return trimmed;
}

export function sanitizeGalleryList(gallery?: GalleryImage[]): GalleryImage[] {
  if (!Array.isArray(gallery)) return [];
  return gallery.filter((img) => {
    if (!img || !img.url) return false;
    if (isSampleBuildImage(img.url)) return false;
    if (img.id === 'img-1' || img.id === 'img-2' || img.id === 'img-3' || img.id === 'kv-1' || img.id === 'kv-2' || img.id === 'gc-1') {
      if (isSampleBuildImage(img.url)) return false;
    }
    return true;
  });
}

function cleanSampleText(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (LEGACY_SAMPLE_STRINGS.has(trimmed)) return '';
  if (trimmed.startsWith('Đêm Nam Thành mưa như trút nước')) return '';
  return val;
}

function pickNonEmpty(rawVal?: string, initVal?: string, fallback = ''): string {
  const cleanedRaw = cleanSampleText(rawVal);
  if (cleanedRaw && cleanedRaw.trim() !== '') return cleanedRaw;
  if (initVal && initVal.trim() !== '') return initVal;
  return fallback;
}

function pickLabel(rawLabel?: string, initLabel?: string, fallback = ''): string {
  if (rawLabel && rawLabel.trim() !== '' && !GENERIC_DEFAULT_LABELS.has(rawLabel.trim())) {
    return rawLabel;
  }
  if (initLabel && initLabel.trim() !== '') return initLabel;
  return fallback;
}

// Helper to guarantee every Character object has clean fields without injecting fake/sample info
export function normalizeCharacter(raw: Record<string, any>, id: string): Character {
  const initialTemplate = INITIAL_CHARACTERS.find((c) => c.id === id);
  const rawProfile = raw?.profileData || {};

  const isLegacySampleDoc =
    rawProfile.alias === 'Bạch Hắc Vương' ||
    raw?.originalNovelTitle === '@NAM THÀNH VỊ VÃN' ||
    (typeof raw?.synopsis === 'string' && raw.synopsis.startsWith('Đêm Nam Thành mưa như trút nước'));

  const initProfile = initialTemplate?.profileData || ({} as any);

  const nameLower = String(raw?.name || initialTemplate?.name || '').toLowerCase();
  const slugCandidate = raw?.slug || (nameLower ? slugifyVietnamese(nameLower) : id);
  const combinedContext = `${rawProfile.alias || ''} ${rawProfile.role || ''} ${rawProfile.affiliation || ''} ${rawProfile.weapon || ''}`.toLowerCase();

  // Detect Đông Kỷ or ancient/royal (Cổ trang / Hoàng cung) characters to assign fitting classical titles
  const isAncientOrDongKy =
    id === 'dong-ky' ||
    slugCandidate === 'dong-ky' ||
    nameLower.includes('đông kỷ') ||
    combinedContext.includes('hoàng tộc') ||
    combinedContext.includes('đông cung') ||
    combinedContext.includes('thái tử') ||
    combinedContext.includes('cổ trang');

  const defaultProfileData: CharacterProfileData = {
    role: isLegacySampleDoc ? (initProfile.role || '') : pickNonEmpty(rawProfile.role, initProfile.role),
    alias: isLegacySampleDoc ? (initProfile.alias || '') : pickNonEmpty(rawProfile.alias, initProfile.alias),
    age: isLegacySampleDoc ? (initProfile.age || '') : pickNonEmpty(rawProfile.age, initProfile.age),
    gender: pickNonEmpty(rawProfile.gender, initProfile.gender),
    birthday: isLegacySampleDoc ? (initProfile.birthday || '') : pickNonEmpty(rawProfile.birthday, initProfile.birthday),
    height: isLegacySampleDoc ? (initProfile.height || '') : pickNonEmpty(rawProfile.height, initProfile.height),
    weight: pickNonEmpty(rawProfile.weight, initProfile.weight),
    school: pickNonEmpty(rawProfile.school, initProfile.school),
    grade: pickNonEmpty(rawProfile.grade, initProfile.grade),
    reputation: pickNonEmpty(rawProfile.reputation, initProfile.reputation),
    affiliation: isLegacySampleDoc ? (initProfile.affiliation || '') : pickNonEmpty(rawProfile.affiliation, initProfile.affiliation),
    weapon: isLegacySampleDoc ? (initProfile.weapon || '') : pickNonEmpty(rawProfile.weapon, initProfile.weapon),
    status: isLegacySampleDoc ? (initProfile.status || '') : pickNonEmpty(rawProfile.status, initProfile.status),
    quote: isLegacySampleDoc ? (initProfile.quote || '') : pickNonEmpty(rawProfile.quote, initProfile.quote),
    notes: isLegacySampleDoc ? (initProfile.notes || '') : pickNonEmpty(rawProfile.notes, initProfile.notes),
    appearance: pickNonEmpty(rawProfile.appearance, initProfile.appearance),
    personality: pickNonEmpty(rawProfile.personality, initProfile.personality),
    hobbies: pickNonEmpty(rawProfile.hobbies, initProfile.hobbies),
    dislikes: pickNonEmpty(rawProfile.dislikes, initProfile.dislikes),
    allergies: pickNonEmpty(rawProfile.allergies, initProfile.allergies),
    habits: Array.isArray(rawProfile.habits) && rawProfile.habits.length > 0 ? rawProfile.habits : (initProfile.habits || []),
    specialNote: pickNonEmpty(rawProfile.specialNote, initProfile.specialNote),
    family: pickNonEmpty(rawProfile.family, initProfile.family),
    relationshipStatus: pickNonEmpty(rawProfile.relationshipStatus, initProfile.relationshipStatus),
    relationshipWithUser: pickNonEmpty(rawProfile.relationshipWithUser, initProfile.relationshipWithUser),
    about: pickNonEmpty(rawProfile.about, initProfile.about),
    aliasLabel: pickLabel(
      rawProfile.aliasLabel,
      initProfile.aliasLabel,
      isAncientOrDongKy ? 'Tước vị / Danh xưng' : 'Biệt danh / Danh xưng'
    ),
    ageLabel: pickLabel(
      rawProfile.ageLabel,
      initProfile.ageLabel,
      isAncientOrDongKy ? 'Niên tuổi' : 'Tuổi / Ngày sinh'
    ),
    heightLabel: pickLabel(
      rawProfile.heightLabel,
      initProfile.heightLabel,
      isAncientOrDongKy ? 'Thân hình / Chiều cao' : 'Chiều cao / Ngoại hình'
    ),
    affiliationLabel: pickLabel(
      rawProfile.affiliationLabel,
      initProfile.affiliationLabel,
      isAncientOrDongKy ? 'Gia thế / Cung điện' : 'Xuất thân / Bối cảnh'
    ),
    weaponLabel: pickLabel(
      rawProfile.weaponLabel,
      initProfile.weaponLabel,
      isAncientOrDongKy ? 'Đặc trưng / Phục sức' : 'Đặc điểm / Sở thích'
    ),
    statusLabel: pickLabel(
      rawProfile.statusLabel,
      initProfile.statusLabel,
      isAncientOrDongKy ? 'Bản tính / Khí chất' : 'Tính cách / Khí chất'
    ),
    roleLabel: pickLabel(
      rawProfile.roleLabel,
      initProfile.roleLabel,
      isAncientOrDongKy ? 'Địa vị & Thể loại' : 'Thân phận & Thể loại'
    )
  };

  const avatarUrl = sanitizeImageUrl(raw?.avatarUrl);
  const coverUrl = sanitizeImageUrl(raw?.coverUrl);
  const posterUrl = sanitizeImageUrl(raw?.posterUrl);
  const synopsisImageUrl = sanitizeImageUrl(raw?.synopsisImageUrl);

  const rawNpcs = Array.isArray(raw?.npcs) ? raw.npcs : undefined;
  let cleanNpcs: CharacterNPC[] = [];
  if (rawNpcs !== undefined) {
    cleanNpcs = rawNpcs
      .filter(
        (n: any) =>
          n &&
          n.id !== 'npc-1' &&
          n.id !== 'npc-2' &&
          n.id !== 'npc-default-1' &&
          n.id !== 'npc-default-2' &&
          !(n.name === 'Thẩm Nghiễn' && n.role?.includes('Người giữ mật lệnh')) &&
          !(n.name === 'Lục Tư Hiền' && n.role?.includes('Đối thủ kiêm cộng sự ngầm'))
      )
      .map((n: any) => ({
        ...n,
        avatarUrl: ''
      }));
  } else if (Array.isArray(initialTemplate?.npcs)) {
    cleanNpcs = initialTemplate.npcs.map((n) => ({ ...n, avatarUrl: '' }));
  }

  const rawGenreIds = Array.isArray(raw?.genreIds) ? raw.genreIds : [];
  const cleanGenreIds = rawGenreIds.filter((gid: string) => !LEGACY_SAMPLE_GENRE_IDS.has(gid));

  const resolvedName =
    id === 'nguy-tu-viet'
      ? pickNonEmpty(raw?.name, initialTemplate?.name, 'Ngụy Tứ Việt')
      : pickNonEmpty(raw?.name, initialTemplate?.name, id);

  const cleanSlug = raw?.slug || (resolvedName ? slugifyVietnamese(resolvedName) : id);
  const effectiveId = id && !id.startsWith('char-') ? id : (cleanSlug || id);

  // When a canonical character template exists, it is the master source of truth for assets, synopses, and roleplay links
  if (initialTemplate) {
    return {
      ...initialTemplate,
      id: initialTemplate.id,
      slug: initialTemplate.slug || initialTemplate.id,
      name: initialTemplate.name,
      code: initialTemplate.code,
      originalNovelTitle: initialTemplate.originalNovelTitle,
      originalChineseName: initialTemplate.originalChineseName,
      tagline: initialTemplate.tagline,
      avatarUrl: initialTemplate.avatarUrl,
      coverUrl: initialTemplate.coverUrl,
      posterUrl: initialTemplate.posterUrl,
      synopsisImageUrl: initialTemplate.synopsisImageUrl,
      posterObjectPosition: initialTemplate.posterObjectPosition || '50% 25%',
      synopsis: initialTemplate.synopsis || (typeof raw?.synopsis === 'string' && !isLegacySampleDoc ? raw.synopsis : ''),
      isSynopsis18Plus: Boolean(initialTemplate.isSynopsis18Plus),
      synopsis18WarningNote: initialTemplate.synopsis18WarningNote || '',
      profileData: initialTemplate.profileData || defaultProfileData,
      npcs: (initialTemplate.npcs && initialTemplate.npcs.length > 0) ? initialTemplate.npcs : cleanNpcs,
      gallery: sanitizeGalleryList(raw?.gallery && raw.gallery.length > 0 ? raw.gallery : initialTemplate.gallery),
      genreIds: cleanGenreIds.length > 0 ? cleanGenreIds : (initialTemplate.genreIds || []),
      roleplayLink: initialTemplate.roleplayLink || pickNonEmpty(raw?.roleplayLink, ''),
      isRoleplayLocked: Boolean(initialTemplate.isRoleplayLocked),
      roleplayUnlockQuestion: initialTemplate.roleplayUnlockQuestion || '',
      roleplayUnlockAnswer: initialTemplate.roleplayUnlockAnswer || '',
      isPublished: true,
      views: typeof raw?.views === 'number' && !isLegacySampleDoc ? Math.max(raw.views, initialTemplate.views || 0) : (initialTemplate.views || 0),
      likes: typeof raw?.likes === 'number' && !isLegacySampleDoc ? Math.max(raw.likes, initialTemplate.likes || 0) : (initialTemplate.likes || 0),
      roleplayClicks: typeof raw?.roleplayClicks === 'number' && !isLegacySampleDoc ? Math.max(raw.roleplayClicks, initialTemplate.roleplayClicks || 0) : (initialTemplate.roleplayClicks || 0),
      featured: true,
      order: initialTemplate.order ?? 99,
      createdAt: initialTemplate.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || initialTemplate.updatedAt || new Date().toISOString()
    };
  }

  return {
    ...raw,
    id: effectiveId,
    slug: cleanSlug,
    name: resolvedName,
    code: pickNonEmpty(raw?.code, 'BA-01'),
    originalNovelTitle: pickNonEmpty(raw?.originalNovelTitle, ''),
    originalChineseName: pickNonEmpty(raw?.originalChineseName, ''),
    tagline: pickNonEmpty(raw?.tagline, ''),
    avatarUrl,
    coverUrl,
    posterUrl,
    synopsisImageUrl,
    posterObjectPosition: raw?.posterObjectPosition || '50% 25%',
    synopsis: typeof raw?.synopsis === 'string' && !isLegacySampleDoc ? raw.synopsis : '',
    isSynopsis18Plus: Boolean(raw?.isSynopsis18Plus),
    synopsis18WarningNote: typeof raw?.synopsis18WarningNote === 'string' ? raw.synopsis18WarningNote : '',
    profileData: defaultProfileData,
    npcs: cleanNpcs,
    gallery: sanitizeGalleryList(raw?.gallery),
    genreIds: cleanGenreIds,
    roleplayLink: pickNonEmpty(raw?.roleplayLink, ''),
    isRoleplayLocked: Boolean(raw?.isRoleplayLocked),
    roleplayUnlockQuestion: pickNonEmpty(raw?.roleplayUnlockQuestion, ''),
    roleplayUnlockAnswer: pickNonEmpty(raw?.roleplayUnlockAnswer, ''),
    isPublished: raw?.isPublished !== false,
    views: typeof raw?.views === 'number' && !isLegacySampleDoc ? raw.views : 0,
    likes: typeof raw?.likes === 'number' && !isLegacySampleDoc ? raw.likes : 0,
    roleplayClicks: typeof raw?.roleplayClicks === 'number' && !isLegacySampleDoc ? raw.roleplayClicks : 0,
    featured: raw?.featured ?? true,
    order: typeof raw?.order === 'number' ? raw.order : 99,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString()
  };
}

export function cleanLocalStorageSampleImages() {
  try {
    // Always purge any legacy full-character JSON snapshots (ba_char_data_*)
    // because they cached empty profileData strings (appearance: "", personality: "", etc.)
    // before the detailed dossiers (Sections 02-07 & NPCs) were added.
    const staleCharSnapshots: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('ba_char_data_')) {
        staleCharSnapshots.push(k);
      }
    }
    staleCharSnapshots.forEach((k) => localStorage.removeItem(k));

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ba_char_') || key.startsWith('ba_creator_'))) {
        const val = localStorage.getItem(key);
        if (val && isSampleBuildImage(val)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

// ---------------- LOCALSTORAGE SMART CACHE (MINIMIZE FIREBASE READS & 0ms FIRST PAINT) ----------------
export function getCachedFirestoreData<T>(key: string, maxAgeMs = 15 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { timestamp, data } = parsed;
    if (typeof timestamp === 'number' && Date.now() - timestamp < maxAgeMs) {
      return data as T;
    }
    return null;
  } catch (_) {
    return null;
  }
}

export function setCachedFirestoreData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data
      })
    );
  } catch (_) {}
}

export async function initializeDatabaseIfEmpty(forceAsAdmin = false) {
  cleanLocalStorageSampleImages();

  const currentUser = auth.currentUser;
  const isUserAdmin = forceAsAdmin || (currentUser && currentUser.email?.toLowerCase() === 'anhitoo8@gmail.com');
  if (!isUserAdmin) {
    return;
  }

  if (isInitialized) return;
  isInitialized = true;

  try {
    const settingRef = doc(db, 'settings', 'general');
    const settingSnap = await getDoc(settingRef);
    const settingData = settingSnap.exists() ? settingSnap.data() : null;
    const migrationV6Done = Boolean(settingData?.migrationV6Done);

    // 1. Clean up Characters & Seed any MISSING characters into Firestore
    const charSnap = await getDocs(collection(db, 'characters'));
    const existingMap = new Map<string, Record<string, any>>();
    charSnap.docs.forEach((d) => existingMap.set(d.id, d.data()));

    // Always delete legacy sample characters if present
    for (const sampleId of LEGACY_SAMPLE_CHAR_IDS) {
      if (existingMap.has(sampleId)) {
        try {
          await deleteDoc(doc(db, 'characters', sampleId));
          existingMap.delete(sampleId);
        } catch (_) {}
      }
    }

    // Only purge legacy sample build images if present
    for (const [docId, rawData] of existingMap.entries()) {
      const hadSampleImages =
        (rawData.avatarUrl && isSampleBuildImage(rawData.avatarUrl)) ||
        (rawData.coverUrl && isSampleBuildImage(rawData.coverUrl)) ||
        (rawData.posterUrl && isSampleBuildImage(rawData.posterUrl)) ||
        (rawData.synopsisImageUrl && isSampleBuildImage(rawData.synopsisImageUrl)) ||
        (Array.isArray(rawData.gallery) && rawData.gallery.some((g: any) => isSampleBuildImage(g?.url)));

      if (hadSampleImages) {
        const cleaned = normalizeCharacter(rawData, docId);
        await setDoc(doc(db, 'characters', docId), cleaned);
      }
    }

    // Ensure all 5 requested characters exist in Firestore ONLY IF MISSING
    // CRITICAL: If a document already exists in Firestore, NEVER overwrite it!
    // The user's edits in Firestore are permanent and authoritative.
    for (const templateChar of INITIAL_CHARACTERS) {
      const existing = existingMap.get(templateChar.id);
      if (!existing) {
        await setDoc(doc(db, 'characters', templateChar.id), templateChar);
      }
    }

    // 2. Clean up legacy sample genres so unrelated sample tags are gone
    const genreSnap = await getDocs(collection(db, 'genres'));
    for (const gDoc of genreSnap.docs) {
      if (LEGACY_SAMPLE_GENRE_IDS.has(gDoc.id)) {
        try {
          await deleteDoc(doc(db, 'genres', gDoc.id));
        } catch (_) {}
      }
    }

    // 3. Clean up legacy sample quotes
    if (!migrationV6Done) {
      const quoteSnap = await getDocs(collection(db, 'quotes'));
      for (const qDoc of quoteSnap.docs) {
        if (LEGACY_SAMPLE_QUOTE_IDS.has(qDoc.id)) {
          try {
            await deleteDoc(doc(db, 'quotes', qDoc.id));
          } catch (_) {}
        }
      }
    }

    // 4. Creator Profile: strip any sample build images while preserving user's real images/links
    const creatorRef = doc(db, 'creatorProfile', 'main');
    const creatorSnap = await getDoc(creatorRef);
    if (!creatorSnap.exists()) {
      await setDoc(creatorRef, INITIAL_CREATOR_PROFILE);
    } else {
      const cData = creatorSnap.data() as CreatorProfile;
      const cleanAvatar = sanitizeImageUrl(cData.avatarUrl);
      const cleanCover = sanitizeImageUrl(cData.coverUrl);
      const cleanIntro = sanitizeImageUrl(cData.introImageUrl);
      if (
        cleanAvatar !== (cData.avatarUrl || '') ||
        cleanCover !== (cData.coverUrl || '') ||
        cleanIntro !== (cData.introImageUrl || '')
      ) {
        await setDoc(
          creatorRef,
          {
            ...cData,
            avatarUrl: cleanAvatar,
            coverUrl: cleanCover,
            introImageUrl: cleanIntro
          },
          { merge: true }
        );
      }
    }

    // 5. Mark settings & migrationV6Done
    await setDoc(
      settingRef,
      {
        ...INITIAL_SETTINGS,
        ...(settingData || {}),
        migrationV6Done: true
      },
      { merge: true }
    );

    // 6. Check music tracks and ensure the user's requested tracks & valid streams exist
    const trackSnap = await getDocs(collection(db, 'musicTracks'));
    if (trackSnap.empty) {
      for (const track of INITIAL_TRACKS) {
        await setDoc(doc(db, 'musicTracks', track.id), track);
      }
    } else {
      const existingTracks = trackSnap.docs.map((d) => ({ ...d.data(), id: d.id } as MusicTrack));
      await setDoc(doc(db, 'musicTracks', INITIAL_TRACKS[0].id), INITIAL_TRACKS[0], { merge: true });

      const hasDrillMien = existingTracks.some(
        (t) => t.id === 'track-yt-drill-mien' || (t.audioUrl && t.audioUrl.includes('IyrjPo_6oVE'))
      );
      if (!hasDrillMien) {
        await setDoc(doc(db, 'musicTracks', INITIAL_TRACKS[1].id), INITIAL_TRACKS[1]);
      } else {
        const drillDoc = existingTracks.find((t) => t.id === 'track-yt-drill-mien');
        if (drillDoc && drillDoc.order === 0) {
          await setDoc(doc(db, 'musicTracks', 'track-yt-drill-mien'), { ...drillDoc, order: 1 }, { merge: true });
        }
      }

      for (const t of existingTracks) {
        if (t.audioUrl && t.audioUrl.includes('assets.mixkit.co')) {
          const replacement =
            t.id === 'track-1'
              ? INITIAL_TRACKS[2]
              : t.id === 'track-2'
              ? INITIAL_TRACKS[3]
              : null;
          if (replacement) {
            await setDoc(doc(db, 'musicTracks', t.id), replacement, { merge: true });
          } else {
            await deleteDoc(doc(db, 'musicTracks', t.id));
          }
        }
      }
    }
  } catch (error) {
    console.warn('Lỗi khi kiểm tra/khởi tạo dữ liệu ban đầu trên Firestore:', error);
  }
}

// ---------------- CHARACTERS ----------------
export async function getCharacters(): Promise<Character[]> {
  try {
    const snap = await getDocs(collection(db, 'characters'));
    if (snap.empty) {
      return INITIAL_CHARACTERS;
    }
    const map = new Map<string, Character>();
    INITIAL_CHARACTERS.forEach((c) => map.set(c.id, c));
    snap.docs.forEach((d) => {
      if (CANONICAL_CHAR_IDS.has(d.id)) {
        const charObj = normalizeCharacter(d.data(), d.id);
        map.set(charObj.id, charObj);
      }
    });
    const list = Array.from(map.values());
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    return list;
  } catch (error) {
    console.warn('Không thể tải characters từ Firestore (quota hoặc offline). Đang sử dụng dữ liệu tĩnh từ mã nguồn:', error);
    return INITIAL_CHARACTERS;
  }
}

export function subscribeCharacters(callback: (characters: Character[]) => void) {
  cleanLocalStorageSampleImages();

  // Instant 0ms cache-first delivery to eliminate loading delay
  const cached = getCachedFirestoreData<Character[]>('ba_cache_characters_v8');
  if (cached && Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  } else {
    callback(INITIAL_CHARACTERS);
  }

  try {
    const colRef = collection(db, 'characters');
    return onSnapshot(
      colRef,
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_CHARACTERS);
        } else {
          const map = new Map<string, Character>();
          // Seed all canon characters from code first so none are ever missing
          INITIAL_CHARACTERS.forEach((c) => map.set(c.id, c));

          snap.docs.forEach((d) => {
            if (CANONICAL_CHAR_IDS.has(d.id)) {
              const charObj = normalizeCharacter(d.data(), d.id);
              map.set(charObj.id, charObj);
            }
          });
          const list = Array.from(map.values());
          list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          // Persist to local cache so future visits/reloads require 0 reads
          setCachedFirestoreData('ba_cache_characters_v8', list);
          callback(list);
        }
      },
      (error) => {
        console.warn('Firestore subscription quota / network error, serving static characters:', error);
        callback(INITIAL_CHARACTERS);
      }
    );
  } catch (error) {
    console.warn('Firestore subscription init failed, using static characters:', error);
    callback(INITIAL_CHARACTERS);
    return () => {};
  }
}

export async function saveCharacter(character: Character): Promise<void> {
  const path = `characters/${character.id}`;
  const normalized = normalizeCharacter(character, character.id);
  try {
    localStorage.removeItem(`ba_char_data_${character.id}`);
  } catch (_) {}

  try {
    await setDoc(doc(db, 'characters', character.id), {
      ...normalized,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCharacter(characterId: string): Promise<void> {
  const path = `characters/${characterId}`;
  try {
    await deleteDoc(doc(db, 'characters', characterId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Direct image update for a character
export async function updateCharacterImageUrl(
  characterId: string,
  field: 'avatarUrl' | 'coverUrl' | 'posterUrl' | 'synopsisImageUrl',
  url: string,
  objectPosition?: string
): Promise<void> {
  const path = `characters/${characterId}`;
  try {
    const cleanUrl = sanitizeImageUrl(url);
    const docRef = doc(db, 'characters', characterId);
    const snap = await getDoc(docRef);

    const updatePayload: Record<string, any> = {
      [field]: cleanUrl,
      updatedAt: new Date().toISOString()
    };
    if (field === 'posterUrl' && objectPosition) {
      updatePayload.posterObjectPosition = objectPosition;
    }

    const baseData = snap.exists() ? snap.data() : {};
    const fullCharacter = normalizeCharacter({ ...baseData, ...updatePayload }, characterId);
    await setDoc(docRef, fullCharacter, { merge: true });

    try {
      if (cleanUrl) {
        localStorage.setItem(`ba_char_${characterId}_${field}`, cleanUrl);
      } else {
        localStorage.removeItem(`ba_char_${characterId}_${field}`);
      }
      if (field === 'posterUrl' && objectPosition) {
        localStorage.setItem(`ba_char_${characterId}_pos`, objectPosition);
      }
    } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Increment Character Views counter atomically in Firestore (Publicly callable)
export async function incrementCharacterViews(characterId: string): Promise<void> {
  try {
    const docRef = doc(db, 'characters', characterId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    // Non-fatal if offline or unseeded
    console.warn(`Could not increment views for character ${characterId}:`, error);
  }
}

// Increment Roleplay link clicks counter atomically in Firestore (Publicly callable)
export async function incrementRoleplayClicks(characterId: string): Promise<void> {
  try {
    const docRef = doc(db, 'characters', characterId);
    await updateDoc(docRef, {
      roleplayClicks: increment(1)
    });
  } catch (error) {
    console.warn(`Could not increment roleplay click for character ${characterId}:`, error);
  }
}

// ---------------- GENRES ----------------
export async function getGenres(): Promise<Genre[]> {
  try {
    const snap = await getDocs(collection(db, 'genres'));
    if (snap.empty) return [];
    const list = snap.docs
      .filter((d) => !LEGACY_SAMPLE_GENRE_IDS.has(d.id))
      .map((d) => ({ ...d.data(), id: d.id } as Genre));
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'genres');
    return INITIAL_GENRES;
  }
}

export function subscribeGenres(callback: (genres: Genre[]) => void) {
  try {
    return onSnapshot(
      collection(db, 'genres'),
      (snap) => {
        if (snap.empty) {
          callback([]);
        } else {
          const list = snap.docs
            .filter((d) => !LEGACY_SAMPLE_GENRE_IDS.has(d.id))
            .map((d) => ({ ...d.data(), id: d.id } as Genre));
          list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          callback(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'genres');
        callback(INITIAL_GENRES);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'genres');
    callback(INITIAL_GENRES);
    return () => {};
  }
}

export async function saveGenre(genre: Genre): Promise<void> {
  const path = `genres/${genre.id}`;
  try {
    await setDoc(doc(db, 'genres', genre.id), genre);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGenre(genreId: string): Promise<void> {
  const path = `genres/${genreId}`;
  try {
    await deleteDoc(doc(db, 'genres', genreId));
    // Also remove genreId from any characters referencing it
    try {
      const charSnap = await getDocs(collection(db, 'characters'));
      for (const cDoc of charSnap.docs) {
        const data = cDoc.data();
        if (Array.isArray(data.genreIds) && data.genreIds.includes(genreId)) {
          const nextGenreIds = data.genreIds.filter((id: string) => id !== genreId);
          await updateDoc(doc(db, 'characters', cDoc.id), { genreIds: nextGenreIds });
        }
      }
    } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- QUOTES ----------------
export async function getQuotes(): Promise<Quote[]> {
  try {
    const snap = await getDocs(collection(db, 'quotes'));
    if (snap.empty) return [];
    const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Quote));
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'quotes');
    return INITIAL_QUOTES;
  }
}

export function subscribeQuotes(callback: (quotes: Quote[]) => void) {
  try {
    return onSnapshot(
      collection(db, 'quotes'),
      (snap) => {
        if (snap.empty) {
          callback([]);
        } else {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Quote));
          list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          callback(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'quotes');
        callback(INITIAL_QUOTES);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'quotes');
    callback(INITIAL_QUOTES);
    return () => {};
  }
}

export async function saveQuote(quote: Quote): Promise<void> {
  const path = `quotes/${quote.id}`;
  try {
    await setDoc(doc(db, 'quotes', quote.id), quote);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuote(quoteId: string): Promise<void> {
  const path = `quotes/${quoteId}`;
  try {
    await deleteDoc(doc(db, 'quotes', quoteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- CREATOR PROFILE ----------------
export async function getCreatorProfile(): Promise<CreatorProfile> {
  try {
    const snap = await getDoc(doc(db, 'creatorProfile', 'main'));
    if (snap.exists()) {
      const data = snap.data() as CreatorProfile;
      return {
        ...INITIAL_CREATOR_PROFILE,
        ...data,
        avatarUrl: sanitizeImageUrl(data.avatarUrl),
        coverUrl: sanitizeImageUrl(data.coverUrl),
        introImageUrl: sanitizeImageUrl(data.introImageUrl)
      };
    }
    return INITIAL_CREATOR_PROFILE;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'creatorProfile/main');
    return INITIAL_CREATOR_PROFILE;
  }
}

export function subscribeCreatorProfile(callback: (profile: CreatorProfile) => void) {
  // Instant cache-first delivery
  const cached = getCachedFirestoreData<CreatorProfile>('ba_cache_creator_v3');
  if (cached) {
    callback(cached);
  }

  try {
    return onSnapshot(
      doc(db, 'creatorProfile', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CreatorProfile;
          const cleaned = {
            ...INITIAL_CREATOR_PROFILE,
            ...data,
            avatarUrl: sanitizeImageUrl(data.avatarUrl),
            coverUrl: sanitizeImageUrl(data.coverUrl),
            introImageUrl: sanitizeImageUrl(data.introImageUrl)
          };
          setCachedFirestoreData('ba_cache_creator_v3', cleaned);
          callback(cleaned);
        } else {
          callback(INITIAL_CREATOR_PROFILE);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'creatorProfile/main');
        callback(INITIAL_CREATOR_PROFILE);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'creatorProfile/main');
    callback(INITIAL_CREATOR_PROFILE);
    return () => {};
  }
}

export async function saveCreatorProfile(profile: CreatorProfile): Promise<void> {
  const path = 'creatorProfile/main';
  try {
    await setDoc(
      doc(db, 'creatorProfile', 'main'),
      {
        ...INITIAL_CREATOR_PROFILE,
        ...profile,
        avatarUrl: sanitizeImageUrl(profile.avatarUrl),
        coverUrl: sanitizeImageUrl(profile.coverUrl),
        introImageUrl: sanitizeImageUrl(profile.introImageUrl)
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- WEBSITE SETTINGS ----------------
export async function getSettings(): Promise<WebsiteSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      return { ...INITIAL_SETTINGS, ...(snap.data() as WebsiteSettings) };
    }
    return INITIAL_SETTINGS;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/general');
    return INITIAL_SETTINGS;
  }
}

export function subscribeSettings(callback: (settings: WebsiteSettings) => void) {
  // Instant cache-first delivery
  const cached = getCachedFirestoreData<WebsiteSettings>('ba_cache_settings_v3');
  if (cached) {
    callback(cached);
  }

  try {
    return onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          const merged = { ...INITIAL_SETTINGS, ...(snap.data() as WebsiteSettings) };
          setCachedFirestoreData('ba_cache_settings_v3', merged);
          callback(merged);
        } else {
          callback(INITIAL_SETTINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/general');
        callback(INITIAL_SETTINGS);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/general');
    callback(INITIAL_SETTINGS);
    return () => {};
  }
}

export async function saveSettings(settings: WebsiteSettings): Promise<void> {
  const path = 'settings/general';
  try {
    await setDoc(doc(db, 'settings', 'general'), { ...INITIAL_SETTINGS, ...settings }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Update Hot Character of the Week spotlight settings (Admin only)
export async function saveHotCharacterSpotlight(
  hotCharacterId: string,
  awardTitle?: string,
  reason?: string
): Promise<void> {
  const path = 'settings/general';
  try {
    await setDoc(
      doc(db, 'settings', 'general'),
      {
        hotCharacterId,
        ...(awardTitle !== undefined ? { hotCharacterAwardTitle: awardTitle } : {}),
        ...(reason !== undefined ? { hotCharacterReason: reason } : {})
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- MUSIC TRACKS & HYBRID AUDIO ENGINE ----------------

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
  ];
  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function normalizeAudioUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://docs.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  if (trimmed.includes('dropbox.com') && trimmed.includes('?dl=0')) {
    return trimmed.replace('?dl=0', '?raw=1');
  }
  return trimmed;
}

const KNOWN_YOUTUBE_METADATA: Record<string, { title: string; artist: string }> = {
  pZEMAZyeFiE: {
    title: '𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 Instantly Hooked, Insanely Good Vibe 🎧 | Chill Hip-Hop R&B · chill · mood',
    artist: 'afteraw'
  },
  IyrjPo_6oVE: {
    title: 'Drill Miên — 阿YueYue (Gaz Mix)',
    artist: 'Gaz Official'
  }
};

export async function fetchYouTubeMetadata(
  url: string
): Promise<{ title: string; artist: string } | null> {
  const ytId = extractYouTubeId(url);
  if (!ytId) return null;
  if (KNOWN_YOUTUBE_METADATA[ytId]) {
    return KNOWN_YOUTUBE_METADATA[ytId];
  }
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          title: data.title,
          artist: data.author_name || 'YouTube Audio'
        };
      }
    }
  } catch (_) {}
  return {
    title: `YouTube Soundtrack (${ytId})`,
    artist: 'YouTube Audio'
  };
}

const chunkedAudioBlobCache = new Map<string, string>();

export async function uploadMusicFileToFirestore(
  file: File,
  customTitle: string,
  customArtist: string,
  order: number,
  onProgress?: (percent: number) => void
): Promise<MusicTrack> {
  const trackId = `track-file-${Date.now()}`;
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không thể đọc file âm thanh từ thiết bị.'));
    reader.readAsDataURL(file);
  });

  const CHUNK_SIZE = 600000;
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const slice = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, 'musicTracks', trackId, 'chunks', `chunk-${i}`), {
      index: i,
      data: slice
    });
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  const blobUrl = URL.createObjectURL(file);
  chunkedAudioBlobCache.set(trackId, blobUrl);

  const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
  const track: MusicTrack = {
    id: trackId,
    title: customTitle.trim() || cleanFileName || 'Bản nhạc tải lên',
    artist: customArtist.trim() || 'BLACK APPLE Archive',
    audioUrl: `firestore-chunked://${trackId}`,
    duration: 'MP3 Audio',
    isDefault: false,
    order,
    chunkCount: totalChunks,
    mimeType: file.type || 'audio/mpeg'
  };

  await setDoc(doc(db, 'musicTracks', trackId), track);
  return track;
}

export async function resolvePlayableAudioUrl(track: MusicTrack): Promise<string> {
  if (!track || !track.audioUrl) return '';
  if (
    !track.audioUrl.startsWith('firestore-chunked://') &&
    (!track.chunkCount || track.chunkCount <= 0)
  ) {
    return normalizeAudioUrl(track.audioUrl);
  }

  const cached = chunkedAudioBlobCache.get(track.id);
  if (cached) return cached;

  try {
    const snap = await getDocs(collection(db, 'musicTracks', track.id, 'chunks'));
    if (snap.empty) return '';
    const chunks = snap.docs
      .map((d) => d.data() as { index: number; data: string })
      .sort((a, b) => a.index - b.index);
    const fullDataUrl = chunks.map((c) => c.data).join('');

    const res = await fetch(fullDataUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    chunkedAudioBlobCache.set(track.id, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn('Lỗi khi tải các phân đoạn MP3 từ Firestore:', err);
    return '';
  }
}

function normalizeMusicTrackList(rawTracks: MusicTrack[]): MusicTrack[] {
  const list = rawTracks.map((t) => {
    if (t.id === 'track-yt-pZEMAZyeFiE' || (t.audioUrl && t.audioUrl.includes('pZEMAZyeFiE'))) {
      return {
        ...t,
        title:
          !t.title || t.title.includes('듣는 순간')
            ? '𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 Instantly Hooked, Insanely Good Vibe 🎧 | Chill Hip-Hop R&B · chill · mood'
            : t.title,
        artist: !t.artist || t.artist === 'afteraw.' ? 'afteraw' : t.artist,
        order: typeof t.order === 'number' && t.order < 0 ? t.order : -1
      };
    }
    return t;
  });

  if (!list.some((t) => t.id === 'track-yt-pZEMAZyeFiE' || t.audioUrl?.includes('pZEMAZyeFiE'))) {
    list.unshift(INITIAL_TRACKS[0]);
  }

  list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return list;
}

export async function getMusicTracks(): Promise<MusicTrack[]> {
  try {
    const snap = await getDocs(collection(db, 'musicTracks'));
    if (snap.empty) return INITIAL_TRACKS;
    const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MusicTrack));
    return normalizeMusicTrackList(list);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'musicTracks');
    return INITIAL_TRACKS;
  }
}

export function subscribeMusicTracks(callback: (tracks: MusicTrack[]) => void) {
  // Instant cache-first delivery
  const cached = getCachedFirestoreData<MusicTrack[]>('ba_cache_tracks_v3');
  if (cached && Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }

  try {
    return onSnapshot(
      collection(db, 'musicTracks'),
      (snap) => {
        if (snap.empty) {
          callback(INITIAL_TRACKS);
        } else {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MusicTrack));
          const normalized = normalizeMusicTrackList(list);
          setCachedFirestoreData('ba_cache_tracks_v3', normalized);
          callback(normalized);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'musicTracks');
        callback(INITIAL_TRACKS);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'musicTracks');
    callback(INITIAL_TRACKS);
    return () => {};
  }
}

export async function saveMusicTrack(track: MusicTrack): Promise<void> {
  const path = `musicTracks/${track.id}`;
  try {
    await setDoc(doc(db, 'musicTracks', track.id), track);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMusicTrack(trackId: string): Promise<void> {
  const path = `musicTracks/${trackId}`;
  try {
    try {
      const chunkSnap = await getDocs(collection(db, 'musicTracks', trackId, 'chunks'));
      for (const d of chunkSnap.docs) {
        await deleteDoc(doc(db, 'musicTracks', trackId, 'chunks', d.id));
      }
    } catch (_) {}
    await deleteDoc(doc(db, 'musicTracks', trackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- CONFESSIONS ----------------
export function subscribeConfessions(callback: (confessions: Confession[]) => void) {
  try {
    const q = query(collection(db, 'confessions'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Confession));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'confessions');
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'confessions');
    callback([]);
    return () => {};
  }
}

export async function submitConfession(sender: string, content: string, characterTarget?: string): Promise<void> {
  const id = `confession-${Date.now()}`;
  const path = `confessions/${id}`;
  try {
    const item: Confession = {
      id,
      sender: sender.trim() || 'Độc giả ẩn danh',
      content: content.trim(),
      characterTarget: characterTarget || '',
      approved: false,
      reply: '',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'confessions', id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateConfession(id: string, updates: Partial<Confession>): Promise<void> {
  const path = `confessions/${id}`;
  try {
    await updateDoc(doc(db, 'confessions', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteConfession(id: string): Promise<void> {
  const path = `confessions/${id}`;
  try {
    await deleteDoc(doc(db, 'confessions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- COMMENTS ----------------
export function subscribeComments(characterId: string, callback: (comments: Comment[]) => void) {
  try {
    const q = query(collection(db, 'comments'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as Comment))
          .filter((c) => c.characterId === characterId);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'comments');
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'comments');
    callback([]);
    return () => {};
  }
}

export async function submitComment(characterId: string, authorName: string, content: string): Promise<void> {
  const id = `comm-${Date.now()}`;
  const path = `comments/${id}`;
  try {
    const item: Comment = {
      id,
      characterId,
      authorName: authorName.trim() || 'Người đọc vô danh',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0
    };
    await setDoc(doc(db, 'comments', id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function replyComment(commentId: string, adminReply: string): Promise<void> {
  const path = `comments/${commentId}`;
  try {
    await updateDoc(doc(db, 'comments', commentId), { adminReply });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const path = `comments/${commentId}`;
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- COMMISSIONS ----------------
export function subscribeCommissionRequests(callback: (requests: CommissionRequest[]) => void) {
  try {
    const q = query(collection(db, 'commissions'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as CommissionRequest));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'commissions');
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'commissions');
    return () => {};
  }
}

export async function submitCommissionRequest(data: Omit<CommissionRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = `comm-${Date.now()}`;
  const path = `commissions/${id}`;
  try {
    const item: CommissionRequest = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'commissions', id), item);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateCommissionStatus(id: string, status: CommissionStatus, adminNotes?: string): Promise<void> {
  const path = `commissions/${id}`;
  try {
    const payload: Partial<CommissionRequest> = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (adminNotes !== undefined) {
      payload.adminNotes = adminNotes;
    }
    await updateDoc(doc(db, 'commissions', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteCommissionRequest(id: string): Promise<void> {
  const path = `commissions/${id}`;
  try {
    await deleteDoc(doc(db, 'commissions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export function subscribeCommissionSettings(callback: (settings: CommissionSettings) => void) {
  try {
    const ref = doc(db, 'settings', 'commissions');
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          callback({
            ...INITIAL_COMMISSION_SETTINGS,
            ...snap.data()
          } as CommissionSettings);
        } else {
          callback(INITIAL_COMMISSION_SETTINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/commissions');
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/commissions');
    return () => {};
  }
}

export async function saveCommissionSettings(settings: CommissionSettings): Promise<void> {
  const path = 'settings/commissions';
  try {
    await setDoc(doc(db, 'settings', 'commissions'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

