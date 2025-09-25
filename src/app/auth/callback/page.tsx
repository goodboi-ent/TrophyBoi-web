'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      // 1) exchange code from magic link for a session
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession({ code });
        if (error) return router.replace('/login?error=callback');
      }

      // 2) get the user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login?error=nouser');

      // 3) check latest subscription
      const { data } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', user.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      const activeStatuses = ['active','trialing'];
      const notExpired = data && (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now());
      const isSubscriber = !!data && activeStatuses.includes(data.status) && notExpired;

      router.replace(isSubscriber ? '/videos' : '/pricing');
    };
    run();
  }, [router, searchParams]);

  return <main className="max-w-md mx-auto p-6">Signing you in…</main>;
}
