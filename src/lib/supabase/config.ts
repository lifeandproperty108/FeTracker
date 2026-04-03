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

export function resolveSupabaseAdminConfig(
  env: Record<string, string | undefined>
) {
  const { url } = resolveSupabasePublicConfig(env)
  const adminKey =
    env.SUPABASE_SECRET_KEY ??
    env.SUPABASE_SERVICE_ROLE_KEY

  if (!adminKey) {
    throw new Error('Missing Supabase admin configuration')
  }

  return { url, adminKey }
}

export function getServerSupabasePublicConfig() {
  return resolveSupabasePublicConfig(process.env)
}

export function getServerSupabaseAdminConfig() {
  return resolveSupabaseAdminConfig(process.env)
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
