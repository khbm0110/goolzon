

import { Article, Category, Match, Standing, ClubProfile } from './types';

// Moved from geminiService to share with Club Dashboard
export const SQUAD_LISTS: Record<string, string[]> = {
  'الهلال': ['بونو', 'سعود عبدالحميد', 'كوليبالي', 'البليهي', 'الشهراني', 'نيفيز', 'سافيتش', 'مالكوم', 'سالم الدوسري', 'ميتروفيتش', 'نيمار'],
  'النصر': ['بينتو', 'سلطان الغنام', 'لابورت', 'لاجامي', 'تيليس', 'بروزوفيتش', 'أوتافيو', 'تليسكا', 'ماني', 'رونالدو', 'غريب'],
  'الاتحاد': ['المععيوف', 'الشنقيطي', 'حجازي', 'كاديش', 'هوساوي', 'كانتي', 'فابينيو', 'رومارينيو', 'بنزيما', 'حمدالله', 'كورنادو'],
  'الأهلي': ['ميندي', 'مجراشي', 'ديميرال', 'هندي', 'بالعبيد', 'كيسيه', 'المجحد', 'محرز', 'فيرمينو', 'ماكسيمان', 'البريكان'],
  'العين': ['خالد عيسى', 'بندر', 'كوامي', 'الهاشمي', 'إيريك', 'بارك', 'يحيى', 'كاكو', 'رحيمي', 'لابا', 'بلاسيوس'],
  'السد': ['برشم', 'وعد', 'خوخي', 'سلمان', 'الهاجري', 'الهيدوس', 'أوريبي', 'عفيف', 'بلاتا', 'بونجاح', 'تاباتا'],
};

