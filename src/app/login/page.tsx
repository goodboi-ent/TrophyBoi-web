'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pwEmail, setPwEmail] = useState('');
  const [pw, setPw] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function signInMagic(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (error) setErr(error.message);
    else setMsg('Magic link sent. Check your email.');
  }

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setSending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: pwEmail,
      password: pw,
    });
    setSending(false);
    if (error) setErr(error.message);
    else window.location.href = '/auth/callback';
  }

  async function signInTwitter() {
    setErr(null); setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={signInMagic} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email (magic link)</span>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1 w-full border rounded p-2" />
        </label>
        <button type="submit" disabled={sending} className="border rounded px-4 py-2">
          {sending ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      <div className="text-sm opacity-60">or</div>

      <button onClick={signInTwitter} className="border rounded px-4 py-2">
        Continue with X (Twitter)
      </button>

      <div className="text-sm opacity-60">or</div>

      <form onSubmit={signInPassword} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email</span>
          <input type="email" value={pwEmail} onChange={e=>setPwEmail(e.target.value)} required className="mt-1 w-full border rounded p-2" />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required className="mt-1 w-full border rounded p-2" />
        </label>
        <button type="submit" disabled={sending} className="border rounded px-4 py-2">
          {sending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {msg && <p className="text-green-700">{msg}</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      <p className="text-sm">
        Don't have an account? <a className="underline" href="/signup">Create one</a>
      </p>
    </main>
  );
}
