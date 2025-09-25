'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type SubRow = {
  status: string | null;
  current_period_end: string | null;
} | null;

export default function VideosPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    (async () => {
      // 1) get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        setIsSubscriber(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);

      // 2) fetch latest subscription row for this user
      const { data } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', user.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle<SubRow>();

      const activeStatuses = ['active', 'trialing'];
      const notExpired =
        !!data && (
          !data.current_period_end ||
          new Date(data.current_period_end).getTime() > Date.now()
        );

      setIsSubscriber(!!data && activeStatuses.includes(data.status ?? '') && notExpired);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <main className="max-w-3xl mx-auto p-6">Checking subscription…</main>;
  }

  if (!signedIn) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Members only</h1>
        <p>Please <a className="underline" href="/login">sign in</a> to continue.</p>
      </main>
    );
  }

  if (!isSubscriber) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Membership required</h1>
        <p>Please <a className="underline" href="/pricing">subscribe</a> to watch videos.</p>
      </main>
    );
  }

  // Subscriber view (placeholder grid for now)
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Videos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">
              <span>Thumbnail</span>
            </div>
            <h2 className="font-semibold">Placeholder Video #{i + 1}</h2>
            <p className="text-sm opacity-70">Coming soon…</p>
          </div>
        ))}
      </div>
    </main>
  );
}
