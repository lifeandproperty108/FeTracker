'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LocationFormProps {
  initialData?: {
    id: string
    name: string
    address: string | null
    facility_manager_email: string | null
  }
}

export function LocationForm({ initialData }: LocationFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [facilityManagerEmail, setFacilityManagerEmail] = useState(
    initialData?.facility_manager_email ?? ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/locations/${initialData.id}`
        : '/api/locations'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          facility_manager_email: facilityManagerEmail.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      const location = await res.json()
      router.push(`/dashboard/locations/${location.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Location' : 'New Location'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Office Building"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, state, zip"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility_manager_email">
              Facility Manager Email
            </Label>
            <Input
              id="facility_manager_email"
              type="email"
              value={facilityManagerEmail}
              onChange={(e) => setFacilityManagerEmail(e.target.value)}
              placeholder="manager@example.com"
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
                  : 'Create Location'}
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
