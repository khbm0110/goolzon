import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin.from('pending_articles').select('*').order('created_at', { ascending: false }).limit(100);
  return NextResponse.json({ items: data ?? [] });
}

// action: 'publish-now' | 'reject'
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, action, edits } = await request.json();
  if (!id || !['publish-now', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Missing id or invalid action' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: item } = await admin.from('pending_articles').select('*').eq('id', id).single();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'reject') {
    await admin.from('pending_articles').update({ status: 'REJECTED' }).eq('id', id);
    return NextResponse.json({ success: true });
  }

  // publish-now — optionally with admin edits applied first.
  const final = {
    title: edits?.title ?? item.title,
    summary: edits?.summary ?? item.summary,
    content: edits?.content ?? item.content,
    category: edits?.category ?? item.category,
    image_url: edits?.imageUrl ?? item.image_url,
  };

  const { error: insertError } = await admin.from('articles').insert({
    id: item.id,
    title: final.title,
    summary: final.summary,
    content: final.content,
    category: final.category,
    image_url: final.image_url,
    is_breaking: false,
    views: 0,
    author: item.author || 'فريق التحرير الرياضي',
    date: new Date().toISOString(),
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await admin.from('pending_articles').update({ status: 'PUBLISHED', published_article_id: item.id }).eq('id', id);
  return NextResponse.json({ success: true });
}
