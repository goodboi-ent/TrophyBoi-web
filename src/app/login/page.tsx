'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loginWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) alert(error.message);
    else setSent(true);
  }

  async function loginWithX() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter', // X is still 'twitter' in Supabase
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>

      <button className="border rounded px-4 py-2 w-full" onClick={loginWithX}>
        Continue with X (Twitter)
      </button>

      <div className="opacity-60 text-center">— or —</div>

      {sent ? (
        <p>Check your email for the magic link.</p>
      ) : (
        <form onSubmit={loginWithEmail} className="space-y-3">
          <input
            className="border rounded w-full p-2"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <button className="border rounded px-4 py-2 w-full" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}
    </main>
  );
}
