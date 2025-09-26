'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // Move hash to /auth/callback so our handler can set the session
      window.location.replace(`/auth/callback${window.location.hash}`);
    }
  }, []);
  // Your landing content can go here; keep it simple for now
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">TrophyBoi</h1>
      <p className="opacity-70">Welcome. <a className="underline" href="/login">Log in</a> or <a className="underline" href="/pricing">Subscribe</a>.</p>
    </main>
  );
}
