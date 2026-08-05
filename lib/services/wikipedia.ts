// Free, no-key sources used only to give the admin a starting DRAFT
// when filling in a club's history/founding year — never auto-applied,
// always shown for review in ClubEditor before saving. Neither
// Wikipedia nor Wikidata guarantee coverage or accuracy for every
// club, especially smaller ones, so every field is optional and the
// caller must handle a mostly-empty result gracefully.
export interface WikiClubSuggestion {
  title: string | null;
  extract: string | null; // intro paragraph — a reasonable first draft for "history"
  foundedYear: number | null;
  pageUrl: string | null;
}

interface OpenSearchResponse extends Array<unknown> {
  0: string;
  1: string[];
  2: string[];
  3: string[];
}

interface WikipediaSummary {
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  wikibase_item?: string;
}

interface WikidataTimeClaim {
  mainsnak?: { datavalue?: { value?: { time?: string } } };
}

interface WikidataEntityResponse {
  entities?: Record<string, { claims?: Record<string, WikidataTimeClaim[]> }>;
}

export async function suggestClubInfoFromWikipedia(clubNameArabic: string): Promise<WikiClubSuggestion> {
  const empty: WikiClubSuggestion = { title: null, extract: null, foundedYear: null, pageUrl: null };

  // 1) Find the right Arabic Wikipedia page for this club name.
  const searchRes = await fetch(
    `https://ar.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(clubNameArabic)}&limit=1&namespace=0&format=json&origin=*`,
    { cache: 'no-store' }
  );
  if (!searchRes.ok) return empty;
  const searchJson = (await searchRes.json()) as OpenSearchResponse;
  const title = searchJson[1]?.[0];
  if (!title) return empty;

  // 2) Pull the intro summary — also gives us the Wikidata QID for free.
  const summaryRes = await fetch(`https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { cache: 'no-store' });
  if (!summaryRes.ok) return empty;
  const summary: WikipediaSummary = await summaryRes.json();

  let foundedYear: number | null = null;
  if (summary.wikibase_item) {
    foundedYear = await fetchFoundingYearFromWikidata(summary.wikibase_item);
  }

  return {
    title: summary.title ?? title,
    extract: summary.extract ?? null,
    foundedYear,
    pageUrl: summary.content_urls?.desktop?.page ?? null,
  };
}

// P571 = "inception" on Wikidata — the standard property for when an
// organization/club was founded.
async function fetchFoundingYearFromWikidata(qid: string): Promise<number | null> {
  try {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json: WikidataEntityResponse = await res.json();
    const claims = json.entities?.[qid]?.claims?.P571;
    const time = claims?.[0]?.mainsnak?.datavalue?.value?.time; // e.g. "+1932-01-01T00:00:00Z"
    if (!time) return null;
    const match = time.match(/^\+?(\d{4})-/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}
