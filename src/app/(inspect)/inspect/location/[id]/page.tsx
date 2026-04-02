import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Flame,
  MapPin,
  Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ExtinguisherStatus } from '@/lib/types/database'

type ExtinguisherRow = {
  id: string
  barcode: string | null
  type: string
  specific_location: string | null
  status: ExtinguisherStatus
  next_monthly_due: string | null
  next_annual_due: string | null
}

const statusConfig: Record<
  string,
  { label: string; dotColor: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
  compliant: {
    label: 'Compliant',
    dotColor: 'bg-emerald-500',
    variant: 'default',
  },
  due_soon: {
    label: 'Due Soon',
    dotColor: 'bg-amber-500',
    variant: 'secondary',
  },
  overdue: {
    label: 'Overdue',
    dotColor: 'bg-red-500',
    variant: 'destructive',
  },
  out_of_service: {
    label: 'Out of Service',
    dotColor: 'bg-gray-500',
    variant: 'outline',
  },
  retired: {
    label: 'Retired',
    dotColor: 'bg-gray-400',
    variant: 'outline',
  },
}

const statusOrder: Record<string, number> = {
  overdue: 0,
  due_soon: 1,
  out_of_service: 2,
  compliant: 3,
  retired: 4,
}

function getNextDueDate(ext: ExtinguisherRow): string | null {
  const dates = [ext.next_monthly_due, ext.next_annual_due].filter(
    Boolean
  ) as string[]
  if (dates.length === 0) return null
  dates.sort()
  return dates[0]
}

export default async function InspectLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) redirect('/login')

  const supabase = await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select(
      '*, extinguishers(id, barcode, type, specific_location, status, next_monthly_due, next_annual_due)'
    )
    .eq('id', id)
    .single()

  if (error || !location) notFound()

  const extinguishers = (
    (location.extinguishers as ExtinguisherRow[]) ?? []
  ).sort((a, b) => {
    // Sort by status urgency first
    const orderA = statusOrder[a.status] ?? 5
    const orderB = statusOrder[b.status] ?? 5
    if (orderA !== orderB) return orderA - orderB

    // Then by next due date (earliest first)
    const dateA = getNextDueDate(a)
    const dateB = getNextDueDate(b)
    if (dateA && dateB) return dateA.localeCompare(dateB)
    if (dateA) return -1
    if (dateB) return 1
    return 0
  })

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Link
        href="/inspect"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-1"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* Location header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-muted-foreground shrink-0" />
          <h1 className="text-xl font-bold tracking-tight truncate">
            {location.name as string}
          </h1>
        </div>
        {location.address && (
          <p className="mt-1 text-sm text-muted-foreground ml-7">
            {location.address as string}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground ml-7">
          {extinguishers.length} extinguisher
          {extinguishers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Extinguisher cards */}
      {extinguishers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flame className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No extinguishers at this location.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {extinguishers.map((ext) => {
            const config = statusConfig[ext.status] ?? {
              label: ext.status,
              dotColor: 'bg-gray-400',
              variant: 'outline' as const,
            }
            const nextDue = getNextDueDate(ext)
            const formattedDue = nextDue
              ? new Date(nextDue).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null

            return (
              <Link
                key={ext.id}
                href={`/inspect/extinguisher/${ext.id}`}
                className="block"
              >
                <Card className="transition-all hover:shadow-md hover:bg-muted/50 active:bg-muted">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Barcode */}
                        <p className="text-base font-bold font-mono tracking-tight truncate">
                          {ext.barcode ?? ext.id.slice(0, 8)}
                        </p>
                        {/* Type */}
                        <p className="text-sm text-foreground/80 capitalize font-medium">
                          {ext.type.replace(/_/g, ' ')}
                        </p>
                        {/* Specific location */}
                        {ext.specific_location && (
                          <p className="text-xs text-muted-foreground truncate">
                            {ext.specific_location}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Status badge */}
                        <Badge variant={config.variant} className="text-xs font-semibold px-2.5 py-0.5">
                          <span
                            className={`mr-1.5 inline-block size-2 rounded-full ${config.dotColor}`}
                          />
                          {config.label}
                        </Badge>
                        {/* Due date */}
                        {formattedDue && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {formattedDue}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
