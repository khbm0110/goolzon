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
// this interface. `mock-auth.ts` is a temporary, browser-only stand-in
// for local UI development. It is NOT secure and must never be used
// with real user data — it exists only so pages/components can be
// built and tested before Appwrite Auth is wired in as the last step.
export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }>;
  signUp(name: string, username: string, email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }>;
  signOut(): Promise<void>;
  onChange(callback: (user: AuthUser | null) => void): () => void;
}
