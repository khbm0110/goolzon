import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const email = body?.email?.trim();
  const message = body?.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'الرجاء تعبئة جميع الحقول.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'البريد الإلكتروني غير صالح.' }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'الخدمة غير متاحة حالياً، حاول لاحقاً.' }, { status: 503 });
  }

  const { error } = await admin.from('contact_messages').insert({ name, email, message });
  if (error) {
    return NextResponse.json({ error: 'تعذّر إرسال رسالتك، حاول لاحقاً.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
