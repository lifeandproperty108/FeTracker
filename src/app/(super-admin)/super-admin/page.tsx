import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Building2, FireExtinguisher, AlertTriangle, DollarSign, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default async function SuperAdminDashboardPage() {
  const supabase = createAdminClient()

  // Fetch all stats in parallel
  const [
    { count: orgCount },
    { count: extinguisherCount },
    { count: overdueCount },
    { data: revenueData },
    { data: recentOrgs },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('extinguishers').select('*', { count: 'exact', head: true }),
    supabase
      .from('extinguishers')
      .select('*', { count: 'exact', head: true })
      .in('status', ['overdue', 'out_of_service']),
    supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid'),
    supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = revenueData?.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0) ?? 0
  const hasOverdue = (overdueCount ?? 0) > 0

  const stats = [
    {
      label: 'Total Organizations',
      value: orgCount ?? 0,
      icon: Building2,
      accent: false,
    },
    {
      label: 'Total Extinguishers',
      value: extinguisherCount ?? 0,
      icon: FireExtinguisher,
      accent: false,
    },
    {
      label: 'Global Overdue',
      value: overdueCount ?? 0,
      icon: AlertTriangle,
      accent: hasOverdue,
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      accent: false,
    },
  ]

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all organizations and monitor system health.</p>
        </div>
        <Link href="/super-admin/organizations/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Link>
      </div>

      {/* Stat Cards */}
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

      {/* Recent Organizations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Organizations</CardTitle>
            <Link href="/super-admin/organizations" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrgs && recentOrgs.length > 0 ? (
            <ul className="divide-y">
              {recentOrgs.map((org) => (
                <li key={org.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/super-admin/organizations/${org.id}`}
                    className="font-medium hover:underline"
                  >
                    {org.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(org.created_at), 'MMM d, yyyy')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No organizations yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
