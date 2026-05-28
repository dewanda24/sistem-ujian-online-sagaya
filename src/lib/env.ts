const requiredServerEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export type RequiredServerEnvKey = (typeof requiredServerEnv)[number];

export function getEnvStatus() {
  return requiredServerEnv.map((key) => ({
    key,
    configured: Boolean(process.env[key]),
  }));
}

export function assertRequiredEnv() {
  const missing = getEnvStatus()
    .filter((item) => !item.configured)
    .map((item) => item.key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
