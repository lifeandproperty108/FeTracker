import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { FileText, Download, ClipboardCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ReportsForm } from './reports-form'

export default async function ReportsPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  if (!profile.organization_id) redirect('/dashboard')

  const supabase = await createClient()

  // Fetch locations for filter dropdown
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .order('name')

  // Fetch recent inspections for certificate downloads
  const { data: recentInspections } = await supabase
    .from('inspections')
    .select(
      'id, performed_at, result, extinguisher_id, extinguishers(barcode, type, locations(name)), users!inspections_technician_id_fkey(full_name), inspection_types(name)'
    )
    .eq('organization_id', profile.organization_id)
    .order('performed_at', { ascending: false })
    .limit(20)

  const inspectionRows = (recentInspections ?? []).map((insp) => {
    const ext = insp.extinguishers as unknown as {
      barcode: string | null
      type: string
      locations: { name: string } | null
    } | null
    const tech = insp.users as unknown as { full_name: string } | null
    const inspType = insp.inspection_types as unknown as { name: string } | null

    return {
      id: insp.id as string,
      performed_at: insp.performed_at as string,
      result: insp.result as string,
      barcode: ext?.barcode ?? '--',
      type: (ext?.type ?? '').replace(/_/g, ' '),
      location: ext?.locations?.name ?? '--',
      technician: tech?.full_name ?? '--',
      inspection_type: (inspType?.name ?? '').replace(/_/g, ' '),
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      </div>

      {/* Generate Report Section */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ClipboardCheck className="size-5 text-red-600" />
            Generate Compliance Report
          </h2>
          <ReportsForm locations={locations ?? []} />
        </CardContent>
      </Card>

      {/* Inspection Certificates Section */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Download className="size-5 text-red-600" />
            Inspection Certificates
          </h2>
          {inspectionRows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No inspections found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Barcode</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Location</th>
                    <th className="pb-2 pr-4 font-medium">Technician</th>
                    <th className="pb-2 pr-4 font-medium">Result</th>
                    <th className="pb-2 font-medium">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionRows.map((insp) => (
                    <tr key={insp.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 tabular-nums">
                        {new Date(insp.performed_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {insp.barcode}
                      </td>
                      <td className="py-3 pr-4 capitalize">{insp.type}</td>
                      <td className="py-3 pr-4">{insp.location}</td>
                      <td className="py-3 pr-4">{insp.technician}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            insp.result === 'pass'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {insp.result.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        <a
                          href={`/api/reports/certificate/${insp.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Download className="size-3" />
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
