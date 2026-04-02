import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getUser()
  if (!result || result.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Fetch stats in parallel
  const [
    { count: totalExtinguishers },
    { count: compliantCount },
    { count: dueSoonCount },
    { count: overdueCount },
  ] = await Promise.all([
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('status', 'compliant'),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('status', 'due_soon'),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .in('status', ['overdue', 'out_of_service']),
  ])

  return NextResponse.json({
    ...org,
    stats: {
      total_extinguishers: totalExtinguishers ?? 0,
      compliant_count: compliantCount ?? 0,
      due_soon_count: dueSoonCount ?? 0,
      overdue_count: overdueCount ?? 0,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getUser()
  if (!result || result.profile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  // Only allow updating specific fields
  const allowedFields = ['name', 'slug', 'logo_url', 'require_photo_on_failure']
  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(org)
}
