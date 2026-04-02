import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export async function GET() {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, organizations(name), line_items(id)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (invoices ?? []).map((inv) => ({
    ...inv,
    line_item_count: ((inv.line_items as { id: string }[]) ?? []).length,
    line_items: undefined,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const userData = await getUser()
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { profile } = userData

  if (!['super_admin', 'org_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    organization_id,
    quote_id,
    issued_date,
    due_date,
    notes,
    line_items,
  } = body as {
    organization_id?: string
    quote_id?: string
    issued_date?: string
    due_date?: string
    notes?: string
    line_items?: {
      description: string
      quantity: number
      unit_price: number
      sort_order?: number
    }[]
  }

  const orgId = organization_id ?? profile.organization_id
  if (!orgId) {
    return NextResponse.json(
      { error: 'organization_id is required' },
      { status: 400 }
    )
  }

  // Calculate total from line items
  const items = line_items ?? []
  const totalAmount = items.reduce(
    (sum, li) => sum + li.quantity * li.unit_price,
    0
  )

  const supabase = await createClient()

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      quote_id: quote_id ?? null,
      status: 'draft',
      issued_date: issued_date ?? null,
      due_date: due_date ?? null,
      notes: notes?.trim() || null,
      total_amount: totalAmount,
    })
    .select()
    .single()

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 })
  }

  // Insert line items if provided
  if (items.length > 0) {
    const lineItemRows = items.map((li, idx) => ({
      invoice_id: invoice.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      amount: li.quantity * li.unit_price,
      sort_order: li.sort_order ?? idx,
    }))

    const { error: liError } = await supabase
      .from('line_items')
      .insert(lineItemRows)

    if (liError) {
      return NextResponse.json({ error: liError.message }, { status: 500 })
    }
  }

  return NextResponse.json(invoice, { status: 201 })
}
