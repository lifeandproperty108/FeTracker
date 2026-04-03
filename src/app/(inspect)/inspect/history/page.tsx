import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function InspectHistoryPage() {
  const userData = await getUser()
  if (!userData) redirect('/login')

  const { profile } = userData
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, performed_at, result, extinguisher_id, extinguishers(barcode, location_id, locations(name)), inspection_types(name)'
    )
    .eq('technician_id', profile.id)
    .order('performed_at', { ascending: false })
    .limit(50)

  const rows = (inspections ?? []).map((insp: any) => {
    const ext = insp.extinguishers as any
    const loc = ext?.locations as any
    const inspType = insp.inspection_types as any

    return {
      id: insp.id as string,
      performed_at: insp.performed_at as string,
      result: insp.result as string,
      extinguisher_id: insp.extinguisher_id as string,
      extinguisher_barcode: (ext?.barcode as string | null) ?? null,
      location_name: (loc?.name as string) ?? 'Unknown',
      inspection_type: (inspType?.name as string) ?? 'Unknown',
    }
  })

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
      <div className="flex items-center gap-2">
        <ClipboardCheck className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-bold tracking-tight">
          Inspection History
        </h1>
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No inspections recorded yet. Scan a QR code to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Extinguisher</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((insp) => (
                  <TableRow key={insp.id}>
                    <TableCell className="tabular-nums">
                      {new Date(insp.performed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/inspect/extinguisher/${insp.extinguisher_id}`}
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        {insp.extinguisher_barcode ?? insp.extinguisher_id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>{insp.location_name}</TableCell>
                    <TableCell className="capitalize">
                      {insp.inspection_type}
                    </TableCell>
                    <TableCell>
                      {insp.result === 'pass' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="mr-1 size-3" />
                          Pass
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 size-3" />
                          Fail
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
