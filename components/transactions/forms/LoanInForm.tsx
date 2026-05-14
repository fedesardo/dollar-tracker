'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiWalletSelector, type LegRow } from '@/components/transactions/MultiWalletSelector'
import { createLoanIn } from '@/actions/transactions'
import type { Wallet, Loan } from '@/lib/db/schema'
import { formatUSD, toNumber } from '@/lib/utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export function LoanInForm({
  wallets,
  loans,
  onDone,
  prefillLoanId,
}: {
  wallets: Wallet[]
  loans: Loan[]
  onDone: () => void
  prefillLoanId?: string
}) {
  const usable = wallets.filter((w) => w.type !== 'receivable')
  const active = loans.filter((l) => l.status === 'active' || l.status === 'partially_paid')
  const [date, setDate] = useState(today())
  const [loanId, setLoanId] = useState<string>(prefillLoanId ?? active[0]?.id ?? '')
  const [total, setTotal] = useState('')
  const [legs, setLegs] = useState<LegRow[]>([
    { walletId: usable[0]?.id ?? '', amountUsd: 0 },
  ])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const t = parseFloat(total) || 0
  const loan = useMemo(() => active.find((l) => l.id === loanId) ?? null, [active, loanId])
  const pending = loan ? toNumber(loan.totalAmount) - toNumber(loan.amountPaid) : 0
  const remaining = pending - t

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loanId) return toast.error('Elegí un préstamo')
    if (!t) return toast.error('Cargá el monto cobrado')
    const sum = legs.reduce((s, l) => s + l.amountUsd, 0)
    if (Math.abs(sum - t) > 0.01) return toast.error('La suma no coincide')

    setSubmitting(true)
    const res = await createLoanIn({
      date,
      loanId,
      totalUsd: t,
      legs,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success(`¡${loan?.debtorName} pagó! USD ${formatUSD(t)} de vuelta al bolsillo.`)
      onDone()
    } else toast.error(res.error)
  }

  if (active.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No hay préstamos activos. Cargá uno primero.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Préstamo">
        <Select value={loanId} onValueChange={setLoanId}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí" />
          </SelectTrigger>
          <SelectContent>
            {active.map((l) => {
              const pend = toNumber(l.totalAmount) - toNumber(l.amountPaid)
              return (
                <SelectItem key={l.id} value={l.id}>
                  {l.debtorName} — USD {formatUSD(pend)} pendientes
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Fecha">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <Field label="¿Cuánto te pagó?">
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

      {loan && t > 0 && (
        <div className="rounded-xl bg-bg-elevated p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Total cobrado</span>
            <span className="font-mono tabular-nums">USD {formatUSD(t)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-text-secondary">Queda pendiente</span>
            <span
              className={`font-mono tabular-nums ${
                remaining <= 0 ? 'text-accent-green' : 'text-accent-yellow'
              }`}
            >
              USD {formatUSD(Math.max(0, remaining))}
            </span>
          </div>
        </div>
      )}

      <Field label="¿A qué bolsillos entra?">
        <MultiWalletSelector
          wallets={usable}
          legs={legs}
          total={t}
          onChange={setLegs}
          direction="in"
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
          {submitting ? 'Guardando…' : 'Registrar cobro'}
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
