'use client'

import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PhotoCapture } from '@/components/inspect/photo-capture'
import { cn } from '@/lib/utils'
import type { ChecklistTemplate } from '@/lib/types/database'

interface ItemValue {
  passed: boolean | null
  notes: string
  photoUrl: string | null
}

interface ChecklistItemProps {
  item: ChecklistTemplate
  value: ItemValue
  onChange: (value: ItemValue) => void
  requirePhoto: boolean
}

export function ChecklistItem({
  item,
  value,
  onChange,
  requirePhoto,
}: ChecklistItemProps) {
  const { passed, notes, photoUrl } = value

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 transition-colors',
        passed === true && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
        passed === false && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
        passed === null && 'border-border'
      )}
    >
      {/* Item label */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium leading-snug pt-1">{item.item_label}</p>
        {item.is_critical && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
            Critical
          </span>
        )}
      </div>

      {/* Pass / Fail toggle buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          aria-label="Pass"
          aria-pressed={passed === true}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-3 min-h-[48px] text-sm font-medium transition-all active:scale-[0.97]',
            passed === true
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-border text-muted-foreground hover:border-green-400 hover:text-green-600'
          )}
          onClick={() =>
            onChange({ ...value, passed: true })
          }
        >
          <Check className="size-5" />
          Pass
        </button>

        <button
          type="button"
          aria-label="Fail"
          aria-pressed={passed === false}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-3 min-h-[48px] text-sm font-medium transition-all active:scale-[0.97]',
            passed === false
              ? 'border-red-600 bg-red-600 text-white'
              : 'border-border text-muted-foreground hover:border-red-400 hover:text-red-600'
          )}
          onClick={() =>
            onChange({ ...value, passed: false })
          }
        >
          <X className="size-5" />
          Fail
        </button>
      </div>

      {/* Failure details — shown when failed */}
      {passed === false && (
        <div className="mt-3 space-y-3">
          <Input
            placeholder="Notes about this failure..."
            value={notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            className="min-h-[44px]"
          />

          <div className="space-y-1">
            {requirePhoto && !photoUrl && (
              <p className="text-xs font-medium text-destructive">
                Photo required
              </p>
            )}
            <PhotoCapture
              currentUrl={photoUrl}
              onUpload={(url) => onChange({ ...value, photoUrl: url })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
