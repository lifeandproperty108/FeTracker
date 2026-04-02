import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import InvoicePdf from '@/components/billing/invoice-pdf'
import type { InvoicePdfLineItem } from '@/components/billing/invoice-pdf'
import InvoiceEmail from '@/lib/email/templates/invoice-email'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(
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

  const supabase = await createClient()

  // Fetch invoice with org info and line items
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, organizations(id, name, slug), line_items(*)')
    .eq('id', id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const org = invoice.organizations as { id: string; name: string; slug: string } | null
  if (!org) {
    return NextResponse.json(
      { error: 'Organization not found for invoice' },
      { status: 400 }
    )
  }

  // Get facility manager or org admin email to send to
  // Look up the org admin for the target organization
  const { data: orgAdmin } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('organization_id', org.id)
    .eq('role', 'org_admin')
    .limit(1)
    .single()

  if (!orgAdmin) {
    return NextResponse.json(
      { error: 'No recipient found for this organization' },
      { status: 400 }
    )
  }

  const lineItems = ((invoice.line_items as InvoicePdfLineItem[]) ?? []).sort(
    (a: InvoicePdfLineItem & { sort_order?: number }, b: InvoicePdfLineItem & { sort_order?: number }) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  // Generate PDF buffer
  const pdfBuffer = await renderToBuffer(
    createElement(InvoicePdf, {
      invoiceNumber: invoice.invoice_number as number,
      issuedDate: invoice.issued_date as string | null,
      dueDate: invoice.due_date as string | null,
      totalAmount: invoice.total_amount as number,
      notes: invoice.notes as string | null,
      providerName: 'FE Tracker',
      clientName: org.name,
      lineItems: lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        amount: li.amount,
      })),
    }) as ReactElement<DocumentProps>
  )

  const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}`

  // Send email with PDF attachment via Resend
  const { error: sendError } = await getResend().emails.send({
    from: 'FE Tracker <notifications@fetracker.com>',
    to: orgAdmin.email,
    subject: `Invoice #${invoice.invoice_number} from FE Tracker`,
    react: createElement(InvoiceEmail, {
      invoiceNumber: invoice.invoice_number as number,
      totalAmount: invoice.total_amount as number,
      dueDate: invoice.due_date as string | null,
      clientName: orgAdmin.full_name || org.name,
      viewUrl,
    }),
    attachments: [
      {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  })

  if (sendError) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // Update invoice status to 'sent' if currently draft
  if (invoice.status === 'draft') {
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        issued_date: invoice.issued_date ?? new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
  }

  return NextResponse.json({ success: true, sent_to: orgAdmin.email })
}
