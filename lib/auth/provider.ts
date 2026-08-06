export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  joinDate?: string;
}

// Same idea as lib/data/provider.ts: the whole app only ever talks to
// this interface. `supabase-auth.ts` is the one real implementation,
// backed by Supabase Auth + the `profiles` table.
export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }>;
  signUp(name: string, username: string, email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }>;
  // Redirects the browser to the provider's own login page, then back
  // to /auth/callback — there's no user/error to return here directly,
  // the callback route is what actually creates the session.
  signInWithOAuth(provider: 'google' | 'facebook'): Promise<{ error: string | null }>;
  signOut(): Promise<void>;
  onChange(callback: (user: AuthUser | null) => void): () => void;
}
