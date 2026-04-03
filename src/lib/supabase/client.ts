import { createBrowserClient } from '@supabase/ssr'
import { getBrowserClientOptions } from './browser-client-options'
import { getSupabasePublicConfig } from './config'

export function createClient() {
  const config = getSupabasePublicConfig()

  return createBrowserClient(
    config.url,
    config.anonKey,
    getBrowserClientOptions()
  )
}
