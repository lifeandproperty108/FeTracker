import { createBrowserClient } from '@supabase/ssr'

export function getBrowserClientOptions() {
  return {
    auth: {
      detectSessionInUrl: false,
    },
  }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    getBrowserClientOptions()
  )
}
