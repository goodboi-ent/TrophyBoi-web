'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // store username in user_metadata so we can read it on callback
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    // If your project requires email confirmation, Supabase returns no session.
    // Show "check your email". Otherwise you'll be redirected by /auth/callback.
    setMsg('Check your email to confirm your account. After you click the link, we’ll finish signing you in.');
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border rounded w-full p-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input className="border rounded w-full p-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        <input className="border rounded w-full p-2" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        <button className="border rounded px-3 py-2" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>

      {msg && <p className="text-sm opacity-80">{msg}</p>}

      <hr className="my-4" />

      <button
        className="border rounded px-3 py-2"
        onClick={async () => {
          await supabase.auth.signInWithOAuth({
            provider: 'twitter',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
        }}
      >
        Continue with X (Twitter)
      </button>
    </main>
  );
}