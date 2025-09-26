'use client';

import SignOutButton from '../../components/SignOutButton';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import MuxPlayer from '@mux/mux-player-react';
import useEmblaCarousel from 'embla-carousel-react';

export const dynamic = 'force-dynamic';

type Video = {
  id: number;
  title: string;
  mux_playback_id: string;
  is_member_only: boolean;
  group_key: string;
};

type SubRow = {
  status: string | null;
  current_period_end: string | null;
} | null;

function ArrowBtn({ onClick, dir }: { onClick: () => void; dir: 'left'|'right' }) {
  const sideStyle: CSSProperties = dir === 'left' ? { left: '0.5rem' } : { right: '0.5rem' };
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
      className="absolute top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 hover:bg-black/70 focus:outline-none"
      style={sideStyle}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

function FilmCard({
  title,
  trailerPlaybackId,
  fullPlaybackId,
  isMember,
  lockedImage = '/members-only.png',
}: {
  title: string;
  trailerPlaybackId: string | null;
  fullPlaybackId: string | null;
  isMember: boolean;
  lockedImage?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: false, align: 'start' });

  // ✅ Always two slides:
  // Non-member:   [trailer, locked]
  // Member+full:  [trailer, full]
  const slides = useMemo(() => {
    const s: ('trailer'|'full'|'locked')[] = [];
    if (trailerPlaybackId) s.push('trailer');
    if (isMember && fullPlaybackId) s.push('full');
    else s.push('locked');
    return s;
  }, [trailerPlaybackId, fullPlaybackId, isMember]);

  return (
    <article className="border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-3">
        <h2 className="font-semibold">{title}</h2>
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((kind, idx) => (
              <div key={idx} className="min-w-0 flex-[0_0_100%]">
                <div className="relative w-full aspect-square bg-black">
                  {kind === 'trailer' && trailerPlaybackId && (
                    <>
                      <MuxPlayer
                        playbackId={trailerPlaybackId}
                        streamType="on-demand"
                        autoPlay={false}
                        muted
                        preload="metadata"
                        style={{ width: '100%', height: '100%' }}
                      />
                      <span className="absolute top-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                        Trailer
                      </span>
                    </>
                  )}

                  {kind === 'full' && fullPlaybackId && (
                    <>
                      <MuxPlayer
                        playbackId={fullPlaybackId}
                        streamType="on-demand"
                        autoPlay={false}
                        muted
                        preload="metadata"
                        style={{ width: '100%', height: '100%' }}
                      />
                      <span className="absolute top-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                        Full (Members)
                      </span>
                    </>
                  )}

                  {kind === 'locked' && (
                    <div className="w-full h-full relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lockedImage}
                        alt="Members only"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 grid place-items-center">
                        <div className="text-center space-y-2">
                          <p className="text-white text-sm">Members only</p>
                          <a
                            href="/pricing"
                            className="inline-block bg-white text-black text-sm font-medium px-3 py-2 rounded"
                          >
                            Subscribe to watch
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <ArrowBtn onClick={() => emblaApi?.scrollPrev()} dir="left" />
            <ArrowBtn onClick={() => emblaApi?.scrollNext()} dir="right" />
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="flex gap-1 justify-center py-3">
          {slides.map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-black/20" />
          ))}
        </div>
      )}
    </article>
  );
}

export default function VideosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sub, setSub] = useState<SubRow>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('id,title,mux_playback_id,is_member_only,group_key')
        .order('created_at', { ascending: false });
      if (!error && data) setVideos(data as Video[]);
      setLoading(false);
    })();
  }, []);

  const isMember =
    !!sub &&
    ['active', 'trialing'].includes(sub?.status ?? '') &&
    (!sub?.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());

  const groups = useMemo(() => {
    const map = new Map<string, Video[]>();
    for (const v of videos) {
      const arr = map.get(v.group_key) ?? [];
      arr.push(v);
      map.set(v.group_key, arr);
    }
    return map;
  }, [videos]);

  function displayTitle(list: Video[]): string {
    const trailer = list.find(v => !v.is_member_only);
    return trailer?.title ?? list[0]?.title ?? 'Untitled';
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-sm opacity-70">
            {isMember
              ? 'Swipe: trailer → full (members)'
              : 'Swipe: trailer → members-only preview'}
          </p>
        </div>
        <div className="flex gap-3">
          {!user && <a className="underline" href="/login">Sign in</a>}
          {!isMember && <a className="underline" href="/pricing">Subscribe</a>}
	  {user && <SignOutButton />}
        </div>
      </header>

      {loading && <p>Loading…</p>}
      {!loading && groups.size === 0 && (
        <p>No videos yet. Add rows in Supabase → Table Editor → public.videos.</p>
      )}

      <section className="grid grid-cols-1 gap-6">
        {[...groups.entries()].map(([key, list]) => {
          const trailer = list.find(v => !v.is_member_only) ?? null;
          const full = list.find(v => v.is_member_only) ?? null;
          return (
            <FilmCard
              key={key}
              title={displayTitle(list)}
              trailerPlaybackId={trailer?.mux_playback_id ?? null}
              fullPlaybackId={full?.mux_playback_id ?? null}
              isMember={isMember}
              lockedImage="/members-only.png"
            />
          );
        })}
      </section>
    </main>
  );
}
