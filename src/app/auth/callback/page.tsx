'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

type SubRow = { status: string | null; current_period_end: string | null } | null;
type UserMeta = { username?: string } | null | undefined;

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      // Handle providers that return tokens in the hash
      if (typeof window !== 'undefined' && window.location.hash) {
        const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const hp = new URLSearchParams(raw);
        const access_token = hp.get('access_token');
        const refresh_token = hp.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          window.history.replaceState({}, '', window.location.pathname);
          if (error) return router.replace('/login?error=callback-hash');
        }
      }

      // Handle PKCE code flow (?code=...)
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return router.replace('/login?error=callback-code');
      }

      // We should have a session now
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login?error=nouser');

      // Ensure a profiles row exists
      const meta = user.user_metadata as UserMeta;
      const desiredUsername = (meta && typeof meta.username === 'string') ? meta.username : null;
      await supabase.from('profiles').upsert({ user_id: user.id, username: desiredUsername });

      // Route based on subscription
      const { data } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', (user as User).id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle<SubRow>();

      const active = !!data
        && ['active','trialing'].includes(data?.status ?? '')
        && (!data?.current_period_end || new Date(data.current_period_end).getTime() > Date.now());

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
