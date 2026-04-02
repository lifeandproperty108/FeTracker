'use client'

import { useEffect, useState } from 'react'
import { generateQRDataURL } from '@/lib/qr'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

interface ExtinguisherQRSectionProps {
  extinguisherId: string
}

export function ExtinguisherQRSection({ extinguisherId }: ExtinguisherQRSectionProps) {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateQRDataURL(extinguisherId)
      .then(setQrDataURL)
      .finally(() => setLoading(false))
  }, [extinguisherId])

  function handleDownload() {
    if (!qrDataURL) return
    const link = document.createElement('a')
    link.href = qrDataURL
    link.download = `qr-${extinguisherId}.png`
    link.click()
  }

  if (loading) {
    return <Loader2 className="size-8 animate-spin text-muted-foreground" />
  }

  if (!qrDataURL) {
    return <p className="text-sm text-muted-foreground">Failed to generate QR code.</p>
  }

  return (
    <>
      <img
        src={qrDataURL}
        alt={`QR code for extinguisher ${extinguisherId}`}
        className="size-40 rounded border"
      />
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="mr-2 size-4" />
        Download QR
      </Button>
    </>
  )
}
