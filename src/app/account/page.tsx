'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

/** Tell Next this page is dynamic (don't prerender it) */
export const dynamic = 'force-dynamic';

type SubRow = {
  status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
} | null;

function AccountContent() {
  const sp = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [sub, setSub] = useState<SubRow>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  // Load the current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // If returning from Stripe (/account?session_id=...), confirm once
  useEffect(() => {
    const sessionId = sp.get('session_id');
    if (!sessionId) return;

    (async () => {
      try {
        const r = await fetch(`/api/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`);
        const data: { ok?: boolean; status?: string; error?: string } = await r.json();
        if (!r.ok) throw new Error(data.error || 'confirm failed');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setConfirmErr(msg);
      }
    })();
  }, [sp]);

  // Load latest subscription row for this user
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      const { data: row } = await supabase
        .from('subscriptions')
        .select('status,current_period_end,stripe_customer_id')
        .eq('user_id', u.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle<SubRow>();
      setSub(row ?? null);
    })();
  }, []);

  const email = user?.email ?? user?.id ?? 'Unknown user';
  const active =
    !!sub &&
    ['active', 'trialing'].includes(sub.status ?? '') &&
    (!sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

  async function openBillingPortal() {
    if (!sub?.stripe_customer_id) {
      alert('No billing record found yet.');
      return;
    }
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: sub.stripe_customer_id }),
    });
    const data: { url?: string; error?: string } = await res.json();
    if (data.url) location.href = data.url;
    else alert(data.error || 'Could not open billing portal');
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-6">
        <p>Not signed in. <a className="underline" href="/login">Go to login</a></p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Account</h1>
      <p>Signed in as <strong>{email}</strong></p>
      {confirmErr && <p className="text-red-600">Confirm error: {confirmErr}</p>}

      {active ? (
        <>
          <p>Subscription status: <strong>{sub?.status}</strong></p>
          <div className="flex gap-2">
            <a className="underline" href="/videos">Go to Videos</a>
            <button className="border rounded px-3 py-2" onClick={openBillingPortal}>
              Manage billing
            </button>
          </div>
        </>
      ) : (
        <>
          <p>No active subscription.</p>
          <a className="underline" href="/pricing">Subscribe</a>
        </>
      )}

      <button
        className="border rounded px-3 py-2"
        onClick={() => supabase.auth.signOut().then(() => (location.href = '/'))}
      >
        Sign out
      </button>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={<main className="max-w-md mx-auto p-6">Loading account…</main>}
    >
      <AccountContent />
    </Suspense>
  );
}