export const GULF_CLUBS = [
  // Saudi
  { name: 'الهلال', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg', id: 'hilal' },
  { name: 'النصر', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg', id: 'nassr' },
  { name: 'الاتحاد', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/0/06/Al_Ittihad_Club_Logo.png', id: 'ittihad' }, // PNG is often more reliable for Ittihad on wiki
  { name: 'الأهلي', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Al-Ahli_Saudi_FC_logo.svg', id: 'ahli' },
  { name: 'الشباب', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Al_Shabab_FC_Saudi_logo.svg', id: 'shabab' },
  
  // UAE
  { name: 'العين', country: Category.UAE, logo: 'https://upload.wikimedia.org/wikipedia/en/a/a3/Al_Ain_FC_Logo.png', id: 'ain' },
  { name: 'الوصل', country: Category.UAE, logo: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Al_Wasl_FC_logo.svg', id: 'wasl' },
  { name: 'الشارقة', country: Category.UAE, logo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Sharjah_FC_logo.svg', id: 'sharjah' },
  { name: 'الوحدة', country: Category.UAE, logo: 'https://upload.wikimedia.org/wikipedia/en/8/80/Al_Wahda_FC_logo.svg', id: 'wahda' },
  
  // Qatar
  { name: 'السد', country: Category.QATAR, logo: 'https://upload.wikimedia.org/wikipedia/en/8/86/Al-Sadd_SC_logo.svg', id: 'sadd' },
  { name: 'الدحيل', country: Category.QATAR, logo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/Al-Duhail_SC_logo.svg', id: 'duhail' },
  { name: 'الريان', country: Category.QATAR, logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/Al_Rayyan_SC_logo.svg', id: 'rayyan' },
  
  // Kuwait
  { name: 'الكويت', country: Category.KUWAIT, logo: 'https://upload.wikimedia.org/wikipedia/en/2/22/Kuwait_SC_logo.svg', id: 'kuwait' },
  { name: 'القادسية', country: Category.KUWAIT, logo: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Qadsia_SC_logo.svg', id: 'qadsia' },
  { name: 'العربي', country: Category.KUWAIT, logo: 'https://upload.wikimedia.org/wikipedia/en/1/1a/Al-Arabi_SC_Kuwait_logo.svg', id: 'arabi' },

  // Oman
  { name: 'السيب', country: Category.OMAN, logo: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Al-Seeb_Club_logo.svg', id: 'seeb' },
  { name: 'النهضة', country: Category.OMAN, logo: 'https://upload.wikimedia.org/wikipedia/ar/6/68/Al-Nahda_Club_Logo.png', id: 'nahda' },

  // Bahrain
  { name: 'المحرق', country: Category.BAHRAIN, logo: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Al-Muharraq_SC_logo.svg', id: 'muharraq' },
  { name: 'الرفاع', country: Category.BAHRAIN, logo: 'https://upload.wikimedia.org/wikipedia/en/8/87/Al-Riffa_SC_logo.svg', id: 'riffa' },
];

export const CLUB_DATABASE: Record<string, ClubProfile> = {
  'nassr': {
    id: 'nassr',
    name: 'النصر',
    englishName: 'Al-Nassr',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg',
    coverImage: 'https://images.unsplash.com/photo-1510563800743-aed236490d94?auto=format&fit=crop&q=80&w=1200', // Yellow stadium vibe
    founded: 1955,
    stadium: 'الأول بارك',
    coach: 'ستيفانو بيولي',
    nickname: 'العالمي',
    colors: { primary: '#FACC15', secondary: '#172554', text: '#000000' }, // Yellow & Dark Blue
    social: { twitter: '@AlNassrFC', instagram: '@alnassr' },
    fanCount: 3500240,
    country: Category.SAUDI,
    trophies: [{ name: 'الدوري السعودي', count: 9 }, { name: 'كأس الملك', count: 6 }, { name: 'كأس ولي العهد', count: 3 }],
    squad: [
      { id: 'cr7', name: 'كريستيانو رونالدو', number: 7, position: 'ST', rating: 86, nationality: 'https://flagcdn.com/w40/pt.png', stats: { pac: 77, sho: 88, pas: 75, dri: 80, def: 34, phy: 74 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cr7' },
      { id: 'tal', name: 'أندرسون تاليسكا', number: 94, position: 'FWD', rating: 82, nationality: 'https://flagcdn.com/w40/br.png', stats: { pac: 80, sho: 84, pas: 78, dri: 81, def: 45, phy: 72 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tal' },
      { id: 'man', name: 'ساديو ماني', number: 10, position: 'LW', rating: 84, nationality: 'https://flagcdn.com/w40/sn.png', stats: { pac: 85, sho: 83, pas: 79, dri: 86, def: 44, phy: 70 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mane' },
      { id: 'ota', name: 'أوتافيو', number: 25, position: 'MID', rating: 81, nationality: 'https://flagcdn.com/w40/pt.png', stats: { pac: 78, sho: 74, pas: 82, dri: 83, def: 65, phy: 71 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=otavio' },
      { id: 'bro', name: 'مارسيلو بروزوفيتش', number: 77, position: 'CM', rating: 83, nationality: 'https://flagcdn.com/w40/hr.png', stats: { pac: 68, sho: 71, pas: 84, dri: 79, def: 78, phy: 76 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brozo' },
      { id: 'lap', name: 'إيميريك لابورت', number: 27, position: 'CB', rating: 83, nationality: 'https://flagcdn.com/w40/es.png', stats: { pac: 62, sho: 50, pas: 72, dri: 68, def: 85, phy: 79 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laporte' },
    ]
  },
  'hilal': {
    id: 'hilal',
    name: 'الهلال',
    englishName: 'Al-Hilal',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg',
    coverImage: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200', // Blue vibe
    founded: 1957,
    stadium: 'المملكة أرينا',
    coach: 'جورجي جيسوس',
    nickname: 'الزعيم',
    colors: { primary: '#2563EB', secondary: '#ffffff', text: '#ffffff' }, // Blue & White
    social: { twitter: '@Alhilal_FC', instagram: '@alhilal' },
    fanCount: 4100500,
    country: Category.SAUDI,
    trophies: [{ name: 'الدوري السعودي', count: 18 }, { name: 'دوري أبطال آسيا', count: 4 }, { name: 'كأس الملك', count: 10 }],
    squad: [
      { id: 'ney', name: 'نيمار جونيور', number: 10, position: 'LW', rating: 89, nationality: 'https://flagcdn.com/w40/br.png', stats: { pac: 86, sho: 83, pas: 85, dri: 93, def: 37, phy: 61 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ney' },
      { id: 'mit', name: 'ألكسندر ميتروفيتش', number: 9, position: 'ST', rating: 84, nationality: 'https://flagcdn.com/w40/rs.png', stats: { pac: 68, sho: 86, pas: 69, dri: 74, def: 42, phy: 88 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mitro' },
      { id: 'sal', name: 'سالم الدوسري', number: 29, position: 'LW', rating: 79, nationality: 'https://flagcdn.com/w40/sa.png', stats: { pac: 86, sho: 76, pas: 75, dri: 82, def: 45, phy: 68 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=salem' },
      { id: 'nev', name: 'روبن نيفيز', number: 8, position: 'CM', rating: 83, nationality: 'https://flagcdn.com/w40/pt.png', stats: { pac: 60, sho: 75, pas: 86, dri: 78, def: 76, phy: 73 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neves' },
      { id: 'sav', name: 'سيرجي سافيتش', number: 22, position: 'CM', rating: 84, nationality: 'https://flagcdn.com/w40/rs.png', stats: { pac: 68, sho: 79, pas: 82, dri: 81, def: 78, phy: 84 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=savic' },
      { id: 'mal', name: 'مالكوم', number: 77, position: 'RW', rating: 82, nationality: 'https://flagcdn.com/w40/br.png', stats: { pac: 84, sho: 80, pas: 79, dri: 83, def: 40, phy: 68 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=malcom' },
      { id: 'bon', name: 'ياسين بونو', number: 37, position: 'GK', rating: 85, nationality: 'https://flagcdn.com/w40/ma.png', stats: { pac: 84, sho: 82, pas: 76, dri: 86, def: 45, phy: 80 }, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bono' },
    ]
  },
  'generic': {
    id: 'generic',
    name: 'النادي',
    englishName: 'Club',
    logo: '',
    coverImage: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200',
    founded: 2000,
    stadium: 'الملعب الرئيسي',
    coach: 'المدرب',
    nickname: 'اللقب',
    colors: { primary: '#10b981', secondary: '#0f172a', text: '#ffffff' },
    social: { twitter: '', instagram: '' },
    fanCount: 1000,
    country: Category.SAUDI,
    trophies: [],
    squad: []
  }
};

export const INITIAL_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'الهلال يكتسح الاتحاد في الكلاسيكو ويتصدر الدوري السعودي',
    summary: 'في ليلة زرقاء، الهلال يقسو على الاتحاد بثلاثية نظيفة ويعزز صدارته لدوري روشن.',
    content: `
      <p>حقق نادي الهلال فوزاً عريضاً على غريمه التقليدي الاتحاد بنتيجة 3-0 في كلاسيكو الكرة السعودية الذي أقيم مساء اليوم على ملعب المملكة أرينا.</p>
      <p>شهدت المباراة سيطرة هلالية كاملة، حيث افتتح ميتروفيتش التسجيل في الدقيقة 15، قبل أن يضيف سالم الدوسري الهدف الثاني بمهارة فردية رائعة.</p>
    `,
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200',
    category: Category.SAUDI,
    date: new Date().toISOString(),
    author: 'أحمد الحربي',
    views: 15420,
    isBreaking: true
  },
  {
    id: '2',
    title: 'العين الإماراتي يستعد لموقعة آسيوية حاسمة',
    summary: 'الزعيم العيناوي يختتم تحضيراته لمواجهة النصر في دوري أبطال آسيا.',
    content: 'يستعد العين الإماراتي لمباراة مصيرية...',
    imageUrl: 'https://images.unsplash.com/photo-1518605348391-e3e740319119?auto=format&fit=crop&q=80&w=1200',
    category: Category.UAE,
    date: new Date(Date.now() - 3600000).toISOString(),
    author: 'محمد العلي',
    views: 8500
  },
  {
    id: '3',
    title: 'السد القطري يعلن تعاقده مع صفقة عالمية',
    summary: 'في مفاجأة من العيار الثقيل، السد يضم نجماً أوروبياً لتدعيم صفوفه.',
    content: 'أعلن نادي السد رسمياً...',
    imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=1200',
    category: Category.QATAR,
    date: new Date(Date.now() - 7200000).toISOString(),
    author: 'خالد الكواري',
    views: 12300
  },
  {
    id: '4',
    title: 'الكويت الكويتي يحسم ديربي العاصمة',
    summary: 'فوز ثمين للعميد على العربي يضعه في المقدمة.',
    content: 'تمكن نادي الكويت من الفوز...',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
    category: Category.KUWAIT,
    date: new Date(Date.now() - 10800000).toISOString(),
    author: 'سعد العنزي',
    views: 5600
  },
  {
    id: '5',
    title: 'أهداف مباراة النصر والأهلي (4-3) - قمة الجولة',
    summary: 'شاهد ملخص المباراة المجنونة بين النصر والأهلي والتي انتهت بسبعة أهداف.',
    content: 'ملخص كامل للمباراة...',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200',
    category: Category.VIDEO,
    date: new Date(Date.now() - 86400000).toISOString(),
    author: 'فيديو Gulf Sports',
    views: 45000,
    videoEmbedId: 'dQw4w9WgXcQ' // Mock ID
  }
];

export const INITIAL_MATCHES: Match[] = [
  { id: 'm1', homeTeam: 'الهلال', homeLogo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg', awayTeam: 'النصر', awayLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg', scoreHome: 2, scoreAway: 1, time: '85\'', status: 'LIVE', league: 'دوري روشن', country: Category.SAUDI },
  { id: 'm2', homeTeam: 'الاتحاد', homeLogo: 'https://upload.wikimedia.org/wikipedia/en/0/06/Al_Ittihad_Club_Logo.png', awayTeam: 'الشباب', awayLogo: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Al_Shabab_FC_Saudi_logo.svg', scoreHome: null, scoreAway: null, time: '21:00', status: 'UPCOMING', league: 'دوري روشن', country: Category.SAUDI },
  { id: 'm3', homeTeam: 'العين', homeLogo: 'https://upload.wikimedia.org/wikipedia/en/a/a3/Al_Ain_FC_Logo.png', awayTeam: 'الشارقة', awayLogo: 'https://upload.wikimedia.org/wikipedia/en/0/01/Sharjah_FC_logo.svg', scoreHome: 3, scoreAway: 0, time: 'FT', status: 'FINISHED', league: 'دوري أدنوك', country: Category.UAE },
  { id: 'm4', homeTeam: 'السد', homeLogo: 'https://upload.wikimedia.org/wikipedia/en/8/86/Al-Sadd_SC_logo.svg', awayTeam: 'الدحيل', awayLogo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/Al-Duhail_SC_logo.svg', scoreHome: 1, scoreAway: 1, time: '45\'', status: 'LIVE', league: 'دوري نجوم قطر', country: Category.QATAR },
  { id: 'm5', homeTeam: 'الكويت', homeLogo: 'https://upload.wikimedia.org/wikipedia/en/2/22/Kuwait_SC_logo.svg', awayTeam: 'القادسية', awayLogo: 'https://upload.wikimedia.org/wikipedia/en/6/6f/Qadsia_SC_logo.svg', scoreHome: null, scoreAway: null, time: '19:30', status: 'UPCOMING', league: 'الدوري الكويتي', country: Category.KUWAIT },
];

export const INITIAL_STANDINGS: Standing[] = [
  { rank: 1, team: 'الهلال', logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg', played: 20, won: 18, drawn: 2, lost: 0, gf: 58, ga: 10, gd: 48, points: 56, league: 'SAUDI' },
  { rank: 2, team: 'النصر', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg', played: 20, won: 15, drawn: 2, lost: 3, gf: 55, ga: 22, gd: 33, points: 47, league: 'SAUDI' },
  { rank: 3, team: 'الأهلي', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Al-Ahli_Saudi_FC_logo.svg', played: 20, won: 12, drawn: 4, lost: 4, gf: 40, ga: 22, gd: 18, points: 40, league: 'SAUDI' },
  { rank: 1, team: 'الوصل', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Al_Wasl_FC_logo.svg', played: 18, won: 14, drawn: 4, lost: 0, gf: 45, ga: 15, gd: 30, points: 46, league: 'UAE' },
  { rank: 2, team: 'العين', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a3/Al_Ain_FC_Logo.png', played: 17, won: 12, drawn: 2, lost: 3, gf: 38, ga: 18, gd: 20, points: 38, league: 'UAE' },
];
