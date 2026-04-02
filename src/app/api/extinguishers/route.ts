import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export async function GET(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get('location_id')

  const supabase = await createClient()

  let query = supabase
    .from('extinguishers')
    .select('*')
    .order('created_at', { ascending: false })

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData

  if (!['org_admin', 'facility_manager', 'technician'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    location_id,
    type,
    barcode,
    size,
    manufacturer,
    model_number,
    serial_number,
    manufacture_date,
    install_date,
    specific_location,
  } = body

  if (!location_id || typeof location_id !== 'string') {
    return NextResponse.json({ error: 'location_id is required' }, { status: 400 })
  }

  const validTypes = [
    'water', 'dry_chemical_stored', 'dry_chemical_cartridge',
    'co2', 'wet_chemical', 'clean_agent', 'dry_powder', 'foam',
  ]
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json({ error: 'Valid type is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('extinguishers')
    .insert({
      location_id,
      organization_id: profile.organization_id,
      type,
      barcode: barcode?.trim() || null,
      size: size?.trim() || null,
      manufacturer: manufacturer?.trim() || null,
      model_number: model_number?.trim() || null,
      serial_number: serial_number?.trim() || null,
      manufacture_date: manufacture_date || null,
      install_date: install_date || null,
      specific_location: specific_location?.trim() || null,
      status: 'compliant',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
