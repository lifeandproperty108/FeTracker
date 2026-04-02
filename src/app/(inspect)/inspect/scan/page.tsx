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
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-sm text-muted-foreground mb-3">
              Or enter the extinguisher ID manually:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Barcode or ID..."
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1 h-12 text-base"
              />
              <Button
                type="submit"
                size="lg"
                disabled={!manualId.trim()}
                className="h-12 px-4"
              >
                <Search className="size-5" />
                <span className="sr-only">Go</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
