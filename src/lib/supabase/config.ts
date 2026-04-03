export function resolveSupabasePublicConfig(
  env: Record<string, string | undefined>
) {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public configuration')
  }

  return { url, anonKey }
}

export function getSupabasePublicConfig() {
  return resolveSupabasePublicConfig(process.env)
}
