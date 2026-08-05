import { supabaseProvider } from './supabase-provider';
import type { DataProvider } from './provider';

// Real Supabase-backed data provider — every page/component only ever
// imports `data` from this one file, never talks to Supabase directly.
export const data: DataProvider = supabaseProvider;
