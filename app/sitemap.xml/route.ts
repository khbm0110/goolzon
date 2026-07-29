import { data } from '@/lib/data';

// Manually-built XML instead of Next.js's built-in sitemap.ts metadata
// convention. We switched to this after Google Search Console reported
// "Sitemap could not be read" — the served bytes weren't parsing as
// clean UTF-8 text even though the framework reported the right
// Content-Type, and a raw Response gives full, unambiguous control
// over every byte (explicit XML declaration, explicit UTF-8 encoding,
// explicit Content-Type header) with nothing left to a metadata-route
// serialization layer we can't directly inspect.
export const dynamic = 'force-dynamic';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const STATIC_PATHS = [
  '', '/scores', '/matches', '/standings', '/topscorers', '/assists', '/best-players',
  '/clubs', '/videos', '/analysis', '/compare', '/leaderboard', '/about', '/contact', '/privacy', '/terms',
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

// Guards against a title/id containing raw XML-special characters
// (&, <, >, quotes) ever producing invalid markup.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface UrlEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function buildUrlXml(entry: UrlEntry): string {
  return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`;
}

export async function GET() {
  const now = new Date().toISOString();
  const entries: UrlEntry[] = [];

  for (const path of STATIC_PATHS) {
    entries.push({
      loc: `${SITE_URL}${path}`,
      lastmod: now,
      changefreq: path === '' || path === '/scores' ? 'always' : 'hourly',
      priority: path === '' ? '1.0' : '0.7',
    });
  }

  for (const slug of COUNTRY_SLUGS) {
    entries.push({ loc: `${SITE_URL}/country/${slug}`, lastmod: now, changefreq: 'hourly', priority: '0.6' });
  }

  // Dynamic content — best-effort: if Supabase is briefly unreachable
  // we still want the static pages above to serve, not a broken sitemap.
  try {
    const articles = await data.getArticles();
    for (const article of articles) {
      entries.push({
        loc: `${SITE_URL}/article/${article.id}`,
        lastmod: article.date ? new Date(article.date).toISOString() : now,
        changefreq: 'daily',
        priority: '0.8',
      });
    }
  } catch {
    // omit article URLs this run rather than failing the whole sitemap
  }

  try {
    const matches = await data.getMatches();
    for (const match of matches) {
      entries.push({
        loc: `${SITE_URL}/match/${match.id}`,
        lastmod: match.date ? new Date(match.date).toISOString() : now,
        changefreq: match.status === 'FINISHED' ? 'monthly' : 'always',
        priority: '0.6',
      });
    }
  } catch {
    // omit match URLs this run
  }

  try {
    const clubs = await data.getClubs();
    for (const club of clubs) {
      entries.push({ loc: `${SITE_URL}/club/${club.id}`, lastmod: now, changefreq: 'weekly', priority: '0.5' });
    }
  } catch {
    // omit club URLs this run
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(buildUrlXml).join('\n')}\n</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
