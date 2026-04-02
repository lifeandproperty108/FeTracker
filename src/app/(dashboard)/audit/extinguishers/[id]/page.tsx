import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ExtinguisherType,
  ExtinguisherStatus,
  InspectionResult,
} from '@/lib/types/database'
import { ExtinguisherQRSection } from '@/app/(dashboard)/dashboard/extinguishers/[id]/qr-section'

const TYPE_LABELS: Record<ExtinguisherType, string> = {
  water: 'Water',
  dry_chemical_stored: 'Dry Chemical (Stored Pressure)',
  dry_chemical_cartridge: 'Dry Chemical (Cartridge)',
  co2: 'CO2',
  wet_chemical: 'Wet Chemical',
  clean_agent: 'Clean Agent',
  dry_powder: 'Dry Powder (Class D)',
  foam: 'Foam',
}

const STATUS_VARIANT: Record<
  ExtinguisherStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  compliant: 'default',
  due_soon: 'secondary',
  overdue: 'destructive',
  out_of_service: 'destructive',
  retired: 'outline',
}

const STATUS_LABELS: Record<ExtinguisherStatus, string> = {
  compliant: 'Compliant',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  out_of_service: 'Out of Service',
  retired: 'Retired',
}

function getDueColor(dateStr: string | null): string {
  if (!dateStr) return 'text-muted-foreground'
  const due = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const daysUntil = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400'
  if (daysUntil <= 30) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AuditExtinguisherDetailPage({
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

  const { data: extinguisher, error } = await supabase
    .from('extinguishers')
    .select('*, location:locations(id, name)')
    .eq('id', id)
    .single()

  if (error || !extinguisher) notFound()

  // Fetch inspections with checklist items
  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      '*, technician:users(full_name), inspection_type:inspection_types(name), inspection_items(id, passed, notes, photo_url, checklist_template:checklist_templates(item_label, is_critical))'
    )
    .eq('extinguisher_id', id)
    .order('performed_at', { ascending: false })
    .limit(20)

  const location = extinguisher.location as {
    id: string
    name: string
  } | null

  const dueDates = [
    { label: 'Monthly', date: extinguisher.next_monthly_due },
    { label: 'Annual', date: extinguisher.next_annual_due },
    { label: '6-Year', date: extinguisher.next_6year_due },
    { label: '12-Year (Hydro)', date: extinguisher.next_12year_due },
  ]

  return (
    <div className="space-y-6">
      {/* Auditor banner */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
        <ShieldCheck className="size-4 shrink-0" />
        Read Only — Auditor View
      </div>

      {/* Back link */}
      {location && (
        <Link
          href={`/audit/locations/${location.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {location.name}
        </Link>
      )}

      {/* Header — no Edit/Inspect buttons */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {extinguisher.barcode ??
                `Extinguisher ${extinguisher.id.slice(0, 8)}`}
            </h1>
            <Badge
              variant={
                STATUS_VARIANT[
                  extinguisher.status as ExtinguisherStatus
                ] ?? 'outline'
              }
            >
              {STATUS_LABELS[
                extinguisher.status as ExtinguisherStatus
              ] ?? extinguisher.status}
            </Badge>
          </div>
          {location && (
            <p className="text-muted-foreground">
              <Link
                href={`/audit/locations/${location.id}`}
                className="hover:underline underline-offset-4"
              >
                {location.name}
              </Link>
              {extinguisher.specific_location &&
                ` - ${extinguisher.specific_location}`}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">
                  {TYPE_LABELS[
                    extinguisher.type as ExtinguisherType
                  ] ?? extinguisher.type}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">
                  {extinguisher.size ?? '--'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Manufacturer</dt>
                <dd className="font-medium">
                  {extinguisher.manufacturer ?? '--'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-medium">
                  {extinguisher.model_number ?? '--'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Serial Number</dt>
                <dd className="font-medium">
                  {extinguisher.serial_number ?? '--'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Barcode</dt>
                <dd className="font-medium">
                  {extinguisher.barcode ?? '--'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Manufacture Date</dt>
                <dd className="font-medium">
                  {formatDate(extinguisher.manufacture_date)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Install Date</dt>
                <dd className="font-medium">
                  {formatDate(extinguisher.install_date)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ExtinguisherQRSection extinguisherId={extinguisher.id} />
          </CardContent>
        </Card>
      </div>

      {/* Due Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Due Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {dueDates.map((d) => (
              <div key={d.label} className="space-y-1">
                <p className="text-sm text-muted-foreground">{d.label}</p>
                <p
                  className={`text-sm font-semibold ${getDueColor(d.date)}`}
                >
                  {formatDate(d.date)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inspection History with checklist details and certificate links */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
        </CardHeader>
        <CardContent>
          {!inspections || inspections.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No inspections recorded yet.
            </p>
          ) : (
            <div className="space-y-6">
              {inspections.map(
                (insp: {
                  id: string
                  performed_at: string
                  inspection_type: { name: string } | null
                  technician: { full_name: string } | null
                  result: InspectionResult
                  notes: string | null
                  inspection_items: Array<{
                    id: string
                    passed: boolean
                    notes: string | null
                    photo_url: string | null
                    checklist_template: {
                      item_label: string
                      is_critical: boolean
                    } | null
                  }>
                }) => {
                  const items = insp.inspection_items ?? []
                  return (
                    <div
                      key={insp.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {formatDate(insp.performed_at)}
                          </span>
                          <Badge
                            variant={
                              insp.result === 'pass'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {insp.result === 'pass' ? 'Pass' : 'Fail'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {(
                              insp.inspection_type as {
                                name: string
                              } | null
                            )?.name ?? '--'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            by{' '}
                            {(
                              insp.technician as {
                                full_name: string
                              } | null
                            )?.full_name ?? '--'}
                          </span>
                          <Link
                            href={`/api/reports/certificate/${insp.id}`}
                          >
                            <Button variant="outline" size="sm">
                              <Download className="mr-1.5 size-3.5" />
                              Certificate
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {insp.notes && (
                        <p className="text-sm text-muted-foreground">
                          {insp.notes}
                        </p>
                      )}

                      {/* Checklist items */}
                      {items.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Checklist Item</TableHead>
                              <TableHead className="w-24">Result</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <span className="flex items-center gap-2">
                                    {item.checklist_template
                                      ?.item_label ?? '--'}
                                    {item.checklist_template
                                      ?.is_critical && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Critical
                                      </Badge>
                                    )}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {item.passed ? (
                                    <Badge
                                      variant="default"
                                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    >
                                      Pass
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      Fail
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                  {item.notes ?? '--'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
