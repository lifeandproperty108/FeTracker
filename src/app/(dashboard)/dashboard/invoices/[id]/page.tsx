import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Download,
  Pencil,
  FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { InvoiceStatus, LineItem } from '@/lib/types/database'

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  paid: { label: 'Paid', variant: 'outline' },
  overdue: { label: 'Overdue', variant: 'destructive' },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString()
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) redirect('/login')

  const isSuperAdmin = userData.profile.role === 'super_admin'
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, organizations(name, slug), line_items(*)')
    .eq('id', id)
    .single()

  if (error || !invoice) notFound()

  const lineItems = ((invoice.line_items as LineItem[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const org = invoice.organizations as { name: string; slug: string } | null
  const status = invoice.status as InvoiceStatus
  const config = statusConfig[status]
  const isDraft = status === 'draft'

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice #{invoice.invoice_number}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          {org && (
            <p className="mt-1 text-muted-foreground">{org.name}</p>
          )}
          {invoice.quote_id && (
            <p className="mt-1 text-sm text-muted-foreground">
              Created from{' '}
              <Link
                href={`/dashboard/quotes/${invoice.quote_id}`}
                className="text-primary hover:underline"
              >
                Quote
              </Link>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Link href={`/dashboard/invoices/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            </Link>
          )}
          {(status === 'sent' || status === 'overdue') && (
            <form action={`/api/invoices/${id}/mark-paid`} method="POST">
              <Button variant="outline" size="sm" type="submit">
                <CheckCircle2 className="mr-2 size-4" />
                Mark as Paid
              </Button>
            </form>
          )}
          <Link href={`/api/invoices/${id}?format=pdf`}>
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Download PDF
            </Button>
          </Link>
          {status !== 'paid' && (
            <form action={`/api/invoices/${id}/send`} method="POST">
              <Button size="sm" type="submit">
                <Send className="mr-2 size-4" />
                Send Invoice
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issued Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">
              {formatDate(invoice.issued_date as string | null)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">
              {formatDate(invoice.due_date as string | null)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(invoice.total_amount as number)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Line Items</h2>
        {lineItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No line items yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold">
                      {formatCurrency(invoice.total_amount as number)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notes / Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{invoice.notes as string}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
