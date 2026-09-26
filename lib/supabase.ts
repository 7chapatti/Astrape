import { createClient } from "@supabase/supabase-js";

// Fill these in from your Supabase project settings (Settings → API),
// and put the real values in .env.local — see .env.local.example.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Falls back to harmless placeholder values when the real env vars aren't
// set yet, so pages that import this don't crash before Supabase is wired
// up. Callers should check `supabaseConfigured` before actually using it.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
