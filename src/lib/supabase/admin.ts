import { createClient } from '@supabase/supabase-js'
import { getServerSupabaseAdminConfig } from './config'

export function createAdminClient() {
  const config = getServerSupabaseAdminConfig()

  return createClient(
    config.url,
    config.adminKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
