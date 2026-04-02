import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { token, email, password, fullName, role, organizationId } = await request.json()

  const supabase = createAdminClient()

  // Verify invitation is still valid
  const { data: invitation, error: invError } = await supabase
    .from('pending_invitations')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single()

  if (invError || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert into users table
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    role,
    organization_id: organizationId,
  })

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  // Mark invitation as accepted
  await supabase
    .from('pending_invitations')
    .update({ accepted: true })
    .eq('id', invitation.id)

  return NextResponse.json({ success: true })
}
