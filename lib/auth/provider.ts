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
  signOut(): Promise<void>;
  onChange(callback: (user: AuthUser | null) => void): () => void;
}
