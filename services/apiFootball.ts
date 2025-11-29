import { Match, Category, MatchDetails, Standing } from '../types';

// بيانات وهمية للمباريات
const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeam: 'الهلال',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg',
    awayTeam: 'النصر',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg',
    scoreHome: 2,
    scoreAway: 1,
    time: '75\'',
    status: 'LIVE',
    league: 'دوري روشن السعودي',
    country: Category.SAUDI
  },
  {
    id: 'm2',
    homeTeam: 'ليفربول',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    awayTeam: 'مانشستر سيتي',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    scoreHome: 0,
    scoreAway: 0,
    time: '22:00',
    status: 'UPCOMING',
    league: 'الدوري الإنجليزي',
    country: Category.ENGLAND
  },
  {
    id: 'm3',
    homeTeam: 'العين',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a3/Al_Ain_FC_Logo.png',
    awayTeam: 'الشارقة',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/en/2/2b/Sharjah_FC_logo.png',
    scoreHome: 3,
    scoreAway: 0,
    time: 'انتهت',
    status: 'FINISHED',
    league: 'الدوري الإماراتي',
    country: Category.UAE
  },
  {
    id: 'm4',
    homeTeam: 'ريال مدريد',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    awayTeam: 'برشلونة',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    scoreHome: 1,
    scoreAway: 1,
    time: '34\'',
    status: 'LIVE',
    league: 'الدوري الإسباني',
    country: Category.SPAIN
  }
];

// بيانات وهمية للترتيب
const MOCK_STANDINGS: Standing[] = [
  { rank: 1, team: 'الهلال', logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg', played: 20, won: 18, drawn: 2, lost: 0, gf: 55, ga: 10, gd: 45, points: 56, league: 'SAUDI' },
  { rank: 2, team: 'النصر', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg', played: 20, won: 15, drawn: 2, lost: 3, gf: 48, ga: 22, gd: 26, points: 47, league: 'SAUDI' },
  { rank: 3, team: 'الأهلي', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Al-Ahli_Saudi_FC_logo.svg', played: 20, won: 12, drawn: 4, lost: 4, gf: 40, ga: 20, gd: 20, points: 40, league: 'SAUDI' },
  { rank: 4, team: 'الاتحاد', logo: 'https://upload.wikimedia.org/wikipedia/en/0/06/Al_Ittihad_Club_Logo.png', played: 20, won: 10, drawn: 5, lost: 5, gf: 35, ga: 25, gd: 10, points: 35, league: 'SAUDI' },
  
  { rank: 1, team: 'مانشستر سيتي', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg', played: 25, won: 19, drawn: 3, lost: 3, gf: 60, ga: 22, gd: 38, points: 60, league: 'ENGLAND' },
  { rank: 2, team: 'ليفربول', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', played: 25, won: 18, drawn: 5, lost: 2, gf: 58, ga: 24, gd: 34, points: 59, league: 'ENGLAND' },
  { rank: 3, team: 'أرسنال', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', played: 25, won: 17, drawn: 4, lost: 4, gf: 55, ga: 20, gd: 35, points: 55, league: 'ENGLAND' },
];

export const fetchLiveMatches = async (apiKey: string, leagueIds: string): Promise<Match[]> => {
  // إرجاع البيانات الوهمية مباشرة دون اتصال
  return Promise.resolve(MOCK_MATCHES);
};

export const fetchFixtureDetails = async (apiKey: string, fixtureId: string): Promise<MatchDetails | null> => {
    // محاكاة تفاصيل مباراة ثابتة
    return Promise.resolve({
        stats: {
            possession: 60,
            shotsHome: 15,
            shotsAway: 8,
            shotsOnTargetHome: 7,
            shotsOnTargetAway: 3,
            cornersHome: 5,
            cornersAway: 2,
        },
        lineups: {
            home: ['بونو', 'سعود', 'كوليبالي', 'البليهي', 'الشهراني', 'نيفيز', 'سافيتش', 'ميشايل', 'مالكوم', 'سالم', 'ميتروفيتش'],
            away: ['أوسبينا', 'الغنطام', 'لابورت', 'العمري', 'تيليس', 'الخيبري', 'بروزوفيتش', 'أوتافيو', 'تاليسكا', 'ماني', 'رونالدو'],
        },
        events: [
            { time: '15\'', team: 'HOME', type: 'GOAL', player: 'ميتروفيتش' },
            { time: '42\'', team: 'AWAY', type: 'GOAL', player: 'رونالدو' },
            { time: '77\'', team: 'HOME', type: 'GOAL', player: 'سالم الدوسري' },
        ],
        summary: 'مباراة حماسية في قمة الجولة تشهد تبادل للهجمات وسيطرة نسبية لأصحاب الأرض.'
    });
};

export const fetchStandings = async (apiKey: string, leagueIds: string): Promise<Standing[]> => {
    return Promise.resolve(MOCK_STANDINGS);
};