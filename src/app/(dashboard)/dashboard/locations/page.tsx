import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { getSelectedOrgId } from '@/lib/org-switcher'
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

export default async function LocationsPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  const isSuperAdmin = profile.role === 'super_admin'
  const canCreate = ['super_admin', 'org_admin', 'facility_manager'].includes(profile.role)

  const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null
  const orgId = selectedOrgId ?? profile.organization_id
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  // Fetch locations with extinguisher counts
  let query = supabase
    .from('locations')
    .select('*, extinguishers(id, status)')
    .order('name')

  if (isSuperAdmin && orgId) {
    query = query.eq('organization_id', orgId)
  }

  const { data: locations } = await query

  const rows = (locations ?? []).map((loc) => {
    const extinguishers = (loc.extinguishers as { id: string; status: string }[]) ?? []
    // Look up facility manager name if we have the id
    return {
      id: loc.id as string,
      name: loc.name as string,
      address: loc.address as string | null,
      facility_manager_email: loc.facility_manager_email as string | null,
      extinguisher_count: extinguishers.length,
      overdue_count: extinguishers.filter((e) => e.status === 'overdue').length,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
        </div>
        {canCreate && (
          <Link href="/dashboard/locations/new">
            <Button>
              <Plus className="mr-2 size-4" />
              Add Location
            </Button>
          </Link>
        )}
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No locations found. Add a location to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Facility Manager</TableHead>
                  <TableHead className="text-right"># Extinguishers</TableHead>
                  <TableHead className="text-right"># Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/locations/${loc.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {loc.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loc.address ?? '--'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loc.facility_manager_email ?? '--'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {loc.extinguisher_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {loc.overdue_count > 0 ? (
                        <Badge variant="destructive">{loc.overdue_count}</Badge>
                      ) : (
                        <span className="tabular-nums text-muted-foreground">0</span>
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
  )
}
