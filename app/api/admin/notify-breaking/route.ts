import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToAll } from '@/lib/services/webPush';
import { getErrorMessage } from '@/lib/utils/errors';

// Called by the admin panel right after saving an article with
// isBreaking=true. Sending push requires the VAPID private key, which
// must never reach the browser — so this one small step (unlike the
// actual article insert, which the admin's own browser does directly
// against Supabase with RLS) has to go through a server route.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { articleId, title, summary } = (await request.json()) as { articleId?: string; title?: string; summary?: string };
  if (!articleId || !title) return NextResponse.json({ error: 'articleId/title مفقود.' }, { status: 400 });

  try {
    const admin = createAdminClient();
    await sendPushToAll(admin, { title: `⚡ ${title}`, body: summary || '', url: `/article/${articleId}` });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e, 'فشل إرسال الإشعارات') }, { status: 500 });
  }
}
