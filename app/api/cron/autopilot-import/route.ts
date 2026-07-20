import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchRssFeed } from '@/lib/services/rss';
import { getProvider } from '@/lib/services/ai/providers';
import { buildRewritePrompt } from '@/lib/services/ai/prompt';
import { Category } from '@/types';

function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Loose relevance check: if an agent has keywords configured, an RSS
// item must mention at least one of them (case-insensitive, in its
// title or description) to be worth an AI call at all. This is what
// stops e.g. "وكيل الدوريات العربية" from spending its quota rewriting
// generic world-football news (kit leaks, mascots...) that has nothing
// to do with Arab leagues.
function isRelevant(item: { title: string; description: string }, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return true; // no filter configured = process everything
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

const ALL_CATEGORIES = Object.values(Category);

// Runs every enabled agent whose source_type = 'rss' (e.g. "وكيل
// الدوريات العربية"): fetches each of the agent's RSS sources, and for
// any item not already imported AND relevant to the agent's topic,
// rewrites it with THAT agent's own persona + provider and drops it
// into `pending_articles`.
//
// A fixed delay between AI calls keeps this comfortably under the very
// low requests-per-minute limits most providers' free tiers enforce —
// without it, importing 10 items in a burst reliably 429s on things
// like Gemini's free tier.
const DELAY_BETWEEN_AI_CALLS_MS = 4000;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Sync is not configured on the server yet.' }, { status: 503 });
  }

  const { data: settings } = await admin.from('autopilot_settings').select('*').eq('id', 1).single();
  if (!settings?.enabled) {
    return NextResponse.json({ message: 'الأتمتة موقوفة حاليًا من لوحة التحكم.' });
  }

  const { data: agents } = await admin.from('ai_agents').select('*').eq('source_type', 'rss').eq('enabled', true);
  if (!agents || agents.length === 0) {
    return NextResponse.json({ message: 'ما فيه وكلاء RSS مفعّلين حاليًا.' });
  }

  let fetched = 0;
  let queued = 0;
  let skipped = 0;
  let irrelevant = 0;
  const errors: string[] = [];

  for (const agent of agents) {
    const provider = getProvider(agent.provider_id);
    if (!provider || !provider.isConfigured()) {
      errors.push(`${agent.name}: المزوّد "${agent.provider_id}" غير مُفعّل أو ناقص مفتاح API.`);
      continue;
    }

    const keywords: string[] = agent.keywords ?? [];
    const minWords: number = agent.min_words ?? 250;
    const byline: string = agent.byline || 'فريق التحرير الرياضي';
    const sources: { name: string; url: string }[] = agent.rss_sources ?? [];

    for (const source of sources) {
      let items;
      try {
        items = await fetchRssFeed(source.url);
      } catch (e: any) {
        errors.push(`${agent.name} / ${source.name}: ${e?.message ?? 'فشل جلب RSS'}`);
        continue;
      }

      for (const item of items.slice(0, 10)) {
        fetched++;
        if (!item.title || !item.link) continue;

        if (!isRelevant(item, keywords)) {
          irrelevant++;
          continue;
        }

        const pendingId = `af-rss-${hashId(item.guid || item.link)}`;
        const { data: existingPending } = await admin.from('pending_articles').select('id').eq('id', pendingId).maybeSingle();
        const { data: existingPublished } = await admin.from('articles').select('id').eq('id', pendingId).maybeSingle();
        if (existingPending || existingPublished) {
          skipped++;
          continue;
        }

        try {
          await sleep(DELAY_BETWEEN_AI_CALLS_MS);
          const prompt = buildRewritePrompt(item.title, item.description || item.title, agent.persona, minWords, ALL_CATEGORIES);
          const rewritten = await provider.complete(prompt);

          // Trust the AI's category pick only if it's one of our real
          // categories; otherwise fall back to the agent's default so a
          // typo/hallucinated label never breaks the article's classification.
          const category = ALL_CATEGORIES.includes(rewritten.category as Category)
            ? (rewritten.category as string)
            : agent.default_category;

          const { error } = await admin.from('pending_articles').insert({
            id: pendingId,
            agent_id: agent.id,
            title: rewritten.title,
            summary: rewritten.summary,
            content: rewritten.content,
            category,
            image_url: null,
            source_url: item.link,
            source_name: source.name,
            ai_provider: provider.id,
            author: byline,
            status: 'PENDING',
          });
          if (error) throw new Error(error.message);
          queued++;
        } catch (e: any) {
          errors.push(`[${agent.name}] "${item.title}": ${e?.message ?? 'فشل إعادة الصياغة'}`);
        }
      }
    }
  }

  return NextResponse.json({ fetched, queued, skipped, irrelevant, errors });
}
