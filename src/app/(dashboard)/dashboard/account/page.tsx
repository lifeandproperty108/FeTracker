'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  organization_name: string | null
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Admin',
  facility_manager: 'Facility Manager',
  technician: 'Technician',
  auditor: 'Auditor',
}

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/account')
      if (!res.ok) {
        setError('Failed to load account information.')
        return
      }
      const data: UserProfile = await res.json()
      setProfile(data)
      setFullName(data.full_name)
    } catch {
      setError('Failed to load account information.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function handleSave() {
    if (!fullName.trim()) {
      toast.error('Display name is required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to save.')
        return
      }
      const updated: UserProfile = await res.json()
      setProfile(updated)
      toast.success('Profile updated successfully.')
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
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
          <UserCircle className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Account</h1>
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
        <UserCircle className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
      </div>

      {/* Profile Info */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account details.
            </p>
          </div>
          <Separator />

          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="full-name">Display Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email ?? ''}
                readOnly
                disabled
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant="secondary">
                  {roleLabels[profile?.role ?? ''] ?? profile?.role}
                </Badge>
              </div>
            </div>

            {profile?.organization_name && (
              <div className="space-y-2">
                <Label>Organization</Label>
                <p className="text-sm">{profile.organization_name}</p>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
