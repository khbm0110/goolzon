// Google has no official public "Trends API" with API keys. This calls
// the same undocumented endpoint trends.google.com itself uses in the
// browser — free, no key required, but unofficial: Google could change
// or remove it without notice. If it starts failing, that's why.
//
// The response is prefixed with ")]}'," (an XSSI-protection prefix)
// before the actual JSON — has to be stripped first.
export interface TrendItem {
  title: string;
  traffic: string | null;
  relatedArticles: { title: string; url: string; source: string; snippet: string }[];
}

interface RawTrendArticle {
  title?: string;
  url?: string;
  source?: string;
  snippet?: string;
}

interface RawTrendingSearch {
  title?: { query?: string };
  formattedTraffic?: string;
  articles?: RawTrendArticle[];
}

interface RawDailyTrendsResponse {
  default?: {
    trendingSearchesDays?: { trendingSearches?: RawTrendingSearch[] }[];
  };
}

export async function fetchDailyTrends(geo: string): Promise<TrendItem[]> {
  const res = await fetch(`https://trends.google.com/trends/api/dailytrends?hl=ar&geo=${geo}&ns=15`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (GoolzonBot autopilot)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Google Trends request failed (${res.status})`);

  const raw = await res.text();
  const jsonText = raw.replace(/^\)\]\}',?\n?/, '');
  const json: RawDailyTrendsResponse = JSON.parse(jsonText);

  const days = json.default?.trendingSearchesDays ?? [];
  const items: TrendItem[] = [];
  for (const day of days) {
    for (const trend of day.trendingSearches ?? []) {
      items.push({
        title: trend.title?.query ?? '',
        traffic: trend.formattedTraffic ?? null,
        relatedArticles: (trend.articles ?? []).slice(0, 3).map((a) => ({
          title: a.title ?? '',
          url: a.url ?? '',
          source: a.source ?? '',
          snippet: a.snippet ?? '',
        })),
      });
    }
  }
  return items;
}

const FOOTBALL_KEYWORDS = [
  'كرة القدم', 'الدوري', 'مباراة', 'نادي', 'فريق', 'كأس', 'هداف', 'لاعب', 'مدرب', 'ملعب',
  'football', 'soccer', 'match', 'league', 'club', 'fc', 'cup', 'goal', 'transfer',
];

// Keeps only trends that are plausibly about football, using both the
// trend title and its related-article titles/snippets — a query alone
// is often too short/ambiguous to judge on its own.
export function filterFootballTrends(trends: TrendItem[]): TrendItem[] {
  return trends.filter((t) => {
    const haystack = [t.title, ...t.relatedArticles.flatMap((a) => [a.title, a.snippet])].join(' ').toLowerCase();
    return FOOTBALL_KEYWORDS.some((kw) => haystack.includes(kw.toLowerCase()));
  });
}
