import { supabaseAuth } from './supabase-auth';
import type { AuthProvider } from './provider';

// Real Supabase Authentication.
export const auth: AuthProvider = supabaseAuth;
