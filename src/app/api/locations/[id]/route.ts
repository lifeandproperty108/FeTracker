import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select('*, extinguishers(id, barcode, type, specific_location, status, next_monthly_due, next_annual_due)')
    .eq('id', id)
    .single()

  if (error || !location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  return NextResponse.json(location)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData
  if (!['org_admin', 'facility_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    updates.name = body.name.trim()
  }
  if (body.address !== undefined) updates.address = body.address?.trim() || null
  if (body.facility_manager_email !== undefined) {
    updates.facility_manager_email = body.facility_manager_email?.trim() || null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData
  if (profile.role !== 'org_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
