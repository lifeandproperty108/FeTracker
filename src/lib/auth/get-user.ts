import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { User } from '@/lib/types/database'

export async function getUser(): Promise<{ authUser: any; profile: User } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Use admin client to bypass RLS — super_admins have NULL organization_id
  // which causes RLS user_org_id() to return NULL, breaking the policy check
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  return { authUser: user, profile: profile as User }
}
