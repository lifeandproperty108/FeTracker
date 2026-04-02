'use client'

import { useEffect, useRef, useState } from 'react'

interface QRScannerProps {
  onScan: (extinguisherId: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const scannerInstanceRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!scannerRef.current) return

    let mounted = true

    async function initScanner() {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode')

        if (!mounted) return

        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            rememberLastUsedCamera: true,
          },
          false
        )

        scannerInstanceRef.current = scanner

        scanner.render(
          (decodedText: string) => {
            // Extract extinguisher ID from URL or use raw value
            // Expected format: .../inspect/extinguisher/{id}
            const match = decodedText.match(
              /\/inspect\/extinguisher\/([a-zA-Z0-9-]+)/
            )
            const extinguisherId = match ? match[1] : decodedText
            onScan(extinguisherId)
          },
          (errorMessage: string) => {
            // Scan errors are normal (no QR in frame) — ignore
          }
        )
      } catch (err) {
        if (!mounted) return
        setError(
          'Camera access denied or not available. Please grant camera permissions and reload.'
        )
      }
    }

    initScanner()

    return () => {
      mounted = false
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.clear()
        } catch {
          // Scanner may already be cleared
        }
      }
    }
  }, [onScan])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/50 bg-destructive/5 p-8 text-center">
        <svg
          className="mb-3 size-10 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
        <p className="text-sm font-medium text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      <div id="qr-reader" ref={scannerRef} />
    </div>
  )
}
