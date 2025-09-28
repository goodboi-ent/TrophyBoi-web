'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // if you prefer alias, use: '@/lib/supabaseClient'
import MuxPlayer from '@mux/mux-player-react';

export const dynamic = 'force-dynamic';

type Video = {
  id: number;
  title: string;
  mux_playback_id: string;
  is_member_only: boolean;
};

export default function TrailersPage() {
  const [ageOk, setAgeOk] = useState<boolean>(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Age-gate check: cookie first, fallback to localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const hasCookie = document.cookie.includes('age_ok_v1=1');
      const hasLS = window.localStorage.getItem('age_ok_v1') === '1';
      setAgeOk(hasCookie || hasLS);
    }
  }, []);

  // Load trailers only (public)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('id,title,mux_playback_id,is_member_only')
        .eq('is_member_only', false)
        .order('id', { ascending: false });
      if (!error && data) setVideos(data as unknown as Video[]);
      setLoading(false);
    })();
  }, []);

  // Confirm age: set cookie via API and also set localStorage
  async function confirmAge() {
    try {
      await fetch('/api/age/confirm', { method: 'POST' });
    } catch {
      // ignore network errors; we'll still set LS so the UI proceeds
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('age_ok_v1', '1');
    }
    setAgeOk(true);
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trailers</h1>
          <p className="text-sm opacity-70">Watch previews. Subscribe to unlock full videos.</p>
        </div>
        <nav className="flex gap-3">
          <a className="underline" href="/login">Log in</a>
          <a className="underline" href="/pricing">Subscribe</a>
          <a className="underline" href="/videos">Members Gallery</a>
        </nav>
      </header>

      {/* Age Gate Overlay */}
      {!ageOk && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold">Age Verification</h2>
            <p>You must be 18+ to view trailers on this site.</p>
            <div className="flex gap-3">
              <button className="border rounded px-4 py-2" onClick={confirmAge}>
                I am 18 or older
              </button>
              <a className="underline px-4 py-2" href="/">Leave</a>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Loading…</p>}
      {!loading && videos.length === 0 && <p>No trailers yet.</p>}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((v) => (
          <article key={v.id} className="border rounded-xl overflow-hidden shadow-sm">
            <MuxPlayer
              playbackId={v.mux_playback_id}
              streamType="on-demand"
              autoPlay={false}
              muted
              style={{ aspectRatio: '16/9', width: '100%', height: 'auto' }}
            />
            <div className="p-3">
              <h2 className="font-semibold">{v.title}</h2>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
