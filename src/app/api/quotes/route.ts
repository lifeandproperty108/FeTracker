import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'

export async function GET() {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData
  const supabase = await createClient()

  let query = supabase
    .from('quotes')
    .select('*, organization:organizations(id, name)')
    .order('created_at', { ascending: false })

  // Non-super-admins only see their org's quotes
  if (profile.role !== 'super_admin' && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

interface LineItemPayload {
  description: string
  quantity: number
  unit_price: number
}

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData

  // Only super_admin and org_admin can create quotes
  if (!['super_admin', 'org_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    organization_id: string
    location_id?: string | null
    notes?: string | null
    valid_until?: string | null
    items: LineItemPayload[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { organization_id, location_id, notes, valid_until, items } = body

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
  }

  // Validate items
  for (const item of items) {
    if (!item.description || item.quantity <= 0 || item.unit_price < 0) {
      return NextResponse.json(
        { error: 'Each item needs a description, positive quantity, and non-negative unit_price' },
        { status: 400 }
      )
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  // Use admin client to bypass RLS for quote_number generation
  const admin = createAdminClient()

  // Get next quote number
  const { data: maxRow } = await admin
    .from('quotes')
    .select('quote_number')
    .order('quote_number', { ascending: false })
    .limit(1)
    .single()

  const nextNumber = (maxRow?.quote_number ?? 0) + 1

  // Insert quote
  const { data: quote, error: quoteError } = await admin
    .from('quotes')
    .insert({
      organization_id,
      location_id: location_id || null,
      quote_number: nextNumber,
      status: 'draft',
      issued_date: new Date().toISOString().split('T')[0],
      valid_until: valid_until || null,
      notes: notes || null,
      total_amount: totalAmount,
    })
    .select()
    .single()

  if (quoteError || !quote) {
    return NextResponse.json(
      { error: quoteError?.message ?? 'Failed to create quote' },
      { status: 500 }
    )
  }

  // Insert line items
  const lineItems = items.map((item, index) => ({
    quote_id: quote.id,
    invoice_id: null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
    sort_order: index,
  }))

  const { error: itemsError } = await admin.from('line_items').insert(lineItems)

  if (itemsError) {
    // Clean up the quote if items failed
    await admin.from('quotes').delete().eq('id', quote.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(quote, { status: 201 })
}
