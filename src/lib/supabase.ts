import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set (see .env.example)",
  );
}

/**
 * The one Supabase client. Reads and writes go straight to Supabase under RLS
 * (CLAUDE.md stack). The session is kept on the phone, so reopening the app
 * stays signed in.
 */
export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
