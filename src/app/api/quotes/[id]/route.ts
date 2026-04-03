import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import type { QuoteStatus } from '@/lib/types/database'

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

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, organization:organizations(id, name, slug), location:locations(id, name)')
    .eq('id', id)
    .single()

  if (error || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Fetch line items
  const { data: items } = await supabase
    .from('line_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order')

  return NextResponse.json({ ...quote, items: items ?? [] })
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

  let body: {
    status?: QuoteStatus
    notes?: string | null
    valid_until?: string | null
    items?: { description: string; quantity: number; unit_price: number }[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Build update payload
  const updates: Record<string, unknown> = {}
  if (body.status) updates.status = body.status
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.valid_until !== undefined) updates.valid_until = body.valid_until

  // If items are provided, recalculate total
  if (body.items && body.items.length > 0) {
    const totalAmount = body.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    )
    updates.total_amount = totalAmount

    // Delete existing line items and re-insert
    await admin.from('line_items').delete().eq('quote_id', id)

    const lineItems = body.items.map((item, index) => ({
      quote_id: id,
      invoice_id: null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      sort_order: index,
    }))

    const { error: itemsError } = await admin.from('line_items').insert(lineItems)
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await admin
      .from('quotes')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  // Return updated quote
  const { data: updated } = await admin
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json(updated)
}

export async function POST(
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

  let body: { action: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch the quote
  const { data: quote, error: fetchError } = await admin
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  if (body.action === 'send') {
    if (quote.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft quotes can be sent' }, { status: 400 })
    }

    const { error } = await admin
      .from('quotes')
      .update({ status: 'sent', issued_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: 'sent' })
  }

  if (body.action === 'convert') {
    if (quote.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved quotes can be converted to invoices' },
        { status: 400 }
      )
    }

    // Get next invoice number
    const { data: maxInv } = await admin
      .from('invoices')
      .select('invoice_number')
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single()

    const nextInvNumber = (maxInv?.invoice_number ?? 0) + 1

    // Create invoice
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const { data: invoice, error: invError } = await admin
      .from('invoices')
      .insert({
        organization_id: quote.organization_id,
        quote_id: quote.id,
        invoice_number: nextInvNumber,
        status: 'draft',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        notes: quote.notes,
        total_amount: quote.total_amount,
      })
      .select()
      .single()

    if (invError || !invoice) {
      return NextResponse.json(
        { error: invError?.message ?? 'Failed to create invoice' },
        { status: 500 }
      )
    }

    // Copy line items from quote to invoice
    const { data: quoteItems } = await admin
      .from('line_items')
      .select('*')
      .eq('quote_id', id)
      .order('sort_order')

    if (quoteItems && quoteItems.length > 0) {
      const invoiceItems = quoteItems.map((item) => ({
        quote_id: null,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        inspection_id: item.inspection_id,
        sort_order: item.sort_order,
      }))

      await admin.from('line_items').insert(invoiceItems)
    }

    // Update quote status
    await admin.from('quotes').update({ status: 'converted' }).eq('id', id)

    return NextResponse.json({ success: true, status: 'converted', invoice_id: invoice.id })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
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

  const admin = createAdminClient()

  // Only allow deleting draft quotes
  const { data: quote } = await admin
    .from('quotes')
    .select('status')
    .eq('id', id)
    .single()

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  if (quote.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft quotes can be deleted' }, { status: 400 })
  }

  // Delete line items first, then quote
  await admin.from('line_items').delete().eq('quote_id', id)
  const { error } = await admin.from('quotes').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
