import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSelectedOrgId } from '@/lib/org-switcher'

export async function GET() {
  const result = await getUser()
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = result
  const isSuperAdmin = profile.role === 'super_admin'

  if (!isSuperAdmin && profile.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null
  const orgId = selectedOrgId ?? profile.organization_id

  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, require_photo_on_failure')
    .eq('id', orgId)
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json(org)
}

export async function PATCH(request: NextRequest) {
  const result = await getUser()
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = result
  const isSuperAdmin = profile.role === 'super_admin'

  if (!isSuperAdmin && profile.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null
  const orgId = selectedOrgId ?? profile.organization_id

  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const body = await request.json()

  const allowedFields = ['name', 'require_photo_on_failure', 'logo_url']
  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Validate name if provided
  if ('name' in updates && (typeof updates.name !== 'string' || updates.name.trim().length === 0)) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Validate require_photo_on_failure if provided
  if ('require_photo_on_failure' in updates && typeof updates.require_photo_on_failure !== 'boolean') {
    return NextResponse.json({ error: 'require_photo_on_failure must be a boolean' }, { status: 400 })
  }

  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select('id, name, slug, logo_url, require_photo_on_failure')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(org)
}
