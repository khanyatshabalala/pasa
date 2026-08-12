/**
 * Supabase client — kept for any remaining non-auth Supabase usage during migration.
 * All auth and data calls now go through the Spring Boot backend via src/lib/api.ts.
 * This file will be removed once the migration is complete.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient<Database>(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_PUBLISHABLE_KEY || "placeholder",
  {
    auth: {
      storage: localStorage,
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
