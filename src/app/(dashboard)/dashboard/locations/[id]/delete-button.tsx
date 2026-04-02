'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteLocationButtonProps {
  locationId: string
  locationName: string
}

export function DeleteLocationButton({
  locationId,
  locationName,
}: DeleteLocationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${locationName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete location')
      }

      router.push('/dashboard/locations')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="mr-2 size-4" />
      {loading ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
