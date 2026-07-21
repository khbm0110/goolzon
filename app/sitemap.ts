import type { MetadataRoute } from 'next';
import { data } from '@/lib/data';

// Next.js (App Router) picks this up automatically and serves it at
// /sitemap.xml — no extra wiring needed.
//
// NEXT_PUBLIC_SITE_URL must be set to your real production domain
// (see .env.example) or every URL below would point at localhost.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Static, always-existing pages. Deliberately excluded: /login,
// /register, /profile, /admin/* — nothing behind auth or with no SEO
// value belongs in a sitemap.
const STATIC_PATHS = [
  '',
  '/scores',
  '/matches',
  '/standings',
  '/topscorers',
  '/assists',
  '/best-players',
  '/clubs',
  '/videos',
  '/analysis',
  '/compare',
  '/leaderboard',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

// Must match CATEGORY_MAP in app/country/[slug]/page.tsx — kept as a
// separate list here (rather than deriving from the Category enum)
// since not every category has a matching country landing page.
const COUNTRY_SLUGS = [
  'saudi', 'uae', 'qatar', 'kuwait', 'oman', 'bahrain', 'egypt', 'algeria',
  'tunisia', 'morocco', 'jordan', 'iraq', 'lebanon', 'libya', 'sudan',
  'yemen', 'palestine', 'england', 'spain', 'italy', 'germany',
  'champions-league', 'arab-cup', 'analysis',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/scores' ? 'always' : 'hourly',
    priority: path === '' ? 1 : 0.7,
  }));

  const countryEntries: MetadataRoute.Sitemap = COUNTRY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/country/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.6,
  }));

  // Dynamic content — best-effort: if Supabase is briefly unreachable
  // we still want the static pages above to serve, not a 500.
  let articleEntries: MetadataRoute.Sitemap = [];
  let matchEntries: MetadataRoute.Sitemap = [];
  let clubEntries: MetadataRoute.Sitemap = [];

  try {
    const articles = await data.getArticles();
    articleEntries = articles.map((article) => ({
      url: `${SITE_URL}/article/${article.id}`,
      lastModified: article.date ? new Date(article.date) : now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch {
    // omit article URLs this run rather than failing the whole sitemap
  }

  try {
    const matches = await data.getMatches();
    matchEntries = matches.map((match) => ({
      url: `${SITE_URL}/match/${match.id}`,
      lastModified: match.date ? new Date(match.date) : now,
      changeFrequency: match.status === 'FINISHED' ? 'monthly' : 'always',
      priority: 0.6,
    }));
  } catch {
    // omit match URLs this run
  }

  try {
    const clubs = await data.getClubs();
    clubEntries = clubs.map((club) => ({
      url: `${SITE_URL}/club/${club.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));
  } catch {
    // omit club URLs this run
  }

  return [...staticEntries, ...countryEntries, ...articleEntries, ...matchEntries, ...clubEntries];
}
