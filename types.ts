

export enum Category {
  SAUDI = 'السعودية',
  UAE = 'الإمارات',
  QATAR = 'قطر',
  KUWAIT = 'الكويت',
  OMAN = 'عمان',
  BAHRAIN = 'البحرين',
  ENGLAND = 'الدوري الإنجليزي',
  SPAIN = 'الدوري الإسباني',
  ITALY = 'الدوري الإيطالي',
  GERMANY = 'الدوري الألماني',
  CHAMPIONS_LEAGUE = 'دوري أبطال أوروبا',
  ANALYSIS = 'تحليلات',
  VIDEO = 'فيديو',
  BREAKING = 'عاجل'
}

export interface FeatureFlags {
  matches: boolean;
  clubs: boolean;
  mercato: boolean;
  videos: boolean;
  analysis: boolean;
  autopilot: boolean;
}

export interface ApiConfig {
  provider: 'api-football' | 'sportmonks' | 'other';
  leagueIds: string; // Comma separated IDs
  autoSync: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  keys: {
    matches: string;      // مفتاح جدول المباريات
    results: string;      // مفتاح النتائج المباشرة
    playersData: string;  // مفتاح تفاصيل اللاعبين (طاقات، صور)
    scouting: string;     // مفتاح البحث وجلب اللاعبين (للميركاتو)
    gemini: string;       // مفتاح الذكاء الاصطناعي (Gemini)
  };
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  joinDate: string;
  dreamSquad?: Record<number, any>;
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
}

export interface MatchEvent {
  time: string;
  team: 'HOME' | 'AWAY';
  type: 'GOAL' | 'YELLOW' | 'RED' | 'SUB';
  player: string;
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
  lineups: {
    home: string[];
    away: string[];
  };
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

export interface NavItem {
  label: string;
  path: string;
  category?: Category;
}

export interface PlayerStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | 'ST' | 'CB' | 'CM' | 'CDM' | 'CAM' | 'RW' | 'LW' | 'LB' | 'RB' | 'RM' | 'LM';
  rating: number;
  stats: PlayerStats;
  image?: string;
  nationality?: string;
  marketValue?: number;
}

export interface ClubProfile {
  id: string;
  name: string;
  englishName: string;
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
}