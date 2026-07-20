import { createClient } from '@/lib/supabase/client';
import type { AuthProvider, AuthUser } from './provider';

// Real authentication backed by Supabase Auth + the `profiles` table
// (see supabase/schema.sql — a profile row is auto-created via trigger
// whenever a new auth user signs up). This file is the only thing that
// changed to go from the mock-auth dev mode to a real backend — every
// page/component using useAuth() needed zero changes.

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    username: data.username,
    email: data.email,
    avatar: data.avatar,
    role: data.role,
    joinDate: data.join_date,
  };
}

export const supabaseAuth: AuthProvider = {
  async getCurrentUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return fetchProfile(user.id);
  },

  async signIn(email, password) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    const profile = data.user ? await fetchProfile(data.user.id) : null;
    return { user: profile, error: null };
  },

  async signUp(name, username, email, password) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username } }, // read by the handle_new_user() trigger
    });
    if (error) return { user: null, error: error.message };
    // The profiles row is created by the DB trigger; give it a moment to land.
    const profile = data.user ? await fetchProfile(data.user.id) : null;
    return { user: profile, error: null };
  },

  async signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  },

  onChange(callback) {
    const supabase = createClient();
    // Fire once immediately with the current session.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchProfile(user.id).then(callback);
      else callback(null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id).then(callback);
      else callback(null);
    });

    return () => listener.subscription.unsubscribe();
  },
};
