import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { formatDateOrFallback } from '@/lib/format-date'

export default async function OrganizationsListPage() {
  const supabase = createAdminClient()

  // Fetch all organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  // For each org, get location count, extinguisher count, and overdue count
  const orgsWithStats = await Promise.all(
    (organizations ?? []).map(async (org) => {
      const [
        { count: locationCount },
        { count: extinguisherCount },
        { count: overdueCount },
      ] = await Promise.all([
        supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id),
        supabase
          .from('extinguishers')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id),
        supabase
          .from('extinguishers')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .in('status', ['overdue', 'out_of_service']),
      ])

      return {
        ...org,
        locationCount: locationCount ?? 0,
        extinguisherCount: extinguisherCount ?? 0,
        overdueCount: overdueCount ?? 0,
      }
    })
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage all client organizations.</p>
        </div>
        <Link href="/super-admin/organizations/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center"># Locations</TableHead>
                <TableHead className="text-center"># Extinguishers</TableHead>
                <TableHead className="text-center">Overdue</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgsWithStats.length > 0 ? (
                orgsWithStats.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="font-medium hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">{org.locationCount}</TableCell>
                    <TableCell className="text-center">{org.extinguisherCount}</TableCell>
                    <TableCell className="text-center">
                      {org.overdueCount > 0 ? (
                        <Badge variant="destructive">{org.overdueCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateOrFallback(org.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No organizations yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
