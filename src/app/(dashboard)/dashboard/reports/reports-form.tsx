'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'

interface LocationOption {
  id: string
  name: string
}

export function ReportsForm({ locations }: { locations: LocationOption[] }) {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split('T')[0]

  const [from, setFrom] = useState(thirtyDaysAgo)
  const [to, setTo] = useState(today)
  const [reportType, setReportType] = useState('building_compliance')
  const [locationId, setLocationId] = useState('')
  const [generating, setGenerating] = useState(false)

  function handleGenerate() {
    setGenerating(true)
    const params = new URLSearchParams({ from, to })
    if (locationId) params.set('location_id', locationId)
    // reportType is informational; all go to the compliance endpoint
    window.open(`/api/reports/compliance?${params.toString()}`, '_blank')
    // Reset after a brief delay
    setTimeout(() => setGenerating(false), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Date From */}
        <div className="space-y-1.5">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {/* Report Type */}
        <div className="space-y-1.5">
          <Label htmlFor="report-type">Report Type</Label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="building_compliance">
              Building Compliance Summary
            </option>
            <option value="full_org">Full Org Report</option>
            <option value="unit_history">Unit History</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="location-filter">Location (optional)</Label>
          <select
            id="location-filter"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={generating || !from || !to}>
        <FileText className="mr-2 size-4" />
        {generating ? 'Generating...' : 'Generate Report'}
      </Button>
    </div>
  )
}
