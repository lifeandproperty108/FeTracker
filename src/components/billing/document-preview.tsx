import { Separator } from '@/components/ui/separator'

interface DocumentLineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface DocumentPreviewProps {
  type: 'quote' | 'invoice'
  documentNumber: number
  status: string
  issuedDate: string | null
  validUntil?: string | null   // for quotes
  dueDate?: string | null      // for invoices
  fromName: string
  fromDetails?: string
  toName: string
  toDetails?: string
  items: DocumentLineItem[]
  totalAmount: number
  notes: string | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DocumentPreview({
  type,
  documentNumber,
  status,
  issuedDate,
  validUntil,
  dueDate,
  fromName,
  fromDetails,
  toName,
  toDetails,
  items,
  totalAmount,
  notes,
}: DocumentPreviewProps) {
  const label = type === 'quote' ? 'Quote' : 'Invoice'
  const numberPrefix = type === 'quote' ? 'QT' : 'INV'

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">FE Tracker</h2>
            <p className="text-sm text-muted-foreground mt-1">Fire Extinguisher Management</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              {numberPrefix}-{String(documentNumber).padStart(4, '0')}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* From / To / Details */}
      <div className="p-8 grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            From
          </p>
          <p className="font-medium text-foreground">{fromName}</p>
          {fromDetails && (
            <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{fromDetails}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            To
          </p>
          <p className="font-medium text-foreground">{toName}</p>
          {toDetails && (
            <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{toDetails}</p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued</span>
            <span className="font-medium">{formatDate(issuedDate)}</span>
          </div>
          {type === 'quote' && validUntil && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Until</span>
              <span className="font-medium">{formatDate(validUntil)}</span>
            </div>
          )}
          {type === 'invoice' && dueDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium">{formatDate(dueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="px-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 font-semibold text-muted-foreground">Description</th>
              <th className="text-right py-3 font-semibold text-muted-foreground w-20">Qty</th>
              <th className="text-right py-3 font-semibold text-muted-foreground w-28">
                Unit Price
              </th>
              <th className="text-right py-3 font-semibold text-muted-foreground w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-3 text-foreground">{item.description}</td>
                <td className="py-3 text-right tabular-nums text-foreground">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums text-foreground">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 text-right tabular-nums font-medium text-foreground">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="px-8 py-4">
        <div className="flex justify-end">
          <div className="w-56 space-y-2">
            <Separator />
            <div className="flex justify-between pt-1">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-8 pb-8 pt-2">
          <Separator className="mb-4" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notes
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-muted/30 px-8 py-4 rounded-b-lg">
        <p className="text-xs text-center text-muted-foreground">
          Thank you for your business. Generated by FE Tracker.
        </p>
      </div>
    </div>
  )
}
