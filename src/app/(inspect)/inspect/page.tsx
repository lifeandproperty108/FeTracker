import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  QrCode,
  MapPin,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function InspectPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  const supabase = await createClient()

  // Fetch org locations for the "Select Location" card count
  let locationCount = 0
  if (profile.organization_id) {
    const { count } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)

    locationCount = count ?? 0
  }

  // Fetch recent inspections by this technician
  const { data: recentInspections } = await supabase
    .from('inspections')
    .select(
      'id, performed_at, result, extinguisher:extinguishers(id, barcode)'
    )
    .eq('technician_id', profile.id)
    .order('performed_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Ready to Inspect
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan a QR code or select a location to begin.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/inspect/scan" className="group">
          <Card className="border-t-4 border-t-red-600 transition-shadow hover:shadow-lg h-full">
            <CardContent className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20">
                <QrCode className="size-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold">Scan QR Code</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Point your camera at an extinguisher QR label
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inspect/locations" className="group">
          <Card className="border-t-4 border-t-blue-600 transition-shadow hover:shadow-lg h-full">
            <CardContent className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                <MapPin className="size-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold">Select Location</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {locationCount} location{locationCount !== 1 ? 's' : ''} available
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Inspections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Recent Inspections</h2>
        </div>

        {!recentInspections || recentInspections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No inspections recorded yet. Scan a QR code to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentInspections.map((insp: any) => {
              const ext = insp.extinguisher as {
                id: string
                barcode: string | null
              } | null
              return (
                <Link
                  key={insp.id}
                  href={ext ? `/inspect/extinguisher/${ext.id}` : '#'}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold font-mono truncate">
                          {ext?.barcode ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(insp.performed_at).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                      {insp.result === 'pass' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="mr-1 size-3" />
                          Pass
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="shrink-0">
                          <XCircle className="mr-1 size-3" />
                          Fail
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
