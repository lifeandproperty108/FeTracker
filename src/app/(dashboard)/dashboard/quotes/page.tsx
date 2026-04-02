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
import type { QuoteStatus } from '@/lib/types/database'

const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  converted: { label: 'Converted', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  const canCreate = ['super_admin', 'org_admin'].includes(profile.role)
  const resolvedParams = await searchParams
  const filterStatus = resolvedParams.status as QuoteStatus | undefined

  const supabase = await createClient()

  let query = supabase
    .from('quotes')
    .select('*, organization:organizations(id, name)')
    .order('created_at', { ascending: false })

  if (profile.role !== 'super_admin' && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  }

  if (filterStatus && filterStatus in statusConfig) {
    query = query.eq('status', filterStatus)
  }

  const { data: quotes } = await query

  const rows = (quotes ?? []).map((q) => ({
    id: q.id as string,
    quote_number: q.quote_number as number,
    org_name: (q.organization as { id: string; name: string } | null)?.name ?? 'Unknown',
    status: q.status as QuoteStatus,
    total_amount: q.total_amount as number,
    issued_date: q.issued_date as string | null,
  }))

  const allStatuses: QuoteStatus[] = ['draft', 'sent', 'approved', 'declined', 'converted']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
        </div>
        {canCreate && (
          <Link href="/dashboard/quotes/new">
            <Button>
              <Plus className="mr-2 size-4" />
              New Quote
            </Button>
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/dashboard/quotes">
          <Badge
            variant={!filterStatus ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1"
          >
            All
          </Badge>
        </Link>
        {allStatuses.map((s) => (
          <Link key={s} href={`/dashboard/quotes?status=${s}`}>
            <Badge
              variant={filterStatus === s ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
            >
              {statusConfig[s].label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {filterStatus
                ? `No ${statusConfig[filterStatus].label.toLowerCase()} quotes found.`
                : 'No quotes found. Create one to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/quotes/${q.id}`}
                        className="font-medium font-mono text-primary hover:underline"
                      >
                        QT-{String(q.quote_number).padStart(4, '0')}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.org_name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[q.status].className}`}
                      >
                        {statusConfig[q.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(q.total_amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(q.issued_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
