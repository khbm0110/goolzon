// Lightweight near-duplicate title detector for the autopilot
// pipeline. Not real NLP/embeddings — just normalized Arabic word
// overlap — but it catches the common real-world case: two different
// RSS sources (or an RSS item and a Google Trends topic) covering the
// exact same story with differently-worded headlines. The existing
// per-item dedup (hashing each RSS item's own guid/link into its
// pending_articles id) only catches the SAME source item being
// re-fetched on a later run — it has no way to see that two DIFFERENT
// source items are actually the same real-world event, which is
// exactly how autopilot ended up publishing two articles, different
// title and wording, for one piece of news.

const STOPWORDS = new Set([
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'أن', 'إن', 'كان', 'كانت', 'هذا', 'هذه', 'ذلك',
  'التي', 'الذي', 'بعد', 'قبل', 'اليوم', 'أمس', 'غدا', 'قال', 'قالت', 'ثم', 'أو',
  'لم', 'لن', 'ما', 'لا', 'هل', 'كل', 'بين', 'عند', 'حتى', 'منذ', 'خلال', 'ضد', 'و',
]);

function normalizeToWords(text: string): Set<string> {
  const cleaned = text
    .replace(/[\u064B-\u065F]/g, '') // strip Arabic diacritics (tashkeel)
    .replace(/[أإآ]/g, 'ا') // normalize alef variants
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // strip punctuation
    .toLowerCase();
  return new Set(cleaned.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w)));
}

export function titleSimilarity(a: string, b: string): number {
  const setA = normalizeToWords(a);
  const setB = normalizeToWords(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection++;
  // Overlap coefficient (intersection / smaller set), not Jaccard
  // (intersection / union). Two short Arabic headlines about the same
  // story often share only 2-3 words (e.g. just a player's full name)
  // while everything else is paraphrased differently — Jaccard's union
  // denominator dilutes that signal into a low score. Verified against
  // real pairs from this project's own pending_articles: two rewrites
  // of the same Salah transfer story scored 0.2 on Jaccard (would have
  // been missed) but 0.4 on overlap coefficient; two DIFFERENT Real
  // Madrid transfer-rumor stories (different players entirely) score
  // ~0.29-0.30 on overlap coefficient either way — so 0.35 cleanly
  // separates real duplicates from "same club, different news".
  return intersection / Math.min(setA.size, setB.size);
}

const DUPLICATE_THRESHOLD = 0.35;

// Returns the matching existing title if `candidate` looks like the
// same story as one of them, otherwise null.
export function findDuplicateTitle(candidate: string, existingTitles: string[]): string | null {
  for (const existing of existingTitles) {
    if (titleSimilarity(candidate, existing) >= DUPLICATE_THRESHOLD) return existing;
  }
  return null;
}
