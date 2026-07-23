
export enum Category {
  SAUDI = 'السعودية',
  UAE = 'الإمارات',
  QATAR = 'قطر',
  KUWAIT = 'الكويت',
  OMAN = 'عمان',
  BAHRAIN = 'البحرين',
  EGYPT = 'مصر',
  ALGERIA = 'الجزائر',
  TUNISIA = 'تونس',
  MOROCCO = 'المغرب',
  JORDAN = 'الأردن',
  IRAQ = 'العراق',
  LEBANON = 'لبنان',
  LIBYA = 'ليبيا',
  SUDAN = 'السودان',
  YEMEN = 'اليمن',
  PALESTINE = 'فلسطين',
  ENGLAND = 'الدوري الإنجليزي',
  SPAIN = 'الدوري الإسباني',
  ITALY = 'الدوري الإيطالي',
  GERMANY = 'الدوري الألماني',
  CHAMPIONS_LEAGUE = 'دوري أبطال أوروبا',
  ARAB_CUP = 'كأس العرب',
  ANALYSIS = 'تحليلات',
  VIDEO = 'فيديو',
  BREAKING = 'عاجل'
}

export interface FeatureFlags {
  matches: boolean;
  clubs: boolean;
  videos: boolean;
  analysis: boolean;
  autopilot: boolean;
  userSystem: boolean;
}

export interface User {
  id: string; // This will be the Supabase auth user ID
  name: string;
  username: string;
  email: string;
  avatar?: string;
  joinDate: string;
  role: 'admin' | 'user';
  status?: 'active' | 'banned';
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string; // URL
  url: string; // Website URL
  active: boolean;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: Category;
  date: string;
  author: string;
  views: number;
  isBreaking?: boolean;
  videoEmbedId?: string;
  sources?: { title: string; uri: string }[];
}

export interface Match {
  id: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  scoreHome: number | null;
  scoreAway: number | null;
  time: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  league: string;
  country: Category;
  date?: string;   // ISO date, used for club fixtures list
  round?: string;  // e.g. "الجولة 36" or "نهائي"
  venue?: string;
  // Present only for matches imported from API-Football — used to link
  // each lineup player to a real, resolvable /player/af-{id}/af-{id} page.
  homeTeamApiId?: number;
  awayTeamApiId?: number;
}

export interface MatchEvent {
  time: string;
  team: 'HOME' | 'AWAY';
  type: 'GOAL' | 'YELLOW' | 'RED' | 'SUB';
  player: string;
}

export interface LineupPlayer {
  id: string;        // 'af-{apiPlayerId}' — same id scheme as everywhere else, always resolvable
  apiPlayerId: number;
  name: string;
  number: number | null;
  position: 'G' | 'D' | 'M' | 'F';
}

export interface TeamLineup {
  clubId: string; // 'af-{apiTeamId}'
  formation: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coachName: string | null;
}

export interface MatchDetails {
  stats: {
    possession: number;
    shotsHome: number;
    shotsAway: number;
    shotsOnTargetHome: number;
    shotsOnTargetAway: number;
    cornersHome: number;
    cornersAway: number;
  };
  // null until API-Football actually publishes lineups for this fixture
  // (typically ~40 minutes before kickoff) — the UI falls back to the
  // club's general squad list until then.
  lineups: {
    home: TeamLineup;
    away: TeamLineup;
  } | null;
  events: MatchEvent[];
  summary: string;
}

export interface Standing {
  rank: number;
  team: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  league: string;
}

export interface PlayerStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface PlayerSeasonStats {
    matches: number;
    goals: number;
    assists: number;
    rating: number; // Average rating
    minutes?: number;
    yellowCards?: number;
    redCards?: number;
    shots?: number;
    shotsOnTarget?: number;
    passAccuracy?: number; // percentage
    cleanSheets?: number;  // for goalkeepers
    saves?: number;        // for goalkeepers
    tackles?: number;      // for defenders
}

export interface Player {
  id: string;
  apiFootballId?: number; // Crucial for linking performance stats
  name: string;
  englishName?: string;
  age?: number;
  birthDate?: string;   // ISO date
  birthPlace?: string;
  heightCm?: number;
  weightKg?: number;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | 'ST' | 'CB' | 'CM' | 'CDM' | 'CAM' | 'RW' | 'LW' | 'LB' | 'RB' | 'RM' | 'LM';
  rating: number;
  stats: PlayerStats;
  image?: string;
  nationality?: string;
  marketValue?: number;
  seasonStats?: PlayerSeasonStats;
}

// A player slotted into a user's "Dream Squad" builder — same as
// Player, plus the club context needed to render/link it outside the
// club's own page (profile page shows players from many different
// clubs side by side).
export interface DreamSquadPlayer extends Player {
  clubId?: string;
  clubLogo?: string;
  clubName?: string;
}

export interface ClubProfile {
  id: string;
  name: string;
  englishName: string;
  apiFootballId?: number;
  logo: string;
  coverImage: string;
  founded: number;
  stadium: string;
  coach: string;
  nickname: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
  social: {
    twitter: string;
    instagram: string;
  };
  fanCount: number;
  squad: Player[];
  trophies: { name: string; count: number }[];
  country: Category;
  history?: string; // free-text club history, written by editors/admins
}

// Admin-configurable site settings and content types (SEO, feature
// flags, sponsors, ads, comments, etc.) — all backed by real Supabase
// tables, see supabase/schema.sql.
export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  metaKeywords: string; 
  ogImageUrl: string;
}

export type AdPlacement =
  | 'HOME_TOP'       // أعلى الرئيسية تحت الهيدر
  | 'SIDEBAR'        // الشريط الجانبي
  | 'IN_ARTICLE'     // داخل نص المقال
  | 'BETWEEN_CARDS'  // بين بطاقات الأخبار بالقوائم
  | 'MATCH_PAGE'     // صفحة المباراة
  | 'BEFORE_FOOTER'; // قبل نهاية الصفحة

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  HOME_TOP: 'أعلى الرئيسية',
  SIDEBAR: 'الشريط الجانبي',
  IN_ARTICLE: 'داخل المقال',
  BETWEEN_CARDS: 'بين بطاقات الأخبار',
  MATCH_PAGE: 'صفحة المباراة',
  BEFORE_FOOTER: 'قبل الفوتر',
};

export interface AdSlot {
  id: string;
  placement: AdPlacement;
  label: string;                 // اسم توضيحي يختاره الأدمن
  network: 'adsense' | 'direct' | 'other';
  code: string;                  // كود HTML/JS الخام من الشبكة أو الراعي
  enabled: boolean;
  pages: string[];               // 'all' أو 'home' | 'article' | 'match' | 'club' | 'player' | 'standings'
  startDate?: string | null;     // ISO date - للحملات المجدولة (رعاة مباشرون)
  endDate?: string | null;
  updatedAt?: string;
}

export interface AdsGlobalSettings {
  masterEnabled: boolean;   // مفتاح الإيقاف الطارئ لكل الإعلانات دفعة واحدة
  adsTxtContent: string;    // محتوى ملف ads.txt المطلوب لاعتماد AdSense
}

export interface Comment {
    id: string;
    user: string;
    avatar: string;
    time: string;
    text: string;
    likes: number;
    articleId: string;
    status: 'visible' | 'reported' | 'hidden';
    parentId?: string;
}
