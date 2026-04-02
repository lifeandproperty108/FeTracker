import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import type { Inspection, InspectionType, Extinguisher } from '@/lib/types/database'

export default async function InspectionCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ inspection_id?: string }>
}) {
  const { id } = await params
  const { inspection_id } = await searchParams

  const userData = await getUser()
  if (!userData) notFound()
  if (!inspection_id) notFound()

  const supabase = await createClient()

  const [inspectionResult, extResult] = await Promise.all([
    supabase
      .from('inspections')
      .select('*, inspection_type:inspection_types(*)')
      .eq('id', inspection_id)
      .single(),
    supabase
      .from('extinguishers')
      .select('*')
      .eq('id', id)
      .single(),
  ])

  if (inspectionResult.error || !inspectionResult.data) notFound()
  if (extResult.error || !extResult.data) notFound()

  const inspection = inspectionResult.data as Inspection & {
    inspection_type: InspectionType
  }
  const extinguisher = extResult.data as Extinguisher

  const performedDate = new Date(inspection.performed_at).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  return (
    <div className="flex flex-col items-center text-center space-y-6 pt-8">
      {/* Success icon */}
      <div className="flex items-center justify-center size-20 rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Inspection Complete</h1>
        <p className="text-muted-foreground mt-1">
          The inspection has been recorded successfully.
        </p>
      </div>

      {/* Summary card */}
      <Card className="w-full max-w-sm text-left">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Date</span>
            <span className="text-sm font-medium">{performedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium capitalize">
              {inspection.inspection_type.name.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Result</span>
            <Badge
              variant={inspection.result === 'pass' ? 'default' : 'destructive'}
            >
              {inspection.result === 'pass' ? 'Pass' : 'Fail'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Extinguisher</span>
            <span className="text-sm font-medium">
              {extinguisher.barcode ?? extinguisher.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Extinguisher Type
            </span>
            <span className="text-sm font-medium capitalize">
              {extinguisher.type.replace(/_/g, ' ')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button
          size="lg"
          className="min-h-[48px] w-full"
          render={<Link href="/inspect" />}
        >
          Inspect Next Unit
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="min-h-[48px] w-full"
          render={<Link href="/dashboard" />}
        >
          Back to Home
        </Button>
      </div>
    </div>
  )
}
