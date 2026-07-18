import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Step 2 of autopilot. Anything still PENDING once its review window
// has elapsed gets promoted to a real, live `articles` row automatically
// — this is what makes "أراجعها خلال 3 دقائق، وإلا تُنشر تلقائيًا" actually
// happen without anyone touching the site.
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

  const { data: settings } = await admin.from('autopilot_settings').select('review_window_minutes').eq('id', 1).single();
  const windowMinutes = settings?.review_window_minutes ?? 3;
  const cutoff = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { data: dueItems } = await admin
    .from('pending_articles')
    .select('*')
    .eq('status', 'PENDING')
    .lte('created_at', cutoff);

  if (!dueItems || dueItems.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  let published = 0;
  const errors: string[] = [];

  for (const item of dueItems) {
    const { error: insertError } = await admin.from('articles').insert({
      id: item.id,
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      image_url: item.image_url,
      is_breaking: false,
      views: 0,
      author: item.ai_provider ? `تحرير آلي (${item.ai_provider})` : 'تحرير آلي',
      date: new Date().toISOString(),
    });
    if (insertError) {
      errors.push(`${item.id}: ${insertError.message}`);
      continue;
    }
    await admin.from('pending_articles').update({ status: 'PUBLISHED', published_article_id: item.id }).eq('id', item.id);
    published++;
  }

  return NextResponse.json({ published, errors });
}
