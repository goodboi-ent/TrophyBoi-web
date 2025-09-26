'use client';

import { supabase } from '../lib/supabaseClient';
import type { ReactNode } from 'react';

export default function SignOutButton({
  className = 'border rounded px-3 py-2',
  children,
}: { className?: string; children?: ReactNode }) {
  async function handleClick() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }
  return (
    <button onClick={handleClick} className={className}>
      {children ?? 'Sign out'}
    </button>
  );
}
