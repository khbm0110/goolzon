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

// POST { id, enabled?, provider_id?, persona?, rss_sources?, default_category? }
// Partial update of one agent — every field optional so the admin UI
// can save a single toggle without resending the whole agent.
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { id, enabled, provider_id, persona, rss_sources, default_category } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ai_agents')
    .update({
      ...(enabled !== undefined && { enabled }),
      ...(provider_id !== undefined && { provider_id }),
      ...(persona !== undefined && { persona }),
      ...(rss_sources !== undefined && { rss_sources }),
      ...(default_category !== undefined && { default_category }),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}
