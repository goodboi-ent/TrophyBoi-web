'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function sanitize(base: string) {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')  // only a-z 0-9 _
    .replace(/^_+|_+$/g, '')       // trim underscores
    .slice(0, 20) || 'user';
}

async function ensureUsername(userId: string, desiredRaw: string | null) {
  // Try to set username if the row exists but username is null
  const desired = sanitize(desiredRaw || '');
  if (!desired) return;

  let candidate = desired;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from('profiles')
      .upsert({ user_id: userId, username: candidate })
      .select('user_id')
      .maybeSingle();

    if (!error) return; // success

    // Handle duplicate username (unique index violation)
    const dup = /duplicate key value/i.test(error.message || '');
    if (!dup) return; // some other error; bail

    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = sanitize(`${desired}_${suffix}`);
  }
}

function deriveUsernameFromMeta(u: User) {
  const m: any = u.user_metadata || {};
  const cands = [
    m.username,
    m.preferred_username, // X often provides this
    m.user_name,          // sometimes
    m.screen_name,        // older
    (u.email ? u.email.split('@')[0] : null),
  ].filter(Boolean) as string[];
  return cands[0] || null;
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      // Handle hash tokens (OAuth providers that return tokens in hash)
      if (typeof window !== 'undefined' && window.location.hash) {
        const raw = window.location.hash.replace(/^#/, '');
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

      // Have session?
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login?error=nouser');

      // Ensure profile row exists (no-op if already there)
      await supabase.from('profiles').upsert({ user_id: user.id });

      // If username is missing, set it from metadata (X handle, etc.)
      const { data: prof } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prof?.username) {
        const desired = deriveUsernameFromMeta(user);
        await ensureUsername(user.id, desired);
      }

      // Route based on subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', user.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      const active = !!sub
        && ['active', 'trialing'].includes(sub?.status ?? '')
        && (!sub?.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

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
