export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  objectPosition?: string;
  isVisible: boolean;
  order: number;
}

export interface CharacterProfileData {
  alias?: string;
  role: string;
  age?: string;
  birthday?: string;
  height?: string;
  weight?: string;
  gender?: string;
  school?: string;
  grade?: string;
  reputation?: string;
  affiliation?: string;
  weapon?: string;
  status: string;
  quote?: string;
  notes?: string;
  // Detailed Dossier Sections
  appearance?: string;
  personality?: string;
  hobbies?: string;
  dislikes?: string;
  allergies?: string;
  habits?: string[];
  specialNote?: string;
  family?: string;
  relationshipStatus?: string;
  relationshipWithUser?: string;
  about?: string;
  // Optional custom field labels per character so any genre can tailor headings
  aliasLabel?: string;
  ageLabel?: string;
  heightLabel?: string;
  affiliationLabel?: string;
  weaponLabel?: string;
  statusLabel?: string;
  roleLabel?: string;
}

export interface CharacterNPC {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarUrl?: string;
}

export interface Character {
  id: string;
  name: string; // e.g. "Ngụy Tứ Việt"
  slug?: string; // e.g. "nguy-tu-viet", "phan-quy-man"
  code: string; // e.g. "BA-01", "10-0"
  originalNovelTitle?: string; // e.g. "@NAM THÀNH VỊ VÃN"
  originalChineseName?: string; // e.g. "Wei Si Yue · 魏肆越"
  isPublished?: boolean;
  isUpcoming?: boolean; // Đánh dấu nhân vật sắp ra mắt
  upcomingReleaseNote?: string; // Ghi chú thời gian hoặc lời nhắn hé lộ
  tagline: string;
  genreIds: string[];
  avatarUrl: string;
  coverUrl: string;
  posterUrl: string;
  posterObjectPosition?: string;
  synopsis: string; // Văn án
  synopsisImageUrl?: string;
  isSynopsis18Plus?: boolean; // Chế độ khóa xác nhận 18+ cho Văn án
  synopsis18WarningNote?: string; // Ghi chú cảnh báo nội dung 18+ tùy chỉnh
  profileData: CharacterProfileData;
  npcs?: CharacterNPC[];
  gallery: GalleryImage[];
  roleplayLink?: string;
  isRoleplayLocked?: boolean;
  roleplayUnlockQuestion?: string;
  roleplayUnlockAnswer?: string;
  views: number;
  likes: number;
  roleplayClicks?: number;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Quote {
  id: string;
  content: string;
  author: string;
  characterName?: string;
  source?: string;
  order: number;
}

export interface Confession {
  id: string;
  sender: string;
  content: string;
  characterTarget?: string;
  approved: boolean;
  reply?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  characterId: string;
  authorName: string;
  content: string;
  createdAt: string;
  adminReply?: string;
  likes: number;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface CreatorProfile {
  penName: string;
  bio: string;
  quote: string;
  avatarUrl: string;
  coverUrl: string;
  introImageUrl?: string;
  donateQrUrl: string;
  facebookUrl: string;
  discordUrl: string;
  instagramUrl: string;
  email: string;
  supportText: string;
  socialLinks?: SocialLink[];
}

export interface WebsiteSettings {
  siteTitle: string;
  logoUrl?: string;
  faviconUrl?: string;
  bannerNotice?: string;
  customBgUrl?: string;
  footerText: string;
  hotCharacterId?: string;
  hotCharacterAwardTitle?: string;
  hotCharacterReason?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration?: string;
  isDefault: boolean;
  order: number;
  chunkCount?: number;
  mimeType?: string;
}

export type CommissionStatus = 'pending' | 'discussing' | 'writing' | 'completed' | 'cancelled';

export interface CommissionRequest {
  id: string;
  clientName: string;
  contactPlatform?: 'Discord' | 'Facebook';
  contactMethod: string;
  roughBrief: string;
  desiredTimeline: string;
  isUrgent?: boolean;
  // Legacy optional fields for backward compatibility
  characterName?: string;
  personalityTone?: string;
  status: CommissionStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommissionSettings {
  isOpen: boolean;
  statusBadgeText: string;
  announcementTitle: string;
  announcementContent: string;
}

export interface UpcomingSubscriber {
  id: string;
  characterId: string;
  characterName: string;
  email: string;
  readerName?: string;
  note?: string;
  createdAt: string;
}



