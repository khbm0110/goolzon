import { supabaseProvider } from './supabase-provider';
import type { DataProvider } from './provider';

// Switched from mock-provider to the real Supabase-backed provider.
// Every page/component kept working with zero changes because they
// only ever import `data` from this one file.
export const data: DataProvider = supabaseProvider;
