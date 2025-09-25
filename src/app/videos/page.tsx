'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import MuxPlayer from '@mux/mux-player-react';

export const dynamic = 'force-dynamic';

type Video = {
  id: number;
  title: string;
  mux_playback_id: string;
  is_member_only: boolean;
};

type SubRow = {
  status: string | null;
  current_period_end: string | null;
} | null;

export default function VideosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sub, setSub] = useState<SubRow>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Load latest subscription row (for UI text/badges)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) { setSub(null); return; }
      const { data: row } = await supabase
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', u.id)
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle<SubRow>();
      setSub(row ?? null);
    })();
  }, []);

  // Load videos (RLS in Supabase filters rows based on membership)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('id,title,mux_playback_id,is_member_only')
        .order('created_at', { ascending: false });
      if (!error && data) setVideos(data as unknown as Video[]);
      setLoading(false);
    })();
  }, []);

  const active =
    !!sub &&
    ['active', 'trialing'].includes(sub?.status ?? '') &&
    (!sub?.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-sm opacity-70">
            {active
              ? 'Member access: full videos + trailers'
              : 'You’re seeing trailers & promos. Subscribe to watch full videos.'}
          </p>
        </div>
        <div className="flex gap-3">
          {!user && <a className="underline" href="/login">Sign in</a>}
          {!active && <a className="underline" href="/pricing">Subscribe</a>}
        </div>
      </header>

      {loading && <p>Loading…</p>}
      {!loading && videos.length === 0 && (
        <p>No videos yet. Add rows in Supabase → Table Editor → public.videos.</p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((v) => {
          const isMembersOnly = v.is_member_only;
          return (
            <article key={v.id} className="border rounded-xl overflow-hidden shadow-sm">
              <div className="relative">
                <MuxPlayer
                  playbackId={v.mux_playback_id}
                  streamType="on-demand"
                  autoPlay={false}
                  muted
                  style={{ aspectRatio: '16/9', width: '100%', height: 'auto' }}
                />
                {isMembersOnly && (
                  <span className="absolute top-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                    Members only
                  </span>
                )}
              </div>
              <div className="p-3">
                <h2 className="font-semibold">{v.title}</h2>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
