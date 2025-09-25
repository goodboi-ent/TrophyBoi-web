import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type CheckoutRequest = { priceId?: string; email?: string; userId?: string };
type CheckoutResponse = { url: string } | { error: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequest;

    const priceId = body.priceId ?? '';
    const email   = body.email   ?? '';
    const userId  = body.userId  ?? '';

    if (!priceId || !email || !userId) {
      return NextResponse.json<CheckoutResponse>({ error: 'Missing priceId, email, or userId' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: { user_id: userId },
    });

    return NextResponse.json<CheckoutResponse>({ url: session.url ?? '' }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<CheckoutResponse>({ error: msg }, { status: 500 });
  }
}
