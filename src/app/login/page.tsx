'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMsg('Magic link sent. Check your email and click the link to sign in.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function handleTwitter() {
    setErr(null);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter', // X is still 'twitter' in Supabase
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErr(error.message);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={sending}
          className="border rounded px-4 py-2"
        >
          {sending ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <span className="text-sm opacity-70">or</span>
        <button onClick={handleTwitter} className="border rounded px-4 py-2">
          Continue with X (Twitter)
        </button>
      </div>

      {msg && <p className="text-green-700">{msg}</p>}
      {err && <p className="text-red-600">Error: {err}</p>}
    </main>
  );
}
