'use client';
import { supabase } from '@/lib/supabaseClient';

export default function LinkXButton() {
  return (
    <button
      className="border rounded px-3 py-2"
      onClick={async () => {
        await supabase.auth.linkIdentity({
          provider: 'twitter',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
      }}
    >
      Connect X (Twitter)
    </button>
  );
}

