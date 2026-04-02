'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { QRScanner } from '@/components/inspect/qr-scanner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ScanPage() {
  const router = useRouter()
  const [manualId, setManualId] = useState('')

  const handleScan = useCallback(
    (extinguisherId: string) => {
      router.push(`/inspect/extinguisher/${extinguisherId}`)
    },
    [router]
  )

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = manualId.trim()
    if (trimmed) {
      router.push(`/inspect/extinguisher/${trimmed}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
      {/* Scanner — full width */}
      <div className="w-full">
        <QRScanner onScan={handleScan} />
      </div>

      {/* Manual entry */}
      <div className="px-4 sm:px-6 pb-4">
        <Card className="border-t-4 border-t-red-600">
          <CardContent className="py-5 px-4 space-y-3">
            <label htmlFor="manual-id" className="text-sm font-semibold block">
              Manual Entry
            </label>
            <p className="text-sm text-muted-foreground">
              Type the barcode or extinguisher ID printed on the label.
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                id="manual-id"
                type="text"
                placeholder="e.g. FE-2024-001"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1 h-14 text-base font-mono"
              />
              <Button
                type="submit"
                size="lg"
                disabled={!manualId.trim()}
                className="h-14 px-5"
              >
                <Search className="size-5 mr-1.5" />
                Go
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
