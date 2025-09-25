import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

type PortalRequest = { customerId?: string };
type PortalResponse = { url?: string; error?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PortalRequest;
    if (!body.customerId) return NextResponse.json<PortalResponse>({ error: 'Missing customerId' }, { status: 400 });

    const session = await stripe.billingPortal.sessions.create({
      customer: body.customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account`,
    });

    return NextResponse.json<PortalResponse>({ url: session.url }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json<PortalResponse>({ error: msg }, { status: 500 });
  }
}
