import { Article, Category, ClubProfile, AnalyticsData } from './types';

export const POPULAR_CLUBS = [
  // Saudi
  { name: 'الهلال', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Al_Hilal_SFC_logo.svg', id: 'hilal' },
  { name: 'النصر', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Al_Nassr_FC_Logo.svg', id: 'nassr' },
  { name: 'الاتحاد', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/0/06/Al_Ittihad_Club_Logo.png', id: 'ittihad' },
  { name: 'الأهلي', country: Category.SAUDI, logo: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Al-Ahli_Saudi_FC_logo.svg', id: 'ahli' },
  
  // Europe
  { name: 'ريال مدريد', country: Category.SPAIN, logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', id: 'realmadrid' },
  { name: 'برشلونة', country: Category.SPAIN, logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', id: 'barcelona' },
  { name: 'مانشستر سيتي', country: Category.ENGLAND, logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg', id: 'mancity' },
  { name: 'ليفربول', country: Category.ENGLAND, logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', id: 'liverpool' },
  { name: 'بايرن ميونخ', country: Category.GERMANY, logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', id: 'bayern' },

  // UAE
  { name: 'العين', country: Category.UAE, logo: 'https://upload.wikimedia.org/wikipedia/en/a/a3/Al_Ain_FC_Logo.png', id: 'ain' },
  
  // Qatar
  { name: 'السد', country: Category.QATAR, logo: 'https://upload.wikimedia.org/wikipedia/en/8/86/Al-Sadd_SC_logo.svg', id: 'sadd' },

  // Kuwait
  { name: 'الكويت', country: Category.KUWAIT, logo: 'https://upload.wikimedia.org/wikipedia/en/2/22/Kuwait_SC_logo.svg', id: 'kuwait' },
];

// NOTE: This database is used for the INITIAL SEEDING of Supabase from the Admin Panel.
// It is NOT used as a runtime fallback for the main application.
export const CLUB_DATABASE: Record<string, ClubProfile> = {
  'nassr': {
    id: 'nassr',
    name: 'النصر',
    englishName: 'Al-Nassr',
    apiFootballId: 2935,
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
    apiFootballId: 639,
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
    apiFootballId: 0,
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

// NOTE: These articles are used for the INITIAL SEEDING of Supabase from the Admin Panel.
// They are NOT used as a runtime fallback for the main application.
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
    author: 'فيديو goolzon',
    views: 45000,
    videoEmbedId: 'dQw4w9WgXcQ' // Mock ID
  },
  {
    id: '6',
    title: 'النصر يحقق فوزاً صعباً على الأهلي بهدف رونالدو',
    summary: 'في مباراة مثيرة، تمكن النصر من خطف ثلاث نقاط ثمينة من الأهلي بفضل هدف قاتل من كريستيانو رونالدو.',
    content: 'تفاصيل المباراة...',
    imageUrl: 'https://images.unsplash.com/photo-1510563800743-aed236490d94?auto=format&fit=crop&q=80&w=1200',
    category: Category.SAUDI,
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    author: 'عبدالعزيز الدوسري',
    views: 9800
  },
  {
    id: '7',
    title: 'شباب الأهلي يتعادل مع الشارقة في ديربي الإمارات',
    summary: 'انتهت قمة الجولة في دوري أدنوك للمحترفين بالتعادل الإيجابي 1-1 بين شباب الأهلي والشارقة.',
    content: 'تفاصيل المباراة...',
    imageUrl: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?auto=format&fit=crop&q=80&w=1200',
    category: Category.UAE,
    date: new Date(Date.now() - 4 * 3600000).toISOString(),
    author: 'علي المهيري',
    views: 6200
  },
  {
    id: '8',
    title: 'ملخص وأهداف مباراة ريال مدريد وبايرن ميونخ (2-1)',
    summary: 'شاهد أهداف الريمونتادا التاريخية لريال مدريد في دوري أبطال أوروبا.',
    content: 'ملخص كامل...',
    imageUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1200',
    category: Category.VIDEO,
    date: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    author: 'فيديو goolzon',
    views: 65000,
    videoEmbedId: 'rokGy0huYEA' 
  },
  {
    id: '9',
    title: 'تحليل تكتيكي: كيف تفوق الهلال على الاتحاد؟',
    summary: 'نظرة فنية على الأسباب التكتيكية التي منحت الهلال السيطرة الكاملة في الكلاسيكو الأخير.',
    content: 'تحليل فني...',
    imageUrl: 'https://images.unsplash.com/photo-1551972251-12070d63502a?auto=format&fit=crop&q=80&w=1000',
    category: Category.SAUDI,
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    author: 'فهد المولد',
    views: 11500
  },
  {
    id: '10',
    title: 'ميسي يقود برشلونة للفوز بالليغا',
    summary: 'برشلونة يحسم لقب الدوري الإسباني بعد فوز مثير على أتلتيكو مدريد بفضل هدف من ليونيل ميسي.',
    content: 'في مباراة حاسمة، تمكن برشلونة...',
    imageUrl: 'https://images.unsplash.com/photo-1511886921339-7b34a34ac929?auto=format&fit=crop&q=80&w=1200',
    category: Category.SPAIN,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    author: 'سالم الشمري',
    views: 22000
  },
  {
    id: '11',
    title: 'مانشستر سيتي بطلاً للدوري الإنجليزي',
    summary: 'للمرة الرابعة على التوالي، مانشستر سيتي يتربع على عرش الكرة الإنجليزية.',
    content: 'حقق مانشستر سيتي...',
    imageUrl: 'https://images.unsplash.com/photo-1628891638290-72124506371c?auto=format&fit=crop&q=80&w=1200',
    category: Category.ENGLAND,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    author: 'جون دو',
    views: 31000
  },
  {
    id: '12',
    title: 'نهائي دوري أبطال أوروبا: قمة نارية منتظرة',
    summary: 'العالم يترقب المواجهة الكبرى بين ريال مدريد وليفربول في نهائي دوري الأبطال.',
    content: 'يستعد عشاق كرة القدم...',
    imageUrl: 'https://images.unsplash.com/photo-1606925797300-0b35e9d17927?auto=format&fit=crop&q=80&w=1200',
    category: Category.CHAMPIONS_LEAGUE,
    date: new Date(Date.now() - 6 * 3600000).toISOString(),
    author: 'فريق التحرير',
    views: 18000
  }
];

// FIX: Added missing mock data for the analytics dashboard.
export const INITIAL_ANALYTICS_DATA: AnalyticsData = {
  summary: {
    totalVisitors: 125430,
    newUsers: 1520,
    bounceRate: 45.6,
    avgSessionDuration: '3m 15s',
  },
  dailyVisitors: [
    { day: 'سبت', visitors: 1200 },
    { day: 'أحد', visitors: 1800 },
    { day: 'اثنين', visitors: 1600 },
    { day: 'ثلاثاء', visitors: 2200 },
    { day: 'أربعاء', visitors: 2500 },
    { day: 'خميس', visitors: 3000 },
    { day: 'جمعة', visitors: 2800 },
  ],
  trafficSources: [
    { source: 'بحث مباشر', value: 40, color: 'bg-primary' },
    { source: 'وسائل التواصل', value: 30, color: 'bg-blue-500' },
    { source: 'إحالات', value: 20, color: 'bg-indigo-500' },
    { source: 'أخرى', value: 10, color: 'bg-slate-600' },
  ],
  visitorCountries: [
    { name: 'السعودية', code: 'sa', visitors: 50000 },
    { name: 'الإمارات', code: 'ae', visitors: 25000 },
    { name: 'مصر', code: 'eg', visitors: 15000 },
    { name: 'الكويت', code: 'kw', visitors: 10000 },
  ],
  devicePerformance: [
    { device: 'Desktop', value: 35 },
    { device: 'Mobile', value: 65 },
  ],
  landingPages: [
    { path: '/', visits: 40000 },
    { path: '/article/1', visits: 15000 },
    { path: '/matches', visits: 10000 },
  ],
  exitPages: [
    { path: '/article/2', visits: 12000 },
    { path: '/', visits: 8000 },
    { path: '/profile', visits: 5000 },
  ],
  goals: [
    { name: 'تسجيل مستخدم جديد', completions: 1520, conversionRate: 1.2 },
    { name: 'مشاركة مقال', completions: 8000, conversionRate: 6.4 },
  ],
  pageSpeeds: [
    { path: '/', loadTime: 1.2 },
    { path: '/article/:id', loadTime: 1.8 },
    { path: '/matches', loadTime: 2.1 },
  ],
  visitorStats: {
    daily: { total: 3200, change: 15.2 },
    weekly: { total: 22400, change: 8.1 },
    monthly: { total: 91000, change: -2.5 },
    yearly: { total: 1100000, change: 45.0 },
  },
};
