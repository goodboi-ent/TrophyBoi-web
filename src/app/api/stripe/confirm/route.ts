import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Some Stripe SDK versions don't expose `current_period_end` in their TS defs.
// Narrow the type to include it (optional).
type SubWithPeriod = Stripe.Subscription & { current_period_end?: number };

type ConfirmResponse = { ok?: true; status?: string; error?: string };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return NextResponse.json<ConfirmResponse>({ error: 'Missing session_id' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });

    const sub = session.subscription as Stripe.Subscription | null;
    const meta = session.metadata as Record<string, string> | null;
    const userId = meta?.user_id;

    if (!sub || !userId) {
      return NextResponse.json<ConfirmResponse>({ error: 'Missing subscription or user metadata' }, { status: 400 });
    }

    // Safely read current_period_end if available
    const s = sub as SubWithPeriod;
    const currentPeriodEnd =
      s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null;

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: String(session.customer),
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_end: currentPeriodEnd,
        },
        { onConflict: 'stripe_subscription_id' }
      );

    if (error) throw new Error(error.message);

    return NextResponse.json<ConfirmResponse>({ ok: true, status: sub.status }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<ConfirmResponse>({ error: msg }, { status: 500 });
  }
}
