import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { suggestClubInfoFromWikipedia } from '@/lib/services/wikipedia';
import { getErrorMessage } from '@/lib/utils/errors';

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

// GET /api/admin/club-suggest?name=الهلال
// Draft-only helper for ClubEditor — never writes anything, the admin
// reviews/edits before saving.
export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'اكتب اسم النادي أولاً' }, { status: 400 });
  }

  try {
    const suggestion = await suggestClubInfoFromWikipedia(name.trim());
    return NextResponse.json({ suggestion });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e, 'تعذّر جلب الاقتراح') }, { status: 502 });
  }
}
