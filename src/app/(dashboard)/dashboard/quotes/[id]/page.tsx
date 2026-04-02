import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { DocumentPreview } from '@/components/billing/document-preview'
import type { QuoteStatus, LineItem } from '@/lib/types/database'
import { QuoteActions } from './quote-actions'

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userData = await getUser()
  if (!userData) redirect('/login')

  const supabase = await createClient()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, organization:organizations(id, name, slug), location:locations(id, name)')
    .eq('id', id)
    .single()

  if (error || !quote) notFound()

  const { data: items } = await supabase
    .from('line_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order')

  const lineItems = (items ?? []) as LineItem[]
  const org = quote.organization as { id: string; name: string; slug: string } | null
  const location = quote.location as { id: string; name: string } | null
  const status = quote.status as QuoteStatus

  const canEdit = ['super_admin', 'org_admin'].includes(userData.profile.role)

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      {canEdit && (
        <QuoteActions
          quoteId={id}
          status={status}
        />
      )}

      {/* Document Preview */}
      <DocumentPreview
        type="quote"
        documentNumber={quote.quote_number as number}
        status={status}
        issuedDate={quote.issued_date as string | null}
        validUntil={quote.valid_until as string | null}
        fromName="FE Tracker"
        fromDetails="Fire Extinguisher Management Services"
        toName={org?.name ?? 'Unknown Organization'}
        toDetails={location ? `Location: ${location.name}` : undefined}
        items={lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        }))}
        totalAmount={quote.total_amount as number}
        notes={quote.notes as string | null}
      />
    </div>
  )
}
