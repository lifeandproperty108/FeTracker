'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Trash2,
  Pencil,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuoteStatus } from '@/lib/types/database'

interface QuoteActionsProps {
  quoteId: string
  status: QuoteStatus
  invoiceId?: string | null
}

export function QuoteActions({ quoteId, status, invoiceId }: QuoteActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(action: string) {
    setLoading(true)
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' })
        if (res.ok) {
          router.push('/dashboard/quotes')
          return
        }
        const data = await res.json()
        alert(data.error || 'Failed to delete quote')
      } else if (action === 'send' || action === 'convert') {
        const res = await fetch(`/api/quotes/${quoteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (res.ok) {
          const data = await res.json()
          if (action === 'convert' && data.invoice_id) {
            router.push(`/dashboard/invoices/${data.invoice_id}`)
            return
          }
          router.refresh()
        } else {
          const data = await res.json()
          alert(data.error || `Failed to ${action} quote`)
        }
      } else if (action === 'approve' || action === 'decline') {
        const newStatus = action === 'approve' ? 'approved' : 'declined'
        const res = await fetch(`/api/quotes/${quoteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (res.ok) {
          router.refresh()
        } else {
          const data = await res.json()
          alert(data.error || `Failed to ${action} quote`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <Link href="/dashboard/quotes">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 size-4" />
          Back to Quotes
        </Button>
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        {status === 'draft' && (
          <>
            <Link href={`/dashboard/quotes/${quoteId}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleAction('send')}
            >
              <Send className="mr-2 size-4" />
              Send
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleAction('delete')}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </>
        )}

        {status === 'sent' && (
          <>
            <Button
              size="sm"
              disabled={loading}
              onClick={() => handleAction('approve')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 size-4" />
              Mark Approved
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleAction('decline')}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="mr-2 size-4" />
              Mark Declined
            </Button>
          </>
        )}

        {status === 'approved' && (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => handleAction('convert')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ArrowRightLeft className="mr-2 size-4" />
            Convert to Invoice
          </Button>
        )}

        {status === 'converted' && invoiceId && (
          <Link href={`/dashboard/invoices/${invoiceId}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 size-4" />
              View Invoice
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
