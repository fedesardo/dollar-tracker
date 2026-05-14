'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiWalletSelector, type LegRow } from '@/components/transactions/MultiWalletSelector'
import { createExpense } from '@/actions/transactions'
import { expenseCategories } from '@/lib/validations/transaction'
import type { Wallet } from '@/lib/db/schema'

const today = () => new Date().toISOString().slice(0, 10)

export function ExpenseForm({ wallets, onDone }: { wallets: Wallet[]; onDone: () => void }) {
  const usable = wallets.filter((w) => w.type !== 'receivable')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [totalUsd, setTotalUsd] = useState('')
  const [category, setCategory] = useState<(typeof expenseCategories)[number]>('Hogar')
  const [legs, setLegs] = useState<LegRow[]>([
    { walletId: usable[0]?.id ?? '', amountUsd: 0 },
  ])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = parseFloat(totalUsd) || 0
  const sum = legs.reduce((s, l) => s + l.amountUsd, 0)
  const legsOk = total > 0 && Math.abs(sum - total) < 0.01

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description) return toast.error('Cargá una descripción')
    if (!total) return toast.error('Cargá el monto total')
    if (!legsOk) return toast.error('La suma de los orígenes no coincide')

    setSubmitting(true)
    const res = await createExpense({
      date,
      description,
      totalUsd: total,
      category,
      legs,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success('Listo. Egreso cargado.')
      onDone()
    } else toast.error(res.error)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Categoría">
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="¿En qué?">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: alquiler mayo"
          required
        />
      </Field>

      <Field label="¿Cuánto en total?">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={totalUsd}
          onChange={(e) => setTotalUsd(e.target.value)}
          required
          className="font-mono tabular-nums text-lg"
        />
      </Field>

      <Field label="¿De qué bolsillos sale?">
        <MultiWalletSelector
          wallets={usable}
          legs={legs}
          total={total}
          onChange={setLegs}
          direction="out"
        />
      </Field>

      <Field label="Notas">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={submitting || !legsOk} className="flex-1">
          {submitting ? 'Guardando…' : 'Guardar egreso'}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
