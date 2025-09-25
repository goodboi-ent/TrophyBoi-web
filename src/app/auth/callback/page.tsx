'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabaseClient';

/** Do not prerender this page */
export const dynamic = 'force-dynamic';

type SubRow = {
  status: string | null;
  current_period_end: string | null;
} | null;

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      // 1) exchange code for a session (expects a string)
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace('/login?error=callback');
          return;
        }
      }

      // 2) fetch user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?error=nouser');
        return;
      }

      // 3) check subscription and route accordingly
      const { data } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', (user as User).id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle<SubRow>();

      const activeStatuses = ['active', 'trialing'];
      const notExpired =
        !!data && (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now());
      const isSubscriber = !!data && activeStatuses.includes(data.status ?? '') && notExpired;

      router.replace(isSubscriber ? '/videos' : '/pricing');
    })();
  }, [router, searchParams]);

  return <main className="max-w-md mx-auto p-6">Signing you in…</main>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<main className="max-w-md mx-auto p-6">Loading…</main>}>
      <CallbackInner />
    </Suspense>
  );
}
