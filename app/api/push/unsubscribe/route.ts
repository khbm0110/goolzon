import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });

  const { endpoint } = (await request.json()) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: 'endpoint مفقود.' }, { status: 400 });

  // RLS (auth.uid() = user_id) means this can only ever delete the
  // caller's own row even without the extra .eq('user_id', ...) below,
  // but being explicit here doesn't hurt.
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
