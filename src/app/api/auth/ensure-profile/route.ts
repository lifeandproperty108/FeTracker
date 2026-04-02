import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profile) {
    return NextResponse.json({ role: profile.role })
  }

  // Create profile for first-time OAuth user
  const { data: newProfile } = await admin
    .from('users')
    .insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
      role: 'super_admin',
      organization_id: null,
    })
    .select('role')
    .single()

  return NextResponse.json({ role: newProfile?.role || 'super_admin' })
}
