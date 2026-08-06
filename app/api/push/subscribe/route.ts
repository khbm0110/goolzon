import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Called by usePushNotifications (client) right after the browser
// grants permission and the service worker's pushManager.subscribe()
// returns a subscription object. Uses the cookie-aware server client
// (not the admin client) so RLS naturally enforces "only your own
// subscriptions" — no extra check needed here.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 });

  const body = await request.json();
  const { endpoint, keys } = body as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'بيانات الاشتراك غير مكتملة.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
