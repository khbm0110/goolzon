import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchRssFeed } from '@/lib/services/rss';
import { getProvider } from '@/lib/services/ai/providers';

// Simple, dependency-free stable id from a URL — good enough to dedupe
// RSS items across runs without a database round-trip per item.
function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Step 1 of autopilot: fetch each tracked RSS source, rewrite any item
// we haven't seen before with the admin's chosen AI provider, and drop
// it into `pending_articles` with status PENDING. Nothing here ever
// touches the public `articles` table directly — that's step 2
// (/api/cron/autopilot-publish), which only promotes items whose
// review window has elapsed (or that an admin approved early).
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

  const provider = getProvider(settings.active_provider);
  if (!provider || !provider.isConfigured()) {
    return NextResponse.json({ error: `المزوّد "${settings.active_provider}" غير مُفعّل أو ناقص مفتاح API.` }, { status: 503 });
  }

  const sources: { name: string; url: string }[] = settings.rss_sources ?? [];
  if (sources.length === 0) {
    return NextResponse.json({ message: 'ما فيه مصادر RSS مضافة بعد.' });
  }

  let fetched = 0;
  let queued = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const source of sources) {
    let items;
    try {
      items = await fetchRssFeed(source.url);
    } catch (e: any) {
      errors.push(`${source.name}: ${e?.message ?? 'فشل جلب RSS'}`);
      continue;
    }

    // Newest-first, cap per-source per-run so one huge feed can't burn
    // the whole AI quota / cron time budget in a single pass.
    for (const item of items.slice(0, 10)) {
      fetched++;
      if (!item.title || !item.link) continue;

      const pendingId = `af-rss-${hashId(item.guid || item.link)}`;
      const { data: existingPending } = await admin.from('pending_articles').select('id').eq('id', pendingId).maybeSingle();
      const { data: existingPublished } = await admin.from('articles').select('id').eq('id', pendingId).maybeSingle();
      if (existingPending || existingPublished) {
        skipped++;
        continue;
      }

      try {
        const rewritten = await provider.rewrite(item.description || item.title, item.title);
        const { error } = await admin.from('pending_articles').insert({
          id: pendingId,
          title: rewritten.title,
          summary: rewritten.summary,
          content: rewritten.content,
          category: 'SAUDI',
          image_url: null,
          source_url: item.link,
          source_name: source.name,
          ai_provider: provider.id,
          status: 'PENDING',
        });
        if (error) throw new Error(error.message);
        queued++;
      } catch (e: any) {
        errors.push(`"${item.title}": ${e?.message ?? 'فشل إعادة الصياغة'}`);
      }
    }
  }

  return NextResponse.json({ fetched, queued, skipped, errors });
}
