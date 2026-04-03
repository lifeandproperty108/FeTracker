export function resolveSupabasePublicConfig(
  env: Record<string, string | undefined>
) {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public configuration')
  }

  return { url, anonKey }
}

export function getServerSupabasePublicConfig() {
  return resolveSupabasePublicConfig(process.env)
}

export function getBrowserSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public configuration')
  }

  return { url, anonKey }
}
