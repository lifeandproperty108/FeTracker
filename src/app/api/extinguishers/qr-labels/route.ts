import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export async function GET(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locationId = request.nextUrl.searchParams.get('location_id')
  if (!locationId) {
    return NextResponse.json(
      { error: 'location_id query parameter is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: extinguishers, error } = await supabase
    .from('extinguishers')
    .select('id, barcode, type, specific_location, status')
    .eq('location_id', locationId)
    .order('barcode', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ extinguishers: extinguishers ?? [] })
}
