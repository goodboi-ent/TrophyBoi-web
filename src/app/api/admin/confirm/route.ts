import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  // Require a bearer secret so only you can call this endpoint
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== process.env.ADMIN_CONFIRM_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user_id } = await req.json().catch(() => ({}));
  if (!user_id || typeof user_id !== 'string') {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  // Force-confirm the user by id
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, user: { id: data.user?.id, email: data.user?.email } });
}
