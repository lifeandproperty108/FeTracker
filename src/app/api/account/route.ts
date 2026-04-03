import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData

  // Fetch org name if user belongs to one
  let organizationName: string | null = null
  if (profile.organization_id) {
    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    organizationName = org?.name ?? null
  }

  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    organization_name: organizationName,
  })
}

export async function PATCH(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData
  const body = await request.json()
  const { full_name } = body as { full_name?: string }

  if (!full_name || !full_name.trim()) {
    return NextResponse.json(
      { error: 'Display name is required' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { error: updateError } = await admin
    .from('users')
    .update({ full_name: full_name.trim() })
    .eq('id', profile.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fetch org name for response
  let organizationName: string | null = null
  if (profile.organization_id) {
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    organizationName = org?.name ?? null
  }

  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    full_name: full_name.trim(),
    role: profile.role,
    organization_name: organizationName,
  })
}
