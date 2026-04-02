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

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, organizations(id, name, slug), line_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(invoice)
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

  if (!['super_admin', 'org_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status, issued_date, due_date, notes, line_items } = body as {
    status?: string
    issued_date?: string
    due_date?: string
    notes?: string
    line_items?: {
      id?: string
      description: string
      quantity: number
      unit_price: number
      sort_order?: number
    }[]
  }

  const supabase = await createClient()

  // Build the update payload — only include provided fields
  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (issued_date !== undefined) updates.issued_date = issued_date
  if (due_date !== undefined) updates.due_date = due_date
  if (notes !== undefined) updates.notes = notes?.trim() || null

  // If line items are being replaced, recalculate total
  if (line_items !== undefined) {
    updates.total_amount = line_items.reduce(
      (sum, li) => sum + li.quantity * li.unit_price,
      0
    )

    // Delete existing line items and insert new ones
    const { error: deleteError } = await supabase
      .from('line_items')
      .delete()
      .eq('invoice_id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (line_items.length > 0) {
      const lineItemRows = line_items.map((li, idx) => ({
        invoice_id: id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        amount: li.quantity * li.unit_price,
        sort_order: li.sort_order ?? idx,
      }))

      const { error: insertError } = await supabase
        .from('line_items')
        .insert(lineItemRows)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select('*, organizations(id, name, slug), line_items(*)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(invoice)
  }

  // If only line items were updated, re-fetch
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*, organizations(id, name, slug), line_items(*)')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(invoice)
}
