import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { Badge } from '@/components/ui/badge'
import { ChecklistForm } from '@/components/inspect/checklist-form'
import type {
  Extinguisher,
  InspectionType,
  Organization,
} from '@/lib/types/database'

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  compliant: 'default',
  due_soon: 'secondary',
  overdue: 'destructive',
  out_of_service: 'destructive',
  retired: 'outline',
}

const statusLabels: Record<string, string> = {
  compliant: 'Compliant',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  out_of_service: 'Out of Service',
  retired: 'Retired',
}

export default async function InspectExtinguisherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userData = await getUser()
  if (!userData) notFound()

  const supabase = await createClient()

  // Fetch extinguisher, inspection types, and org settings in parallel
  const [extResult, typesResult, orgResult] = await Promise.all([
    supabase
      .from('extinguishers')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('inspection_types')
      .select('*')
      .order('interval_months', { ascending: true }),
    supabase
      .from('organizations')
      .select('require_photo_on_failure')
      .eq('id', userData.profile.organization_id!)
      .single(),
  ])

  if (extResult.error || !extResult.data) notFound()

  const extinguisher = extResult.data as Extinguisher
  const inspectionTypes = (typesResult.data ?? []) as InspectionType[]
  const requirePhotoOnFailure = (orgResult.data as Pick<Organization, 'require_photo_on_failure'> | null)?.require_photo_on_failure ?? false

  return (
    <div className="space-y-4">
      {/* Extinguisher header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">
            {extinguisher.barcode ?? 'No Barcode'}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {extinguisher.type.replace(/_/g, ' ')}
            {extinguisher.size ? ` — ${extinguisher.size}` : ''}
          </p>
          {extinguisher.specific_location && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {extinguisher.specific_location}
            </p>
          )}
        </div>
        <Badge variant={statusColors[extinguisher.status] ?? 'outline'}>
          {statusLabels[extinguisher.status] ?? extinguisher.status}
        </Badge>
      </div>

      {/* Checklist form */}
      <ChecklistForm
        extinguisher={extinguisher}
        inspectionTypes={inspectionTypes}
        requirePhotoOnFailure={requirePhotoOnFailure}
      />
    </div>
  )
}
