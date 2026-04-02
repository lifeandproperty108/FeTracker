'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

export interface LineItemRow {
  id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface LineItemEditorProps {
  items: LineItemRow[]
  onChange: (items: LineItemRow[]) => void
  readOnly?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function LineItemEditor({ items, onChange, readOnly = false }: LineItemEditorProps) {
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  function updateItem(index: number, field: keyof LineItemRow, value: string | number) {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        next.amount = Number(next.quantity) * Number(next.unit_price)
      }
      return next
    })
    onChange(updated)
  }

  function addRow() {
    onChange([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[45%]">Description</TableHead>
            <TableHead className="w-[15%] text-right">Qty</TableHead>
            <TableHead className="w-[20%] text-right">Unit Price</TableHead>
            <TableHead className="w-[15%] text-right">Amount</TableHead>
            {!readOnly && <TableHead className="w-[5%]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={readOnly ? 4 : 5}
                className="text-center text-muted-foreground py-8"
              >
                No line items yet. Click &quot;Add Row&quot; to get started.
              </TableCell>
            </TableRow>
          )}
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                {readOnly ? (
                  <span>{item.description}</span>
                ) : (
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Service description..."
                    className="h-8"
                  />
                )}
              </TableCell>
              <TableCell className="text-right">
                {readOnly ? (
                  <span className="tabular-nums">{item.quantity}</span>
                ) : (
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className="h-8 text-right"
                  />
                )}
              </TableCell>
              <TableCell className="text-right">
                {readOnly ? (
                  <span className="tabular-nums">{formatCurrency(item.unit_price)}</span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                    className="h-8 text-right"
                  />
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCurrency(item.amount)}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={readOnly ? 3 : 3} className="text-right font-semibold">
              Total
            </TableCell>
            <TableCell className="text-right tabular-nums font-bold text-base">
              {formatCurrency(total)}
            </TableCell>
            {!readOnly && <TableCell />}
          </TableRow>
        </TableFooter>
      </Table>

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 size-4" />
          Add Row
        </Button>
      )}
    </div>
  )
}
