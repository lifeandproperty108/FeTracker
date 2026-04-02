import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { InvoiceStatus } from '@/lib/types/database'

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

export default async function InvoicesPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })

  const rows = (invoices ?? []).map((inv) => ({
    id: inv.id as string,
    invoice_number: inv.invoice_number as number,
    org_name: (inv.organizations as { name: string } | null)?.name ?? '--',
    status: inv.status as InvoiceStatus,
    total_amount: inv.total_amount as number,
    issued_date: inv.issued_date as string | null,
    due_date: inv.due_date as string | null,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="mr-2 size-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No invoices found. Create an invoice to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client / Org</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((inv) => {
                  const config = statusConfig[inv.status]
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{inv.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.org_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(inv.total_amount)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDate(inv.issued_date)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDate(inv.due_date)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
