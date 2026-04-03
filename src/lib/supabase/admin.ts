import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from './config'

export function createAdminClient() {
  const config = getSupabasePublicConfig()

  return createClient(
    config.url,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
