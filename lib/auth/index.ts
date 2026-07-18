import { supabaseAuth } from './supabase-auth';
import type { AuthProvider } from './provider';

// Switched from mock-auth to real Supabase Authentication.
export const auth: AuthProvider = supabaseAuth;
