'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ForgotPwPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) setErr(error.message);
    else setMsg('Check your email for a reset link.');
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reset password</h1>
      <form onSubmit={sendReset} className="space-y-3">
        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded p-2" placeholder="you@example.com" />
        <button className="border rounded px-4 py-2">Send reset email</button>
      </form>
      {msg && <p className="text-green-700">{msg}</p>}
      {err && <p className="text-red-600">{err}</p>}
    </main>
  );
}
