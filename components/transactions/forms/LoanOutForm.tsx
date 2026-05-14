'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MultiWalletSelector, type LegRow } from '@/components/transactions/MultiWalletSelector'
import { createLoanOut } from '@/actions/transactions'
import type { Wallet } from '@/lib/db/schema'

const today = () => new Date().toISOString().slice(0, 10)

export function LoanOutForm({ wallets, onDone }: { wallets: Wallet[]; onDone: () => void }) {
  const usable = wallets.filter((w) => w.type !== 'receivable')
  const [date, setDate] = useState(today())
  const [debtor, setDebtor] = useState('')
  const [total, setTotal] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [legs, setLegs] = useState<LegRow[]>([
    { walletId: usable[0]?.id ?? '', amountUsd: 0 },
  ])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const t = parseFloat(total) || 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debtor) return toast.error('¿A quién le prestás?')
    const sum = legs.reduce((s, l) => s + l.amountUsd, 0)
    if (Math.abs(sum - t) > 0.01) return toast.error('La suma no coincide')

    setSubmitting(true)
    const res = await createLoanOut({
      date,
      debtorName: debtor,
      totalUsd: t,
      dueDate: dueDate || null,
      legs,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success(`Préstamo a ${debtor} registrado. Ojalá lo devuelvan pronto, che.`)
      onDone()
    } else toast.error(res.error)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="¿Cuándo te lo devuelven?">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Opcional"
          />
        </Field>
      </div>

      <Field label="¿A quién?">
        <Input
          value={debtor}
          onChange={(e) => setDebtor(e.target.value)}
          placeholder="Ej: Lucho"
          required
        />
      </Field>

      <Field label="¿Cuánto en total?">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          required
          className="font-mono tabular-nums text-lg"
        />
      </Field>

      <Field label="¿De qué bolsillos sale?">
        <MultiWalletSelector
          wallets={usable}
          legs={legs}
          total={t}
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
        <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Guardando…' : 'Registrar préstamo'}
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
