'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ExtinguisherStatus, ExtinguisherType } from '@/lib/types/database'

const TYPE_LABELS: Record<ExtinguisherType, string> = {
  water: 'Water',
  dry_chemical_stored: 'Dry Chemical (Stored)',
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

interface ExtinguisherRow {
  id: string
  barcode: string | null
  type: ExtinguisherType
  specific_location: string | null
  status: ExtinguisherStatus
  next_monthly_due: string | null
  next_annual_due: string | null
  next_6year_due?: string | null
  next_12year_due?: string | null
}

interface ExtinguisherTableProps {
  extinguishers: ExtinguisherRow[]
}

function getEarliestDue(ext: ExtinguisherRow): string | null {
  const dates = [
    ext.next_monthly_due,
    ext.next_annual_due,
    ext.next_6year_due,
    ext.next_12year_due,
  ].filter((d): d is string => !!d)

  if (dates.length === 0) return null
  dates.sort()
  return dates[0]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ExtinguisherTable({ extinguishers }: ExtinguisherTableProps) {
  if (extinguishers.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No extinguishers found.
      </div>
    )
  }

  return (
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
        {extinguishers.map((ext) => (
          <TableRow key={ext.id}>
            <TableCell>
              <Link
                href={`/dashboard/extinguishers/${ext.id}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {ext.barcode ?? ext.id.slice(0, 8)}
              </Link>
            </TableCell>
            <TableCell>{TYPE_LABELS[ext.type] ?? ext.type}</TableCell>
            <TableCell className="text-muted-foreground">
              {ext.specific_location ?? '--'}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[ext.status] ?? 'outline'}>
                {STATUS_LABELS[ext.status] ?? ext.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(getEarliestDue(ext))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
