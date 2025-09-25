'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabaseClient';

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
      // 1) If the provider sent tokens in the hash (/#access_token=...), set the session
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hp = new URLSearchParams(hash);
        const access_token = hp.get('access_token');
        const refresh_token = hp.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          // Clean the URL (remove the hash)
          window.history.replaceState({}, '', window.location.pathname);
          if (error) {
            router.replace('/login?error=callback-hash');
            return;
          }
        }
      }

      // 2) If using PKCE (?code=...), exchange for a session
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace('/login?error=callback-code');
          return;
        }
      }

      // 3) Confirm we have a user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?error=nouser');
        return;
      }

      // 4) Check latest subscription and route
      const { data } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', (user as User).id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle<SubRow>();

      const active = !!data
        && ['active','trialing'].includes(data.status ?? '')
        && (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now());

      router.replace(active ? '/videos' : '/pricing');
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
