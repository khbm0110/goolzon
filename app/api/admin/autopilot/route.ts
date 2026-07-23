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

// GET: global settings (kill switch + review window) + every agent +
// the raw provider list (so the UI can show "no API key configured"
// next to any provider that isn't ready).
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: settings }, { data: agents }] = await Promise.all([
    admin.from('autopilot_settings').select('*').eq('id', 1).single(),
    admin.from('ai_agents').select('*').order('id'),
  ]);
  const providers = AI_PROVIDERS.map((p) => ({ id: p.id, name: p.name, configured: p.isConfigured() }));

  return NextResponse.json({ settings, agents: agents ?? [], providers });
}

// POST: update the global settings only (enabled / review_window_minutes).
// Per-agent config goes through /api/admin/autopilot/agents instead.
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { enabled, review_window_minutes } = body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('autopilot_settings')
    .update({
      ...(enabled !== undefined && { enabled }),
      ...(review_window_minutes !== undefined && { review_window_minutes }),
    })
    .eq('id', 1)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
