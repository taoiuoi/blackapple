import { Character, Genre, Quote, CreatorProfile, WebsiteSettings, MusicTrack, CommissionSettings } from '../types';
import { ALL_CHARACTERS } from './characters';

export const INITIAL_GENRES: Genre[] = [
  {
    "description": "",
    "order": 1,
    "name": "Thanh xuân vườn trường",
    "id": "thanh-xuan-vuon-truong"
  },
  {
    "order": 2,
    "id": "viet-nam-xua",
    "description": "",
    "name": "Việt Nam xưa"
  },
  {
    "name": "Tra nam",
    "order": 3,
    "id": "tra-nam",
    "description": ""
  },
  {
    "name": "Hôn nhân sắp đặt",
    "description": "",
    "order": 4,
    "id": "hon-nhan-sap--at"
  },
  {
    "name": "Cưới trước yêu sau",
    "order": 5,
    "id": "cuoi-truoc-yeu-sau",
    "description": ""
  },
  {
    "id": "nguoc-tam",
    "description": "",
    "order": 6,
    "name": "Ngược tâm"
  },
  {
    "description": "",
    "id": "nsforw",
    "order": 7,
    "name": "NSforW"
  },
  {
    "description": "",
    "name": "Bắt nạt",
    "id": "bat-nat",
    "order": 9
  },
  {
    "description": "",
    "name": "Thanh xuân đại học",
    "id": "thanh-xuan-ai-hoc",
    "order": 10
  },
  {
    "id": "hai-huoc",
    "order": 11,
    "description": "",
    "name": "Hài hước"
  },
  {
    "description": "",
    "name": "Theo đuổi User",
    "order": 12,
    "id": "theo-uoi-user"
  },
  {
    "name": "R18",
    "order": 13,
    "description": "",
    "id": "r18"
  },
  {
    "name": "Sát thủ ngầm",
    "id": "sat-thu-ngam",
    "order": 13,
    "description": ""
  },
  {
    "description": "",
    "id": "noi-gian",
    "order": 14,
    "name": "Nội gián"
  },
  {
    "name": "Plot ẩn",
    "id": "plot-an",
    "description": "",
    "order": 15
  },
  {
    "id": "nguoi-yeu-cu",
    "description": "",
    "order": 16,
    "name": "Người yêu cũ"
  },
  {
    "order": 17,
    "id": "guong-vo-lai-lanh",
    "description": "",
    "name": "Gương vỡ lại lành"
  },
  {
    "name": "Trùm trường",
    "order": 18,
    "id": "trum-truong",
    "description": ""
  },
  {
    "id": "noi-loan",
    "name": "Nổi loạn",
    "order": 19,
    "description": ""
  },
  {
    "id": "r21",
    "order": 20,
    "description": "",
    "name": "R21"
  },
  {
    "id": "bdsm",
    "order": 21,
    "name": "BDSM",
    "description": ""
  },
  {
    "id": "co-trang",
    "description": "",
    "name": "Cổ trang",
    "order": 22
  },
  {
    "description": "",
    "name": "Có thai",
    "id": "co-thai",
    "order": 23
  },
  {
    "order": 24,
    "description": "",
    "id": "cuong-ep",
    "name": "Cưỡng ép"
  },
  {
    "id": "thao-tung-tam-ly",
    "order": 25,
    "description": "",
    "name": "Thao túng tâm lý"
  },
  {
    "id": "hanh-ha-the-xac-lan-tinh-than",
    "order": 26,
    "description": "",
    "name": "Hành hạ thể xác lẫn tinh thần"
  },
  {
    "name": "Tình dục cưỡng bức",
    "order": 27,
    "id": "tinh-duc-cuong-buc",
    "description": ""
  },
  {
    "name": "Ngược",
    "id": "nguoc",
    "description": "",
    "order": 28
  },
  {
    "name": "User câm",
    "id": "user-cam",
    "description": "",
    "order": 29
  },
  {
    "description": "",
    "order": 30,
    "name": "Văn nhã bại hoại",
    "id": "van-nha-bai-hoai"
  },
  {
    "description": "",
    "order": 31,
    "name": "Ngụy tỷ đệ",
    "id": "nguy-ty-de"
  },
  {
    "description": "",
    "order": 32,
    "name": "Niên hạ",
    "id": "nien-ha"
  },
  {
    "description": "",
    "order": 33,
    "name": "Chiếm hữu bệnh hoạn",
    "id": "chiem-huu-benh-hoan"
  },
  {
    "description": "",
    "order": 34,
    "name": "Mèo vờn chuột",
    "id": "meo-von-chuot"
  },
  {
    "description": "",
    "order": 35,
    "name": "Tâm lý vặn vẹo",
    "id": "tam-ly-van-veo"
  }
];

