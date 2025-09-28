import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // 1 year cookie
  res.headers.append('Set-Cookie', 'age_ok_v1=1; Max-Age=31536000; Path=/; SameSite=Lax; Secure');
  return res;
}
