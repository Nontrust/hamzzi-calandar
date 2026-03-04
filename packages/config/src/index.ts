export type RuntimeTarget = "client" | "server";

export interface RuntimeConfig {
  target: RuntimeTarget;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  openAiApiKey?: string;
  googleClientEmail?: string;
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(target: RuntimeTarget): RuntimeConfig {
  const supabaseUrl = required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = required("EXPO_PUBLIC_SUPABASE_ANON_KEY", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  if (target === "client") {
    return {
      target,
      supabaseUrl,
      supabaseAnonKey
    };
  }

  return {
    target,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    openAiApiKey: required("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    googleClientEmail: required("GOOGLE_CLIENT_EMAIL", process.env.GOOGLE_CLIENT_EMAIL)
  };
}