'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

export default function PricingPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user as User | null;
      setEmail(u?.email ?? null);
      setUserId(u?.id ?? null);
    });
  }, []);

  async function subscribe() {
    if (!email || !userId) {
      alert('Please sign in first.');
      location.href = '/login';
      return;
    }
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: process.env.NEXT_PUBLIC_PRICE_ID_15,
        email,
        userId,
      }),
    });
    const data: { url?: string; error?: string } = await res.json();
    setLoading(false);
    if (data.url) location.href = data.url;
    else alert(data.error || 'Checkout error');
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Choose your plan</h1>
      <p>$15/month</p>
      <button className="border rounded px-4 py-2" onClick={subscribe} disabled={loading}>
        {loading ? 'Redirecting…' : 'Subscribe $15/mo'}
      </button>
    </main>
  );
}
