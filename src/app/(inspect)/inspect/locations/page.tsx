import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, MapPin, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

export default async function InspectLocationsPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  const supabase = await createClient()

  let locations: { id: string; name: string; address: string | null; extinguisher_count: number }[] = []

  if (profile.organization_id) {
    const { data } = await supabase
      .from('locations')
      .select('id, name, address, extinguishers(id)')
      .eq('organization_id', profile.organization_id)
      .order('name')

    locations = (data ?? []).map((loc: any) => ({
      id: loc.id as string,
      name: loc.name as string,
      address: loc.address as string | null,
      extinguisher_count: ((loc.extinguishers as { id: string }[]) ?? []).length,
    }))
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Link
        href="/inspect"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-1"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground shrink-0" />
          <h1 className="text-xl font-bold tracking-tight">
            Select a Location
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-7">
          {locations.length} location{locations.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Location cards */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No locations found for your organization.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <Link
              key={loc.id}
              href={`/inspect/location/${loc.id}`}
              className="block"
            >
              <Card className="transition-all hover:shadow-md hover:bg-muted/50 active:bg-muted">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 shrink-0">
                      <MapPin className="size-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold truncate">
                        {loc.name}
                      </p>
                      {loc.address && (
                        <p className="text-sm text-muted-foreground truncate">
                          {loc.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {loc.extinguisher_count} extinguisher{loc.extinguisher_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
