import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardStats, Location, Extinguisher, InspectionResult } from '@/lib/types/database'

export interface LocationWithStats {
  id: string
  name: string
  address: string | null
  extinguisher_count: number
  overdue_count: number
  due_soon_count: number
}

export interface InspectionSummary {
  id: string
  performed_at: string
  result: InspectionResult
  extinguisher_barcode: string | null
  extinguisher_id: string
  location_name: string
  inspection_type_name: string
}

export interface DashboardData {
  stats: DashboardStats
  locations: LocationWithStats[]
  recentInspections: InspectionSummary[]
}

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardData> {
  // Run all queries in parallel — RLS handles org scoping
  const [extinguishersRes, locationsRes, inspectionsRes] = await Promise.all([
    supabase.from('extinguishers').select('id, status, location_id'),
    supabase.from('locations').select('id, name, address'),
    supabase
      .from('inspections')
      .select(
        'id, performed_at, result, extinguisher_id, inspection_type_id, extinguishers(barcode, location_id), inspection_types(name)'
      )
      .order('performed_at', { ascending: false })
      .limit(10),
  ])

  const extinguishers: Pick<Extinguisher, 'id' | 'status' | 'location_id'>[] =
    extinguishersRes.data ?? []
  const locations: Pick<Location, 'id' | 'name' | 'address'>[] =
    locationsRes.data ?? []

  // Build stats
  const stats: DashboardStats = {
    total_extinguishers: extinguishers.length,
    compliant_count: extinguishers.filter((e) => e.status === 'compliant').length,
    due_soon_count: extinguishers.filter((e) => e.status === 'due_soon').length,
    overdue_count: extinguishers.filter((e) => e.status === 'overdue').length,
    out_of_service_count: extinguishers.filter(
      (e) => e.status === 'out_of_service'
    ).length,
  }

  // Build location stats
  const locationStats: LocationWithStats[] = locations.map((loc) => {
    const locExtinguishers = extinguishers.filter(
      (e) => e.location_id === loc.id
    )
    return {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      extinguisher_count: locExtinguishers.length,
      overdue_count: locExtinguishers.filter((e) => e.status === 'overdue')
        .length,
      due_soon_count: locExtinguishers.filter((e) => e.status === 'due_soon')
        .length,
    }
  })

  // Build recent inspections
  const rawInspections = inspectionsRes.data ?? []
  const recentInspections: InspectionSummary[] = rawInspections.map(
    (insp: any) => {
      // Supabase returns joined single rows as objects
      const ext = insp.extinguishers as any
      const inspType = insp.inspection_types as any
      const locationId = ext?.location_id as string | undefined
      const matchedLocation = locationId
        ? locations.find((l) => l.id === locationId)
        : undefined

      return {
        id: insp.id,
        performed_at: insp.performed_at,
        result: insp.result as InspectionResult,
        extinguisher_barcode: ext?.barcode ?? null,
        extinguisher_id: insp.extinguisher_id,
        location_name: matchedLocation?.name ?? 'Unknown',
        inspection_type_name: inspType?.name ?? 'Unknown',
      }
    }
  )

  return { stats, locations: locationStats, recentInspections }
}
