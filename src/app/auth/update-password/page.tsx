'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function UpdatePwPage() {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function updatePw(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setErr(error.message);
    else setMsg('Password updated. You can close this tab and log in.');
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Set new password</h1>
      <form onSubmit={updatePw} className="space-y-3">
        <input type="password" required value={pw} onChange={e=>setPw(e.target.value)} className="w-full border rounded p-2" placeholder="New password" />
        <button className="border rounded px-4 py-2">Update password</button>
      </form>
      {msg && <p className="text-green-700">{msg}</p>}
      {err && <p className="text-red-600">{err}</p>}
    </main>
  );
}
