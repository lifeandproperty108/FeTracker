import { createClient } from '@supabase/supabase-js'
import { getServerSupabasePublicConfig } from './config'

export function createAdminClient() {
  const config = getServerSupabasePublicConfig()

  return createClient(
    config.url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
