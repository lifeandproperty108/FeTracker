'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronsUpDown, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface OrgSwitcherProps {
  organizations: { id: string; name: string }[]
  selectedOrgId: string | null
  selectedOrgName: string | null
}

export function OrgSwitcher({
  organizations,
  selectedOrgId,
  selectedOrgName,
}: OrgSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSelect(orgId: string | null) {
    setOpen(false)
    startTransition(async () => {
      await fetch('/api/org-switcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      router.refresh()
    })
  }

  return (
    <div
      data-tour="org-switcher"
      className="px-4 py-3 border-b border-border"
    >
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
        Viewing Organization
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              disabled={isPending}
            />
          }
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">
              {isPending
                ? 'Switching...'
                : selectedOrgName ?? 'Select organization'}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--anchor-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>
              <CommandGroup>
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.name}
                    onSelect={() => handleSelect(org.id)}
                    data-checked={selectedOrgId === org.id ? true : undefined}
                  >
                    <Building2 className="size-4 shrink-0" />
                    <span className="truncate">{org.name}</span>
                    {selectedOrgId === org.id && (
                      <Check className="ml-auto size-4 shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {selectedOrgId && (
            <div className="border-t border-border p-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => handleSelect(null)}
              >
                <X className="size-4 shrink-0" />
                Clear selection
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
