import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { getDashboardStats } from '@/lib/queries/dashboard-stats'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData

  const supabase = await createClient()

  // Fetch org name
  let orgName = ''
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    if (org) orgName = org.name
  }

  const { stats, locations, recentInspections } =
    await getDashboardStats(supabase)

  const pct = (count: number) =>
    stats.total_extinguishers > 0
      ? Math.round((count / stats.total_extinguishers) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile.full_name}
        </h1>
        {orgName && (
          <p className="text-muted-foreground mt-1">{orgName}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Flame className="size-4" />
              Total Extinguishers
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">
              {stats.total_extinguishers}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Compliant */}
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Compliant
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {stats.compliant_count}
              <span className="ml-2 text-sm font-normal text-emerald-600/70 dark:text-emerald-500/70">
                {pct(stats.compliant_count)}%
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Due Soon */}
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="size-4" />
              Due Soon
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {stats.due_soon_count}
              <span className="ml-2 text-sm font-normal text-amber-600/70 dark:text-amber-500/70">
                {pct(stats.due_soon_count)}%
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Overdue */}
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="size-4" />
              Overdue
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-red-700 dark:text-red-400">
              {stats.overdue_count}
              <span className="ml-2 text-sm font-normal text-red-600/70 dark:text-red-500/70">
                {pct(stats.overdue_count)}%
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Locations section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Locations</h2>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No locations found. Add a location to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => {
              const hasOverdue = loc.overdue_count > 0
              const hasDueSoon = loc.due_soon_count > 0
              const statusColor = hasOverdue
                ? 'bg-red-500'
                : hasDueSoon
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'

              return (
                <Link
                  key={loc.id}
                  href={`/dashboard/locations/${loc.id}`}
                  className="group"
                >
                  <Card className="transition-shadow group-hover:ring-2 group-hover:ring-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <span
                              className={`inline-block size-2.5 rounded-full ${statusColor}`}
                              aria-label={
                                hasOverdue
                                  ? 'Has overdue extinguishers'
                                  : hasDueSoon
                                    ? 'Has extinguishers due soon'
                                    : 'All compliant'
                              }
                            />
                            {loc.name}
                          </CardTitle>
                          {loc.address && (
                            <CardDescription>{loc.address}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{loc.extinguisher_count} extinguishers</span>
                        {loc.overdue_count > 0 && (
                          <Badge variant="destructive">
                            {loc.overdue_count} overdue
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Inspections */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recent Inspections</h2>
        </div>

        {recentInspections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No inspections recorded yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Extinguisher</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInspections.map((insp) => (
                    <TableRow key={insp.id}>
                      <TableCell>
                        {new Date(insp.performed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/extinguishers/${insp.extinguisher_id}`}
                          className="text-primary hover:underline"
                        >
                          {insp.extinguisher_barcode ?? insp.extinguisher_id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{insp.location_name}</TableCell>
                      <TableCell className="capitalize">
                        {insp.inspection_type_name}
                      </TableCell>
                      <TableCell>
                        {insp.result === 'pass' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Pass
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Fail</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
