'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChecklistItem } from '@/components/inspect/checklist-item'
import { Loader2 } from 'lucide-react'
import type {
  Extinguisher,
  InspectionType,
  ChecklistTemplate,
} from '@/lib/types/database'

interface ItemState {
  passed: boolean | null
  notes: string
  photoUrl: string | null
}

interface ChecklistFormProps {
  extinguisher: Extinguisher
  inspectionTypes: InspectionType[]
  requirePhotoOnFailure: boolean
}

export function ChecklistForm({
  extinguisher,
  inspectionTypes,
  requirePhotoOnFailure,
}: ChecklistFormProps) {
  const router = useRouter()
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [items, setItems] = useState<Record<string, ItemState>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTypeSelect = useCallback(
    async (typeId: string) => {
      setSelectedTypeId(typeId)
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('inspection_type_id', typeId)
        .eq('extinguisher_type', extinguisher.type)
        .order('item_order', { ascending: true })

      if (fetchError) {
        setError('Failed to load checklist items.')
        setLoading(false)
        return
      }

      const checklistTemplates = (data ?? []) as ChecklistTemplate[]
      setTemplates(checklistTemplates)

      // Initialize item state
      const initial: Record<string, ItemState> = {}
      for (const t of checklistTemplates) {
        initial[t.id] = { passed: null, notes: '', photoUrl: null }
      }
      setItems(initial)
      setLoading(false)
    },
    [extinguisher.type]
  )

  const handleItemChange = useCallback(
    (templateId: string, value: ItemState) => {
      setItems((prev) => ({ ...prev, [templateId]: value }))
    },
    []
  )

  const totalItems = templates.length
  const checkedCount = useMemo(
    () => Object.values(items).filter((v) => v.passed !== null).length,
    [items]
  )
  const allChecked = totalItems > 0 && checkedCount === totalItems

  const handleSubmit = useCallback(async () => {
    if (!selectedTypeId || !allChecked) return
    setSubmitting(true)
    setError(null)

    try {
      const body = {
        extinguisher_id: extinguisher.id,
        inspection_type_id: selectedTypeId,
        items: templates.map((t) => ({
          checklist_template_id: t.id,
          passed: items[t.id].passed,
          notes: items[t.id].notes || null,
          photo_url: items[t.id].photoUrl || null,
        })),
        notes: notes || null,
      }

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      const inspection = await res.json()
      router.push(
        `/inspect/extinguisher/${extinguisher.id}/complete?inspection_id=${inspection.id}`
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed'
      setError(message)
      setSubmitting(false)
    }
  }, [selectedTypeId, allChecked, extinguisher.id, templates, items, notes, router])

  return (
    <div className="pb-24">
      {/* Inspection type selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Inspection Type</label>
        <div className="flex flex-wrap gap-2">
          {inspectionTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedTypeId === type.id ? 'default' : 'outline'}
              size="lg"
              className="capitalize min-h-[48px]"
              onClick={() => handleTypeSelect(type.id)}
              disabled={submitting}
            >
              {type.name.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mt-4">
          {error}
        </div>
      )}

      {/* Checklist items */}
      {!loading && templates.length > 0 && (
        <div className="mt-4 space-y-3">
          {templates.map((template) => (
            <ChecklistItem
              key={template.id}
              item={template}
              value={items[template.id]}
              onChange={(value) => handleItemChange(template.id, value)}
              requirePhoto={requirePhotoOnFailure && template.is_critical}
            />
          ))}

          {/* General notes */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">
              General Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this inspection..."
              className="min-h-[80px]"
              disabled={submitting}
            />
          </div>
        </div>
      )}

      {/* Empty state when type selected but no templates */}
      {!loading && selectedTypeId && templates.length === 0 && !error && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No checklist items found for this inspection type and extinguisher
          type.
        </p>
      )}

      {/* Sticky bottom bar */}
      {templates.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 safe-area-pb">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {checkedCount} of {totalItems} checked
            </span>
            <Button
              size="lg"
              className="min-h-[48px] flex-1 max-w-[200px]"
              disabled={!allChecked || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                'Submit Inspection'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
