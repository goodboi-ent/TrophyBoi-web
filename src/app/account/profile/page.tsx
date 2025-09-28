'use client';

import SignOutButton from '../../../components/SignOutButton';
import LinkXButton from '../../../components/LinkXButton'; // <-- add this
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUser(u);
      if (!u) return;
      // ensure row exists locally (RLS insert-own allows this)
      await supabase.from('profiles').upsert({ user_id: u.id });
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id,username,display_name,avatar_url')
        .eq('user_id', u.id)
        .maybeSingle<Profile>();
      setP(prof ?? null);
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !p) return;
    setErr(null); setMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      })
      .eq('user_id', user.id);
    if (error) setErr(error.message);
    else setMsg('Saved.');
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) setErr(error.message);
    else setMsg('Password updated.');
    setNewPw('');
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-6">
        Not signed in. <a className="underline" href="/login">Log in</a>
      </main>
    );
  }
  if (!p) {
    return <main className="max-w-md mx-auto p-6">Loading…</main>;
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      {/* Actions under the heading */}
      <div className="flex items-center gap-3">
        <SignOutButton />
        <LinkXButton /> {/* <-- here's the X linking button */}
      </div>

      <form onSubmit={saveProfile} className="space-y-3">
        <label className="block">
          <span className="text-sm">Username</span>
          <input
            value={p.username ?? ''}
            onChange={e => setP({ ...(p as Profile), username: e.target.value })}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm">Display name</span>
          <input
            value={p.display_name ?? ''}
            onChange={e => setP({ ...(p as Profile), display_name: e.target.value })}
            className="mt-1 w-full border rounded p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm">Avatar URL</span>
          <input
            value={p.avatar_url ?? ''}
            onChange={e => setP({ ...(p as Profile), avatar_url: e.target.value })}
            className="mt-1 w-full border rounded p-2"
            placeholder="https://…"
          />
        </label>
        <button type="submit" className="border rounded px-4 py-2">Save profile</button>
      </form>

      <form onSubmit={changePassword} className="space-y-3">
        <label className="block">
          <span className="text-sm">New password</span>
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            required
          />
        </label>
        <button type="submit" className="border rounded px-4 py-2">Change password</button>
      </form>

      {msg && <p className="text-green-700">{msg}</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      <div><a className="underline" href="/account">Back to account</a></div>
    </main>
  );
}

