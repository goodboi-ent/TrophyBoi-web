import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function POST(req: Request) {
  try {
    const { priceId, email, userId } = await req.json();
    if (!priceId || !email || !userId) {
      return NextResponse.json({ error: 'Missing priceId, email, or userId' }, { status: 400 });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: { user_id: userId },
    });
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Checkout error' }, { status: 500 });
  }
}

export function GET() {
  // Helpful for testing route existence via browser: should return 405, not 404
  return NextResponse.json({ error: 'Use POST' }, { status: 405 });
}
