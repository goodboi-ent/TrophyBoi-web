'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setSending(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username },
      },
    });

    setSending(false);
    if (error) return setErr(error.message);

    if (!data.session) {
      setMsg('Check your email to confirm your account. After you click the link, we’ll finish signing you in.');
      return;
    }

    const user = data.user;
    if (user) {
      await supabase.from('profiles').upsert({ user_id: user.id, username });
    }
    window.location.href = '/auth/callback';
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create account</h1>
      <form onSubmit={signUp} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email</span>
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input type="password" required value={pw} onChange={e=>setPw(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </label>
        <label className="block">
          <span className="text-sm">Username</span>
          <input type="text" required value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </label>
        <button type="submit" disabled={sending} className="border rounded px-4 py-2">
          {sending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      {msg && <p className="text-green-700">{msg}</p>}
      {err && <p className="text-red-600">Error: {err}</p>}
      <p className="text-sm">Already have an account? <a className="underline" href="/login">Log in</a></p>
    </main>
  );
}
