import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

function requireConfig(key: string | undefined, name: string) {
  if (!key) throw new Error(`Missing ${name}. Configure Supabase environment variables.`);
  return key;
}

export function getSupabasePublic() {
  return createClient(requireConfig(url, "NEXT_PUBLIC_SUPABASE_URL"), requireConfig(publishableKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseAdmin() {
  return createClient(requireConfig(url, "NEXT_PUBLIC_SUPABASE_URL"), requireConfig(secretKey, "SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
