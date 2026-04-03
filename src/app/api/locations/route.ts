import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { getSelectedOrgId } from '@/lib/org-switcher'

export async function GET() {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: locations, error } = await supabase
    .from('locations')
    .select('*, extinguishers(id, status)')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to include counts
  const result = (locations ?? []).map((loc) => {
    const extinguishers = (loc.extinguishers as { id: string; status: string }[]) ?? []
    return {
      ...loc,
      extinguishers: undefined,
      extinguisher_count: extinguishers.length,
      overdue_count: extinguishers.filter((e) => e.status === 'overdue').length,
    }
  })

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData

  if (!['super_admin', 'org_admin', 'facility_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, address, facility_manager_email } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const isSuperAdmin = profile.role === 'super_admin'
  const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null
  const orgId = selectedOrgId ?? profile.organization_id

  if (!orgId) {
    return NextResponse.json({ error: 'No organization selected' }, { status: 400 })
  }

  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: name.trim(),
      address: address?.trim() || null,
      facility_manager_email: facility_manager_email?.trim() || null,
      organization_id: orgId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
