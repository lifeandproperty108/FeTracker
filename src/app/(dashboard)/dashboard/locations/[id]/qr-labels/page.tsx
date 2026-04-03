import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { QRLabelSheet } from '@/components/extinguishers/qr-label-sheet'

export default async function QRLabelsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) redirect('/login')

  const isSuperAdmin = userData.profile.role === 'super_admin'
  const supabase = isSuperAdmin ? createAdminClient() : await createClient()

  const { data: location, error } = await supabase
    .from('locations')
    .select('id, name')
    .eq('id', id)
    .single()

  if (error || !location) notFound()

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/locations/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-4" />
        Back to Location
      </Link>

      <QRLabelSheet locationId={id} locationName={location.name as string} />
    </div>
  )
}
