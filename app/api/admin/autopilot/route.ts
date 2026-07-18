import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AI_PROVIDERS } from '@/lib/services/ai/providers';

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
  const { data: settings } = await admin.from('autopilot_settings').select('*').eq('id', 1).single();
  const providers = AI_PROVIDERS.map((p) => ({ id: p.id, name: p.name, configured: p.isConfigured() }));

  return NextResponse.json({ settings, providers });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { enabled, active_provider, review_window_minutes, rss_sources } = body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('autopilot_settings')
    .update({
      ...(enabled !== undefined && { enabled }),
      ...(active_provider !== undefined && { active_provider }),
      ...(review_window_minutes !== undefined && { review_window_minutes }),
      ...(rss_sources !== undefined && { rss_sources }),
    })
    .eq('id', 1)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
