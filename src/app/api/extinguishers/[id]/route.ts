import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const { profile } = userData
  const isSuperAdmin = profile.role === 'super_admin'
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data: extinguisher, error } = await supabase
    .from('extinguishers')
    .select('*, location:locations(id, name)')
    .eq('id', id)
    .single()

  if (error || !extinguisher) {
    return NextResponse.json({ error: 'Extinguisher not found' }, { status: 404 })
  }

  const { data: inspections } = await supabase
    .from('inspections')
    .select('*, technician:users(full_name), inspection_type:inspection_types(name)')
    .eq('extinguisher_id', id)
    .order('performed_at', { ascending: false })

  return NextResponse.json({ ...extinguisher, inspections: inspections ?? [] })
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
  if (!['super_admin', 'org_admin', 'facility_manager', 'technician'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  const validTypes = [
    'water', 'dry_chemical_stored', 'dry_chemical_cartridge',
    'co2', 'wet_chemical', 'clean_agent', 'dry_powder', 'foam',
  ]

  if (body.type !== undefined) {
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    updates.type = body.type
  }
  if (body.barcode !== undefined) updates.barcode = body.barcode?.trim() || null
  if (body.size !== undefined) updates.size = body.size?.trim() || null
  if (body.manufacturer !== undefined) updates.manufacturer = body.manufacturer?.trim() || null
  if (body.model_number !== undefined) updates.model_number = body.model_number?.trim() || null
  if (body.serial_number !== undefined) updates.serial_number = body.serial_number?.trim() || null
  if (body.manufacture_date !== undefined) updates.manufacture_date = body.manufacture_date || null
  if (body.install_date !== undefined) updates.install_date = body.install_date || null
  if (body.specific_location !== undefined) updates.specific_location = body.specific_location?.trim() || null
  if (body.location_id !== undefined) updates.location_id = body.location_id

  const isSuperAdmin = profile.role === 'super_admin'
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data, error } = await supabase
    .from('extinguishers')
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
  if (!['super_admin', 'org_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isSuperAdmin = profile.role === 'super_admin'
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { error } = await supabase
    .from('extinguishers')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
