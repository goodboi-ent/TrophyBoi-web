'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto p-4 flex gap-4 items-center">
        <a href="/trailers" className="font-bold text-lg">TrophyBoi</a>
        <nav className="flex gap-4 ml-auto">
          <a className="underline" href="/trailers">Trailers</a>
          <a className="underline" href="/videos">Members Gallery</a>
          <a className="underline" href="/pricing">Pricing</a>
          {signedIn ? (
            <a className="underline" href="/account/profile">Profile</a>
          ) : (
            <a className="underline" href="/login">Log in</a>
          )}
        </nav>
      </div>
    </header>
  );
}
