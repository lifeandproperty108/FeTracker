import { Users, Clock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { getSelectedOrgId } from '@/lib/org-switcher'
import { redirect } from 'next/navigation'
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
import { MemberTable } from '@/components/team/member-table'
import { InviteDialog } from '@/components/team/invite-dialog'
import type { User, PendingInvitation, UserRole } from '@/lib/types/database'

function formatRole(role: UserRole): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function TeamPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData

  // Only org_admin (and super_admin) can access team management
  if (profile.role !== 'org_admin' && profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const isSuperAdmin = profile.role === 'super_admin'
  const selectedOrgId = isSuperAdmin ? await getSelectedOrgId() : null
  const orgId = selectedOrgId ?? profile.organization_id

  if (!orgId) {
    redirect('/dashboard')
  }

  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  // Fetch all members in the organization
  const { data: membersData } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name')

  const members = (membersData ?? []) as User[]

  // Fetch pending invitations for this org
  const { data: invitationsData } = await supabase
    .from('pending_invitations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('accepted', false)
    .order('created_at', { ascending: false })

  const invitations = (invitationsData ?? []) as PendingInvitation[]

  const isAdmin = profile.role === 'org_admin' || profile.role === 'super_admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        </div>
        {isAdmin && <InviteDialog organizationId={orgId} />}
      </div>

      {/* Members Table */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No team members found. Invite someone to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <MemberTable
              members={members}
              currentUserId={profile.id}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Pending Invitations</h2>
        </div>

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Mail className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No pending invitations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatRole(inv.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.expires_at)}
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
