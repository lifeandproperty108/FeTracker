'use client'

import { useEffect, useState } from 'react'
import { generateQRDataURL } from '@/lib/qr'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'

interface ExtinguisherLabel {
  id: string
  barcode: string | null
  type: string
  specific_location: string | null
}

interface LabelWithQR extends ExtinguisherLabel {
  qrDataURL: string
}

interface QRLabelSheetProps {
  locationId: string
  locationName: string
}

export function QRLabelSheet({ locationId, locationName }: QRLabelSheetProps) {
  const [labels, setLabels] = useState<LabelWithQR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAndGenerate() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `/api/extinguishers/qr-labels?location_id=${encodeURIComponent(locationId)}`
        )
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? 'Failed to fetch extinguishers')
        }

        const { extinguishers } = (await res.json()) as {
          extinguishers: ExtinguisherLabel[]
        }

        const withQR = await Promise.all(
          extinguishers.map(async (ext) => ({
            ...ext,
            qrDataURL: await generateQRDataURL(ext.id),
          }))
        )

        setLabels(withQR)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAndGenerate()
  }, [locationId])

  function formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 1) + '\u2026'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">
          Generating QR labels...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center text-destructive">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (labels.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>No extinguishers found at this location.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Controls - hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-lg font-semibold">
            QR Labels &mdash; {locationName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {labels.length} label{labels.length !== 1 ? 's' : ''} ready to print
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 size-4" />
          Print Labels
        </Button>
      </div>

      {/* Label grid */}
      <div className="label-grid">
        {labels.map((label) => (
          <div key={label.id} className="label-cell">
            <img
              src={label.qrDataURL}
              alt={`QR code for ${label.barcode ?? label.id}`}
              className="label-qr"
            />
            <div className="label-text">
              <span className="label-barcode">
                {label.barcode ?? label.id.slice(0, 8)}
              </span>
              <span className="label-type">{formatType(label.type)}</span>
              {label.specific_location && (
                <span className="label-location">
                  {truncate(label.specific_location, 30)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Styles for screen and print */}
      <style jsx>{`
        .label-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.25in;
        }

        .label-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed #ccc;
          border-radius: 4px;
          padding: 0.15in 0.1in;
          text-align: center;
          page-break-inside: avoid;
          break-inside: avoid;
          height: 1in;
        }

        .label-qr {
          width: 0.65in;
          height: 0.65in;
          object-fit: contain;
        }

        .label-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          margin-top: 2px;
        }

        .label-barcode {
          font-size: 7pt;
          font-weight: 700;
          font-family: monospace;
          line-height: 1.1;
        }

        .label-type {
          font-size: 6pt;
          color: #555;
          line-height: 1.1;
        }

        .label-location {
          font-size: 5.5pt;
          color: #777;
          line-height: 1.1;
          max-width: 2in;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media print {
          .label-grid {
            gap: 0;
          }

          .label-cell {
            border: none;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  )
}
