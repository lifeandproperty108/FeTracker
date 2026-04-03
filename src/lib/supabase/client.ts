import { createBrowserClient } from '@supabase/ssr'
import { getBrowserClientOptions } from './browser-client-options'
import { getBrowserSupabasePublicConfig } from './config'

export function createClient() {
  const config = getBrowserSupabasePublicConfig()

  return createBrowserClient(
    config.url,
    config.anonKey,
    getBrowserClientOptions()
  )
}
