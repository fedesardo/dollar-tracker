'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createIncome } from '@/actions/transactions'
import type { Wallet, Owner } from '@/lib/db/schema'
import { cn } from '@/lib/utils/cn'

const today = () => new Date().toISOString().slice(0, 10)

export type IncomePrefill = {
  date?: string
  beneficiary?: Owner
  amountUsd?: number
  walletId?: string
}

export function IncomeForm({
  wallets,
  prefill,
  onDone,
}: {
  wallets: Wallet[]
  prefill?: IncomePrefill
  onDone: () => void
}) {
  const virtualWallets = wallets.filter((w) => w.type === 'virtual')
  const [date, setDate] = useState(prefill?.date ?? today())
  const [beneficiary, setBeneficiary] = useState<'fede' | 'flor'>(
    (prefill?.beneficiary === 'fede' || prefill?.beneficiary === 'flor')
      ? prefill.beneficiary
      : 'flor',
  )
  const [amountUsd, setAmountUsd] = useState<string>(
    prefill?.amountUsd ? String(prefill.amountUsd) : '',
  )
  const [walletId, setWalletId] = useState<string>(
    prefill?.walletId ?? virtualWallets[0]?.id ?? '',
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const usd = parseFloat(amountUsd)
    if (!usd || usd <= 0) return toast.error('Cargá un monto válido')
    if (!walletId) return toast.error('Elegí un bolsillo')

    setSubmitting(true)
    const res = await createIncome({
      date,
      beneficiary,
      amountUsd: usd,
      walletId,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success(`¡Joya! Sueldo de ${beneficiary === 'flor' ? 'Flor' : 'Fede'} registrado.`)
      onDone()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="¿De quién?">
          <div className="flex gap-1 rounded-xl bg-bg-elevated p-1">
            {(['flor', 'fede'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setBeneficiary(o)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm transition-colors',
                  beneficiary === o
                    ? 'bg-bg-card text-text-primary shadow'
                    : 'text-text-muted',
                )}
              >
                {o === 'flor' ? 'Flor' : 'Fede'}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="¿Cuánto?">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="2200.00"
          value={amountUsd}
          onChange={(e) => setAmountUsd(e.target.value)}
          required
          className="font-mono tabular-nums text-lg"
        />
      </Field>

      <Field label="¿A qué bolsillo?">
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí" />
          </SelectTrigger>
          <SelectContent>
            {virtualWallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: w.color }} />
                  {w.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Notas">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Guardando…' : 'Guardar sueldo'}
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