export const INITIAL_CHARACTERS: Character[] = ALL_CHARACTERS;

export const INITIAL_QUOTES: Quote[] = [];

export const INITIAL_CREATOR_PROFILE: CreatorProfile = {
  penName: "táo",
  bio: "[about me.] ⡞⠳⣄⣀⣠⠞⢷ ֹ۪\n\n𐔌⟡ ݁₊ . nhăm nhăm! tìnhiu ơi, tớ là táo. một quả táo bình thường với niềm đam mê bất thường dành cho những con người không có thật. ᡣ𐭩\n\n𐔌⟡ ݁₊ . sở thích của tớ là nghĩ ra vài ba câu chuyện, nặn thêm vài ba anh người yêu ảo rồi đem lên đây dụ các cậu yêu đương. còn yêu xong có đau khổ hay không thì… tớ hông biết đâu nha. (˶˃ ᵕ ˂˶)\n\n𐔌⟡ ݁₊ . mỗi nhân vật ra lò đều được tớ chăm chuốc cho nên thời gian ra link sẽ lâu một chút, nhưng mà các tìnhiu nhỏ cứ yên tâm là được 4-50% là tớ đăng plot rồi. không đợi lâu đâu màaaa!\n\n𐔌⟡ ݁₊ . chiếc ổ nhỏ của tớ nằm trên 𝑮𝑮𝑨𝑰. lâu lâu táo chín cây rụng ra một anh người yêu mới, nhớ ghé nhặt nha. 🍎\n\n𐔌⟡ ݁₊ . thể loại chủ yếu: hông có! tớ thích gì thì trồng đó. hôm nay thanh xuân vườn trường, ngày mai cổ trang, ngày kia mafia hay yakuza, hôm sau nữa có khi là hệ thống xuyên không, hôm nữa nữa thì lại ngôn tình ba xu cẩu huýt. nói chung cái vựa táo này hơi thập cẩm.\n\n𐔌⟡ ݁₊ . tớ thích đọc những chiếc feedback xinh xinh lắm! nếu các cậu có góp ý về nhân vật, plot hay trải nghiệm chơi thì cứ thủ thỉ với tớ nhé. táo luôn sẵn lòng lắng nghe. ♡\n\n𐔌⟡ ݁₊ . nếu các cậu yêu quý táo và những quả táo bé xinh ở đây, có thể gửi tặng tớ một chút vitamin nha! không bắt buộc đâu, chỉ cần các cậu ghé chơi và vui vẻ là tớ đã hạnh phúc lắm rồi. 🍎♡\n\n𐔌⟡ ݁₊ . cuối cùng, cảm ơn các cậu vì đã ghé qua vườn táo bé xíu này. mong rằng sẽ có ít nhất một người không có thật ở đây khiến các cậu thật lòng rung động.\n\n𐔌⟡ ݁₊ . chúc các cậu chơi vui, yêu vui, chia tay cũng vui. còn nếu lỡ yêu nhân vật của tớ quá thì… xin chia buồn, tớ cũng vậy đó ૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა",
  quote: "Nghệ thuật không chỉ để chiêm ngưỡng, nó là nơi trú ẩn cho những linh hồn đồng điệu giữa thế giới hỗn loạn.",
  avatarUrl: "/assets/aistudio/IMG_0423_f2e4f4d6.JPG",
  coverUrl: "/assets/aistudio/IMG_9890_e03c9d51.JPG",
  introImageUrl: "",
  donateQrUrl: "/assets/aistudio/IMG_0713_ed13a933.JPG",
  facebookUrl: "https://www.facebook.com/share/19djCHX2JN/?mibextid=wwXIfr",
  discordUrl: "",
  instagramUrl: "",
  email: "",
  supportText: "Sự ủng hộ của tìnhiu nhỏ là tinh thần lớn nhất của em táo. em táo. xin cảm ơn rất nhèo."
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

