import { NextResponse } from 'next/server';

export function GET() {
  const reveal = (v?: string) => (v ? `${v.slice(0, 6)}…(${v.length})` : 'MISSING');

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE: reveal(process.env.SUPABASE_SERVICE_ROLE),
    STRIPE_SECRET_KEY: reveal(process.env.STRIPE_SECRET_KEY),
    NEXT_PUBLIC_PRICE_ID_15: process.env.NEXT_PUBLIC_PRICE_ID_15 || 'MISSING',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
    NODE_ENV: process.env.NODE_ENV
  });
}
