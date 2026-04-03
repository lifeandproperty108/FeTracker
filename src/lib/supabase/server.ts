import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabasePublicConfig } from './config'

export async function createClient() {
  const cookieStore = await cookies()
  const config = getServerSupabasePublicConfig()

  return createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
