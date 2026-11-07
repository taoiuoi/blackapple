import { Character, Genre, Quote, CreatorProfile, WebsiteSettings, MusicTrack, CommissionSettings } from '../types';
import { ALL_CHARACTERS } from './characters';

export const INITIAL_GENRES: Genre[] = [];

export const INITIAL_CHARACTERS: Character[] = ALL_CHARACTERS;

export const INITIAL_QUOTES: Quote[] = [];

export const INITIAL_CREATOR_PROFILE: CreatorProfile = {
  penName: 'TAOIUOI',
  bio: 'Nhà sáng tạo độc lập, tác giả của tiểu thuyết và vũ trụ nhân vật BLACK APPLE. Tập trung vào việc xây dựng những câu chuyện có chiều sâu tâm lý, mỹ học noir đương đại, và những nhân vật phức tạp giàu cảm xúc.',
  quote: 'Nghệ thuật không chỉ để chiêm ngưỡng, nó là nơi trú ẩn cho những linh hồn đồng điệu giữa thế giới hỗn loạn.',
  avatarUrl: '/assets/aistudio/IMG_0423_f2e4f4d6.JPG',
  coverUrl: '/assets/aistudio/IMG_9890_e03c9d51.JPG',
  introImageUrl: '',
  donateQrUrl: '/assets/aistudio/IMG_0713_ed13a933.JPG',
  facebookUrl: 'https://facebook.com',
  discordUrl: 'https://discord.gg',
  instagramUrl: 'https://instagram.com',
  email: 'anhitoo8@gmail.com',
  supportText: 'Sự ủng hộ tinh thần và tài chính từ bạn giúp dự án BLACK APPLE tiếp tục ra mắt những chương truyện, hình minh họa chất lượng cao và phát triển thế giới nhân vật phong phú hơn.'
};

export const INITIAL_SETTINGS: WebsiteSettings = {
  siteTitle: 'BLACK APPLE',
  logoUrl: '',
  faviconUrl: '',
  bannerNotice: 'Chào mừng bạn đến với vũ trụ nhân vật BLACK APPLE.',
  footerText: '© 2026 BLACK APPLE. Mọi quyền tác phẩm và hồ sơ nhân vật được bảo lưu bởi TAOIUOI.',
  hotCharacterId: 'phan-quy-man',
  hotCharacterAwardTitle: 'NHÂN VẬT NỔI BẬT & ĐƯỢC QUAN TÂM NHẤT TUẦN',
  hotCharacterReason: 'Gây ấn tượng sâu sắc với phong thái công tử Vĩnh Long 1930, tính cách tự do bất kham và mối nhân duyên trắc trở.'
};

export const INITIAL_TRACKS: MusicTrack[] = [
  {
    id: 'track-yt-pZEMAZyeFiE',
    title: '𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 Instantly Hooked, Insanely Good Vibe 🎧 | Chill Hip-Hop R&B · chill · mood',
    artist: 'afteraw',
    audioUrl: 'https://youtu.be/pZEMAZyeFiE?si=PU7sgQwHg-gk5bz2',
    duration: '58:42',
    isDefault: true,
    order: -1
  },
  {
    id: 'track-yt-drill-mien',
    title: 'Drill Miên — 阿YueYue (Gaz Mix)',
    artist: 'Gaz Official',
    audioUrl: 'https://youtu.be/IyrjPo_6oVE?si=mWJUmudMJfHEglaj',
    duration: '03:24',
    isDefault: false,
    order: 1
  },
  {
    id: 'track-1',
    title: 'Nocturne in E-flat Major (Dark Editorial)',
    artist: 'BLACK APPLE Sound Archive',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '06:12',
    isDefault: false,
    order: 2
  },
  {
    id: 'track-2',
    title: 'La Luna Grisácea (Midnight Resonance)',
    artist: 'Malos Cantores',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '07:05',
    isDefault: false,
    order: 3
  }
];

export const INITIAL_COMMISSION_SETTINGS: CommissionSettings = {
  isOpen: true,
  statusBadgeText: 'Đang mở đăng ký slot',
  announcementTitle: 'Đăng ký Slot Commission Roleplay AI',
  announcementContent: 'Điền thông tin liên hệ, trình bày sơ lược về idea của bạn và thời gian mong muốn hoàn thành. Sau khi nhận được form, Táo sẽ chủ động liên hệ qua Discord hoặc Facebook để trao đổi chi tiết và báo giá phù hợp.'
};

