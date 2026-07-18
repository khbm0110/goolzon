import type { Sponsor, SeoSettings, FeatureFlags } from '@/types';

export const MOCK_SPONSORS: Sponsor[] = [
  { id: 'sponsor-1', name: 'STC', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=STC', url: 'https://stc.com.sa', active: true },
];

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteTitle: 'goolzon | نبض الكرة العالمية',
  metaDescription: 'منصة رياضية عربية متكاملة: أخبار حصرية، مباريات، إحصائيات وذكاء اصطناعي.',
  metaKeywords: 'كرة قدم, أخبار رياضية, الدوري السعودي, نتائج المباريات',
  ogImageUrl: '',
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  matches: true,
  clubs: true,
  videos: true,
  analysis: true,
  autopilot: false,
  userSystem: true,
};
