import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types/database'

export async function getUser(): Promise<{ authUser: any; profile: User } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  return { authUser: user, profile: profile as User }
}
