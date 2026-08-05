import { XMLParser } from 'fast-xml-parser';

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string; // stable identifier, falls back to link
}

// RSS/Atom feeds are genuinely heterogeneous across the wild web —
// fast-xml-parser reflects that by returning fields like `guid` as
// either a plain string or an object (`{ '#text': ..., '@_isPermaLink':
// ... }`) depending on the source feed's own markup. These types cover
// both shapes rather than pretending the field is always one or the
// other.
type XmlTextOrObject = string | { '#text'?: string };

interface RawRssItem {
  title?: string;
  link?: string;
  description?: string;
  'content:encoded'?: string;
  pubDate?: string;
  guid?: XmlTextOrObject;
}

interface RawAtomLink {
  '@_rel'?: string;
  '@_href'?: string;
}

interface RawAtomEntry {
  title?: string;
  link?: RawAtomLink | RawAtomLink[];
  summary?: string;
  content?: string;
  updated?: string;
  published?: string;
  id?: string;
}

interface RawFeedDocument {
  rss?: { channel?: { item?: RawRssItem | RawRssItem[] } };
  feed?: { entry?: RawAtomEntry | RawAtomEntry[] };
}

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function textOf(value: XmlTextOrObject | undefined): string {
  if (!value) return '';
  return typeof value === 'object' ? value['#text'] ?? '' : value;
}

// Fetches and parses a standard RSS 2.0 (or Atom) feed. Deliberately
// tolerant — real-world feeds vary a lot in exactly which fields they
// populate, so every field falls back gracefully rather than throwing.
export async function fetchRssFeed(url: string): Promise<RssItem[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'GoolzonBot/1.0 (+autopilot)' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`RSS fetch failed (${res.status}): ${url}`);
  const xml = await res.text();
  const json: RawFeedDocument = parser.parse(xml);

  // RSS 2.0
  const rssItems = json.rss?.channel?.item;
  if (rssItems) {
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];
    return list.map((item) => ({
      title: stripHtml(item.title ?? ''),
      link: item.link ?? '',
      description: stripHtml(item.description ?? item['content:encoded'] ?? ''),
      pubDate: item.pubDate ?? null,
      guid: textOf(item.guid) || item.link || '',
    }));
  }

  // Atom fallback
  const atomEntries = json.feed?.entry;
  if (atomEntries) {
    const list = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    return list.map((entry) => {
      const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : [];
      const link = (links.find((l) => l['@_rel'] !== 'self') ?? links[0])?.['@_href'] ?? '';
      return {
        title: stripHtml(entry.title ?? ''),
        link,
        description: stripHtml(entry.summary ?? entry.content ?? ''),
        pubDate: entry.updated ?? entry.published ?? null,
        guid: entry.id || link,
      };
    });
  }

  return [];
}
