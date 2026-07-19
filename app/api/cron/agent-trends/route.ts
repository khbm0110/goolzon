import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchDailyTrends, filterFootballTrends } from '@/lib/services/googleTrends';
import { getProvider } from '@/lib/services/ai/providers';
import { buildRewritePrompt } from '@/lib/services/ai/prompt';

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

// "وكيل الترند": pulls today's trending searches (Google Trends,
// Saudi Arabia by default), keeps only the ones that look football-
// related, and — using each trend's own related-news snippets as real
// source material (never inventing facts from the bare search term) —
// writes a short "why this is trending" piece with the trends agent's
// persona. Same review-queue + auto-publish pipeline as every other
// agent.
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

  const { data: agent } = await admin.from('ai_agents').select('*').eq('id', 'trends').eq('source_type', 'google_trends').maybeSingle();
  if (!agent || !agent.enabled) {
    return NextResponse.json({ message: 'وكيل الترند موقوف حاليًا.' });
  }

  const provider = getProvider(agent.provider_id);
  if (!provider || !provider.isConfigured()) {
    return NextResponse.json({ error: `المزوّد "${agent.provider_id}" غير مُفعّل أو ناقص مفتاح API.` }, { status: 503 });
  }

  let trends;
  try {
    trends = filterFootballTrends(await fetchDailyTrends('SA'));
  } catch (e: any) {
    return NextResponse.json({ error: `فشل جلب Google Trends: ${e?.message ?? 'unknown'}` }, { status: 502 });
  }

  let queued = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const trend of trends.slice(0, 5)) {
    const pendingId = `af-trend-${hashId(trend.title)}`;
    const { data: existingPending } = await admin.from('pending_articles').select('id').eq('id', pendingId).maybeSingle();
    const { data: existingPublished } = await admin.from('articles').select('id').eq('id', pendingId).maybeSingle();
    if (existingPending || existingPublished) {
      skipped++;
      continue;
    }

    const sourceMaterial = trend.relatedArticles.map((a) => `${a.title}: ${a.snippet}`).join('\n');
    if (!sourceMaterial) {
      skipped++; // No real facts to ground the article in — skip rather than let the model invent them.
      continue;
    }

    try {
      await sleep(4000);
      const prompt = buildRewritePrompt(`الأكثر بحثًا الآن: ${trend.title}`, sourceMaterial, agent.persona);
      const rewritten = await provider.complete(prompt);
      const { error } = await admin.from('pending_articles').insert({
        id: pendingId,
        agent_id: 'trends',
        title: rewritten.title,
        summary: rewritten.summary,
        content: rewritten.content,
        category: agent.default_category,
        image_url: null,
        source_url: trend.relatedArticles[0]?.url ?? null,
        source_name: `ترند Google (${trend.traffic ?? ''})`,
        ai_provider: provider.id,
        status: 'PENDING',
      });
      if (error) throw new Error(error.message);
      queued++;
    } catch (e: any) {
      errors.push(`"${trend.title}": ${e?.message ?? 'فشل إعادة الصياغة'}`);
    }
  }

  return NextResponse.json({ trendsFound: trends.length, queued, skipped, errors });
}
