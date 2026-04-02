'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExtinguisherType } from '@/lib/types/database'

const EXTINGUISHER_TYPES: { value: ExtinguisherType; label: string }[] = [
  { value: 'water', label: 'Water' },
  { value: 'dry_chemical_stored', label: 'Dry Chemical (Stored Pressure)' },
  { value: 'dry_chemical_cartridge', label: 'Dry Chemical (Cartridge)' },
  { value: 'co2', label: 'CO2' },
  { value: 'wet_chemical', label: 'Wet Chemical' },
  { value: 'clean_agent', label: 'Clean Agent' },
  { value: 'dry_powder', label: 'Dry Powder (Class D)' },
  { value: 'foam', label: 'Foam' },
]

interface ExtinguisherFormProps {
  locationId: string
  initialData?: {
    id: string
    type: ExtinguisherType
    barcode: string | null
    size: string | null
    manufacturer: string | null
    model_number: string | null
    serial_number: string | null
    manufacture_date: string | null
    install_date: string | null
    specific_location: string | null
  }
}

export function ExtinguisherForm({ locationId, initialData }: ExtinguisherFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [type, setType] = useState<ExtinguisherType>(initialData?.type ?? 'dry_chemical_stored')
  const [barcode, setBarcode] = useState(initialData?.barcode ?? '')
  const [size, setSize] = useState(initialData?.size ?? '')
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer ?? '')
  const [modelNumber, setModelNumber] = useState(initialData?.model_number ?? '')
  const [serialNumber, setSerialNumber] = useState(initialData?.serial_number ?? '')
  const [manufactureDate, setManufactureDate] = useState(initialData?.manufacture_date ?? '')
  const [installDate, setInstallDate] = useState(initialData?.install_date ?? '')
  const [specificLocation, setSpecificLocation] = useState(initialData?.specific_location ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/extinguishers/${initialData.id}`
        : '/api/extinguishers'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          type,
          barcode: barcode.trim() || null,
          size: size.trim() || null,
          manufacturer: manufacturer.trim() || null,
          model_number: modelNumber.trim() || null,
          serial_number: serialNumber.trim() || null,
          manufacture_date: manufactureDate || null,
          install_date: installDate || null,
          specific_location: specificLocation.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      const extinguisher = await res.json()
      router.push(`/dashboard/extinguishers/${extinguisher.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Extinguisher' : 'New Extinguisher'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ExtinguisherType)}
              required
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {EXTINGUISHER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. FE-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 10 lb"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Kidde"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model_number">Model</Label>
              <Input
                id="model_number"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="Model number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacture_date">Manufacture Date</Label>
              <Input
                id="manufacture_date"
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="install_date">Install Date</Label>
              <Input
                id="install_date"
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specific_location">Specific Location</Label>
            <Input
              id="specific_location"
              value={specificLocation}
              onChange={(e) => setSpecificLocation(e.target.value)}
              placeholder="e.g. Near elevator on 2nd floor"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? 'Saving...'
                  : 'Creating...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Extinguisher'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
