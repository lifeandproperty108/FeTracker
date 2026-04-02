'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { User, UserRole } from '@/lib/types/database'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'facility_manager', label: 'Facility Manager' },
  { value: 'technician', label: 'Technician' },
  { value: 'auditor', label: 'Auditor' },
]

const ROLE_BADGE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  super_admin: 'default',
  org_admin: 'default',
  facility_manager: 'secondary',
  technician: 'outline',
  auditor: 'outline',
}

function formatRole(role: UserRole): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface MemberTableProps {
  members: User[]
  currentUserId: string
  isAdmin: boolean
}

export function MemberTable({ members, currentUserId, isAdmin }: MemberTableProps) {
  const [roles, setRoles] = useState<Record<string, UserRole>>(() => {
    const initial: Record<string, UserRole> = {}
    for (const m of members) {
      initial[m.id] = m.role
    }
    return initial
  })

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const previousRole = roles[userId]
    setRoles((prev) => ({ ...prev, [userId]: newRole }))

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to update role')
      }

      toast.success('Role updated successfully')
    } catch (err) {
      // Revert on failure
      setRoles((prev) => ({ ...prev, [userId]: previousRole }))
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isSelf = member.id === currentUserId
          const isSuperAdmin = member.role === 'super_admin'
          const canChangeRole = isAdmin && !isSelf && !isSuperAdmin

          return (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.full_name}</TableCell>
              <TableCell className="text-muted-foreground">{member.email}</TableCell>
              <TableCell>
                {canChangeRole ? (
                  <Select
                    value={roles[member.id]}
                    onValueChange={(val) => handleRoleChange(member.id, val as UserRole)}
                  >
                    <SelectTrigger size="sm" className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={ROLE_BADGE_VARIANT[member.role]}>
                    {formatRole(member.role)}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">Active</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(member.created_at)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
