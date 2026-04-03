import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
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
import { FireExtinguisher, CheckCircle, Clock, AlertTriangle, ArrowLeft, UserPlus } from 'lucide-react'
import type { Organization, Location, User } from '@/lib/types/database'
import { formatDateOrFallback } from '@/lib/format-date'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch org
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !org) notFound()

  // Fetch stats, locations, and team members in parallel
  const [
    { count: totalExtinguishers },
    { count: compliantCount },
    { count: dueSoonCount },
    { count: overdueCount },
    { data: locations },
    { data: members },
  ] = await Promise.all([
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('status', 'compliant'),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('status', 'due_soon'),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .in('status', ['overdue', 'out_of_service']),
    supabase
      .from('locations')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: false }),
  ])

  const hasOverdue = (overdueCount ?? 0) > 0

  const stats = [
    {
      label: 'Total Extinguishers',
      value: totalExtinguishers ?? 0,
      icon: FireExtinguisher,
      accent: false,
    },
    {
      label: 'Compliant',
      value: compliantCount ?? 0,
      icon: CheckCircle,
      accent: false,
    },
    {
      label: 'Due Soon',
      value: dueSoonCount ?? 0,
      icon: Clock,
      accent: false,
    },
    {
      label: 'Overdue',
      value: overdueCount ?? 0,
      icon: AlertTriangle,
      accent: hasOverdue,
    },
  ]

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/super-admin/organizations" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{(org as Organization).name}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Slug: <code className="rounded bg-muted px-1 py-0.5">{(org as Organization).slug}</code>
            {' '}&middot;{' '}
            Created {formatDateOrFallback((org as Organization).created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/super-admin/organizations/${id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Edit
          </Link>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={stat.accent ? 'ring-red-600/40' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.accent ? 'text-red-600' : 'text-muted-foreground'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${stat.accent ? 'text-red-600' : ''}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Facility Manager</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations && locations.length > 0 ? (
                (locations as Location[]).map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {loc.address ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loc.facility_manager_email ?? 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateOrFallback(loc.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No locations for this organization.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members && members.length > 0 ? (
                (members as User[]).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateOrFallback(member.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No team members for this organization.
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
