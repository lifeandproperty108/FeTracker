'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'

interface PhotoCaptureProps {
  currentUrl: string | null
  onUpload: (url: string) => void
}

export function PhotoCapture({ currentUrl, onUpload }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(path)

      onUpload(urlData.publicUrl)
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      {currentUrl ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt="Inspection photo"
            className="h-24 w-24 rounded-lg object-cover border border-border"
          />
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px]"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Camera className="size-4 mr-1.5" />
            )}
            Replace Photo
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="min-h-[40px]"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-1.5" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="size-4 mr-1.5" />
              Take Photo
            </>
          )}
        </Button>
      )}
    </div>
  )
}
