import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import type { ExtinguisherType, ExtinguisherStatus, InspectionResult } from '@/lib/types/database'
import { ExtinguisherQRSection } from './qr-section'

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

const STATUS_VARIANT: Record<ExtinguisherStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
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
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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

export default async function ExtinguisherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) notFound()

  const isSuperAdmin = userData.profile.role === 'super_admin'
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data: extinguisher, error } = await supabase
    .from('extinguishers')
    .select('*, location:locations(id, name)')
    .eq('id', id)
    .single()

  if (error || !extinguisher) notFound()

  const { data: inspections } = await supabase
    .from('inspections')
    .select('*, technician:users(full_name), inspection_type:inspection_types(name)')
    .eq('extinguisher_id', id)
    .order('performed_at', { ascending: false })
    .limit(20)

  const location = extinguisher.location as { id: string; name: string } | null

  const dueDates = [
    { label: 'Monthly', date: extinguisher.next_monthly_due },
    { label: 'Annual', date: extinguisher.next_annual_due },
    { label: '6-Year', date: extinguisher.next_6year_due },
    { label: '12-Year (Hydro)', date: extinguisher.next_12year_due },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {extinguisher.barcode ?? `Extinguisher ${extinguisher.id.slice(0, 8)}`}
            </h1>
            <Badge variant={STATUS_VARIANT[extinguisher.status as ExtinguisherStatus] ?? 'outline'}>
              {STATUS_LABELS[extinguisher.status as ExtinguisherStatus] ?? extinguisher.status}
            </Badge>
          </div>
          {location && (
            <p className="text-muted-foreground">
              <Link
                href={`/dashboard/locations/${location.id}`}
                className="hover:underline underline-offset-4"
              >
                {location.name}
              </Link>
              {extinguisher.specific_location && ` - ${extinguisher.specific_location}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/locations/${extinguisher.location_id}/extinguishers/new?edit=${extinguisher.id}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            Edit
          </Link>
          <Link
            href={`/inspect/extinguisher/${extinguisher.id}`}
            className={buttonVariants()}
          >
            Start Inspection
          </Link>
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
                <dd className="font-medium">{TYPE_LABELS[extinguisher.type as ExtinguisherType] ?? extinguisher.type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{extinguisher.size ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Manufacturer</dt>
                <dd className="font-medium">{extinguisher.manufacturer ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-medium">{extinguisher.model_number ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Serial Number</dt>
                <dd className="font-medium">{extinguisher.serial_number ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Barcode</dt>
                <dd className="font-medium">{extinguisher.barcode ?? '--'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Manufacture Date</dt>
                <dd className="font-medium">{formatDate(extinguisher.manufacture_date)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Install Date</dt>
                <dd className="font-medium">{formatDate(extinguisher.install_date)}</dd>
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
                <p className={`text-sm font-semibold ${getDueColor(d.date)}`}>
                  {formatDate(d.date)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inspection History */}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((insp: {
                  id: string
                  performed_at: string
                  inspection_type: { name: string } | null
                  technician: { full_name: string } | null
                  result: InspectionResult
                  notes: string | null
                }) => (
                  <TableRow key={insp.id}>
                    <TableCell>{formatDate(insp.performed_at)}</TableCell>
                    <TableCell>
                      {(insp.inspection_type as { name: string } | null)?.name ?? '--'}
                    </TableCell>
                    <TableCell>
                      {(insp.technician as { full_name: string } | null)?.full_name ?? '--'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={insp.result === 'pass' ? 'default' : 'destructive'}
                      >
                        {insp.result === 'pass' ? 'Pass' : 'Fail'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {insp.notes ?? '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
