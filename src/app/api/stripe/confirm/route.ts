import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

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

    const currentPeriodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

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
