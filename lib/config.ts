export function getEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

export function getSupabaseUrl() {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return getEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY"
  );
}

export function getSupabaseServiceKey() {
  return getEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
}

export function getAlibabaApiKey() {
  return getEnv("ALIBABA_API_KEY", "ALIBABA_APP_KEY", "ALIBABA_CLIENT_ID");
}

export function getAlibabaApiSecret() {
  return getEnv("ALIBABA_API_SECRET", "ALIBABA_APP_SECRET", "ALIBABA_CLIENT_SECRET");
}

export function getAlibabaBaseUrl() {
  return getEnv("ALIBABA_API_BASE", "ALIBABA_API_BASE_URL", "ALIBABA_BASE_URL");
}
