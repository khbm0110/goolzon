'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Shared by /login and /register — same two buttons, same handler.
// Requires the Google/Facebook providers to actually be turned on in
// Supabase (Authentication → Providers) with real OAuth client
// credentials from Google Cloud Console / Facebook Developers; the
// button itself works regardless, it'll just show Supabase's own
// "provider is not enabled" error until that's done.
export default function OAuthButtons() {
  const { signInWithOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);

  async function handleClick(provider: 'google' | 'facebook') {
    setError(null);
    setLoadingProvider(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setError(error);
      setLoadingProvider(null);
    }
    // On success the browser navigates away to the provider's login
    // page, so there's nothing else to do here.
  }

  return (
    <div>
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-xs text-[var(--fg-faint)]">أو</span>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleClick('google')}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2 border border-[var(--border)] hover:bg-[var(--bg-surface-2)] rounded-lg py-2.5 text-sm font-bold text-[var(--fg)] transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16 3 9 7.6 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.4 26.7 37 24 37c-5.3 0-9.6-3.4-11.3-8l-6.5 5C9 41.3 16 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C39.9 36.9 43 31.3 43 24c0-1.4-.1-2.7-.4-3.5z" />
          </svg>
          {loadingProvider === 'google' ? '...' : 'جوجل'}
        </button>
        <button
          type="button"
          onClick={() => handleClick('facebook')}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2 border border-[var(--border)] hover:bg-[var(--bg-surface-2)] rounded-lg py-2.5 text-sm font-bold text-[var(--fg)] transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
          </svg>
          {loadingProvider === 'facebook' ? '...' : 'فيسبوك'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
    </div>
  );
}
