import { XMLParser } from 'fast-xml-parser';

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string; // stable identifier, falls back to link
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

// Fetches and parses a standard RSS 2.0 (or Atom) feed. Deliberately
// tolerant — real-world feeds vary a lot in exactly which fields they
// populate, so every field falls back gracefully rather than throwing.
export async function fetchRssFeed(url: string): Promise<RssItem[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'GoolzonBot/1.0 (+autopilot)' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`RSS fetch failed (${res.status}): ${url}`);
  const xml = await res.text();
  const json = parser.parse(xml);

  // RSS 2.0
  const rssItems = json?.rss?.channel?.item;
  if (rssItems) {
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];
    return list.map((item: any) => ({
      title: stripHtml(String(item.title ?? '')),
      link: String(item.link ?? ''),
      description: stripHtml(String(item.description ?? item['content:encoded'] ?? '')),
      pubDate: item.pubDate ?? null,
      guid: String(typeof item.guid === 'object' ? item.guid['#text'] : item.guid ?? item.link ?? ''),
    }));
  }

  // Atom fallback
  const atomEntries = json?.feed?.entry;
  if (atomEntries) {
    const list = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    return list.map((entry: any) => {
      const link = Array.isArray(entry.link) ? entry.link.find((l: any) => l['@_rel'] !== 'self')?.['@_href'] : entry.link?.['@_href'];
      return {
        title: stripHtml(String(entry.title ?? '')),
        link: String(link ?? ''),
        description: stripHtml(String(entry.summary ?? entry.content ?? '')),
        pubDate: entry.updated ?? entry.published ?? null,
        guid: String(entry.id ?? link ?? ''),
      };
    });
  }

  return [];
}
