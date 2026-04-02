import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Download,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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

type ExtinguisherRow = {
  id: string
  barcode: string | null
  type: string
  specific_location: string | null
  status: string
  next_monthly_due: string | null
  next_annual_due: string | null
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
  compliant: { label: 'Compliant', variant: 'default' },
  due_soon: { label: 'Due Soon', variant: 'secondary' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  out_of_service: { label: 'Out of Service', variant: 'outline' },
  retired: { label: 'Retired', variant: 'outline' },
}

export default async function AuditLocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  if (profile.role !== 'auditor') redirect('/dashboard')

  const supabase = await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select(
      '*, extinguishers(id, barcode, type, specific_location, status, next_monthly_due, next_annual_due)'
    )
    .eq('id', id)
    .single()

  if (error || !location) notFound()

  const extinguishers = (location.extinguishers as ExtinguisherRow[]) ?? []

  // Calculate stats
  const stats = {
    total: extinguishers.length,
    compliant: extinguishers.filter((e) => e.status === 'compliant').length,
    due_soon: extinguishers.filter((e) => e.status === 'due_soon').length,
    overdue: extinguishers.filter((e) => e.status === 'overdue').length,
  }

  function getNextDueDate(ext: ExtinguisherRow): string {
    const dates = [ext.next_monthly_due, ext.next_annual_due].filter(
      Boolean
    ) as string[]
    if (dates.length === 0) return '--'
    dates.sort()
    return new Date(dates[0]).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Auditor banner */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
        <ShieldCheck className="size-4 shrink-0" />
        Read Only — Auditor View
      </div>

      {/* Back link */}
      <Link
        href="/audit"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Audit Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {location.name as string}
          </h1>
          {location.address && (
            <p className="mt-1 text-muted-foreground">
              {location.address as string}
            </p>
          )}
          {location.facility_manager_email && (
            <p className="mt-1 text-sm text-muted-foreground">
              Facility Manager: {location.facility_manager_email as string}
            </p>
          )}
        </div>
        <Link href={`/api/reports/compliance?location_id=${id}`}>
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Download Report
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Flame className="size-4" />
              Total
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Compliant
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-emerald-700 dark:text-emerald-400">
              {stats.compliant}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="size-4" />
              Due Soon
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-amber-700 dark:text-amber-400">
              {stats.due_soon}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="size-4" />
              Overdue
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-red-700 dark:text-red-400">
              {stats.overdue}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Extinguishers table — read only, no Add/Edit/Delete */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Extinguishers</h2>

        {extinguishers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flame className="mx-auto mb-4 size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No extinguishers at this location.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Specific Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extinguishers.map((ext) => {
                    const config = statusConfig[ext.status] ?? {
                      label: ext.status,
                      variant: 'outline' as const,
                    }
                    return (
                      <TableRow key={ext.id}>
                        <TableCell>
                          <Link
                            href={`/audit/extinguishers/${ext.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {ext.barcode ?? ext.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell className="capitalize">
                          {ext.type.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ext.specific_location ?? '--'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {getNextDueDate(ext)}
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
    </div>
  )
}
