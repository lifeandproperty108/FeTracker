'use client'

import { useEffect, useState, useCallback } from 'react'
import { Settings, Upload, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface OrgSettings {
  id: string
  name: string
  slug: string
  logo_url: string | null
  require_photo_on_failure: boolean
}

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [requirePhoto, setRequirePhoto] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.status === 403) {
        setError('You do not have permission to access organization settings.')
        return
      }
      if (!res.ok) {
        setError('Failed to load settings.')
        return
      }
      const data: OrgSettings = await res.json()
      setOrg(data)
      setName(data.name)
      setRequirePhoto(data.require_photo_on_failure)
      setLogoPreview(data.logo_url)
    } catch {
      setError('Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function handleSaveName() {
    if (!name.trim()) {
      toast.error('Organization name is required.')
      return
    }
    setSavingName(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to save.')
        return
      }
      const updated: OrgSettings = await res.json()
      setOrg(updated)
      toast.success('Organization name updated.')
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSavingName(false)
    }
  }

  async function handleToggleRequirePhoto() {
    const newValue = !requirePhoto
    setRequirePhoto(newValue)
    setSavingPhoto(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ require_photo_on_failure: newValue }),
      })
      if (!res.ok) {
        setRequirePhoto(!newValue) // revert
        const data = await res.json()
        toast.error(data.error ?? 'Failed to save.')
        return
      }
      const updated: OrgSettings = await res.json()
      setOrg(updated)
      toast.success(
        newValue
          ? 'Photo requirement enabled for failed items.'
          : 'Photo requirement disabled for failed items.'
      )
    } catch {
      setRequirePhoto(!newValue) // revert
      toast.error('Failed to save.')
    } finally {
      setSavingPhoto(false)
    }
  }

  async function handleLogoUpload(file: File) {
    if (!org) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${org.id}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        toast.error(uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage
        .from('org-logos')
        .getPublicUrl(path)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // Update the org record with the new logo URL
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: publicUrl }),
      })

      if (res.ok) {
        setLogoPreview(publicUrl)
        setOrg((prev) => (prev ? { ...prev, logo_url: publicUrl } : prev))
        toast.success('Logo uploaded successfully.')
      }
    } catch {
      toast.error('Failed to upload logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleLogoUpload(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleLogoUpload(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Organization Info */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Organization Info</h2>
            <p className="text-sm text-muted-foreground">
              Update your organization name and details.
            </p>
          </div>
          <Separator />

          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={org?.slug ?? ''}
                readOnly
                disabled
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                The slug is used in URLs and cannot be changed.
              </p>
            </div>

            <Button onClick={handleSaveName} disabled={savingName}>
              {savingName && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Logo</h2>
            <p className="text-sm text-muted-foreground">
              Upload your organization logo. Max 2MB, image files only.
            </p>
          </div>
          <Separator />

          <div className="flex items-start gap-6 max-w-md">
            {/* Current logo preview */}
            <div className="shrink-0 flex items-center justify-center size-20 rounded-lg border bg-muted overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Organization logo"
                  className="size-full object-contain"
                />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground/50" />
              )}
            </div>

            {/* Upload area */}
            <label
              htmlFor="logo-upload"
              className="flex-1 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {uploadingLogo ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="size-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {uploadingLogo ? 'Uploading...' : 'Click or drag to upload'}
              </span>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileSelect}
                disabled={uploadingLogo}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Settings */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Inspection Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure how inspections work for your organization.
            </p>
          </div>
          <Separator />

          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1 pr-4">
              <Label htmlFor="require-photo" className="text-sm font-medium">
                Require photo on failed inspection items
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, technicians must attach a photo for any inspection
                item that fails. This helps document deficiencies for compliance
                records.
              </p>
            </div>
            <button
              id="require-photo"
              role="switch"
              type="button"
              aria-checked={requirePhoto}
              disabled={savingPhoto}
              onClick={handleToggleRequirePhoto}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                ${requirePhoto ? 'bg-primary' : 'bg-input'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block size-5 rounded-full bg-background shadow-lg ring-0
                  transition-transform duration-200 ease-in-out
                  ${requirePhoto ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
