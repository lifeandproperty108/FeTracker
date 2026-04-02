import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AcceptInviteForm from './accept-invite-form'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params

  const supabase = createAdminClient()

  const { data: invitation, error } = await supabase
    .from('pending_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">FE Tracker</h1>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-lg font-medium text-gray-900">Invalid Invitation</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation link is invalid or has already been used.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (invitation.accepted) {
    redirect('/login')
  }

  const isExpired = new Date(invitation.expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">FE Tracker</h1>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-lg font-medium text-gray-900">Invitation Expired</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation has expired. Please contact your administrator for a new one.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AcceptInviteForm
      token={token}
      email={invitation.email}
      role={invitation.role}
      organizationId={invitation.organization_id}
    />
  )
}
