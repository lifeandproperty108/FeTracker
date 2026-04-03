'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LineItemEditor, type LineItemRow } from '@/components/billing/line-item-editor'

interface Org {
  id: string
  name: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Org[]>([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItemRow[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch organizations
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/organizations')
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data)
      }
    }
    load()
  }, [])

  // Default issued_date to today, due_date to 30 days from now
  useEffect(() => {
    const today = new Date()
    setIssuedDate(today.toISOString().split('T')[0])
    const due = new Date()
    due.setDate(due.getDate() + 30)
    setDueDate(due.toISOString().split('T')[0])
  }, [])

  async function handleSubmit(sendImmediately: boolean) {
    setError(null)

    if (!selectedOrg) {
      setError('Please select a client organization.')
      return
    }

    const validItems = items.filter((i) => i.description.trim() !== '')
    if (validItems.length === 0) {
      setError('Add at least one line item with a description.')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrg,
          issued_date: issuedDate || null,
          due_date: dueDate || null,
          notes: notes || null,
          line_items: validItems.map((i, idx) => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            sort_order: idx,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create invoice')
      }

      const invoice = await res.json()

      // If user clicked "Send", immediately send the invoice
      if (sendImmediately) {
        await fetch(`/api/invoices/${invoice.id}/send`, {
          method: 'POST',
        })
      }

      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Client & Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Client Organization *</Label>
              <select
                id="organization"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select an organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issued_date">Issued Date</Label>
              <Input
                id="issued_date"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemEditor items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes or payment terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => handleSubmit(false)}
        >
          <Save className="mr-2 size-4" />
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          disabled={saving}
          onClick={() => handleSubmit(true)}
        >
          <Send className="mr-2 size-4" />
          {saving ? 'Saving...' : 'Save & Send'}
        </Button>
      </div>
    </div>
  )
}
