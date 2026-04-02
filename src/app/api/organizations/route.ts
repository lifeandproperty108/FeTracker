import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function GET() {
  const result = await getUser()
  if (!result || result.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const result = await getUser()
  if (!result || result.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { name, slug, contact_email } = await request.json()

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check for duplicate slug
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'An organization with this slug already exists' }, { status: 409 })
  }

  // Create the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  // If a contact email was provided, create an invitation for org_admin
  if (contact_email) {
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: invError } = await supabase.from('pending_invitations').insert({
      email: contact_email,
      organization_id: org.id,
      role: 'org_admin',
      token,
      expires_at: expiresAt.toISOString(),
    })

    if (invError) {
      // Org was created but invitation failed -- return org with warning
      return NextResponse.json(
        { ...org, warning: `Organization created but invitation failed: ${invError.message}` },
        { status: 201 }
      )
    }
  }

  return NextResponse.json(org, { status: 201 })
}
