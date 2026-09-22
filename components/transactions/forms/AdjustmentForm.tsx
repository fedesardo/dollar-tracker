'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAdjustment } from '@/actions/transactions'
import { formatUSD } from '@/lib/utils/format'
import type { Wallet } from '@/lib/db/schema'

const today = () => new Date().toISOString().slice(0, 10)

export function AdjustmentForm({
  wallets,
  walletBalances,
  onDone,
}: {
  wallets: Wallet[]
  walletBalances: Record<string, number>
  onDone: () => void
}) {
  const usable = wallets.filter((w) => w.type !== 'receivable')
  const [date, setDate] = useState(today())
  const [walletId, setWalletId] = useState(usable[0]?.id ?? '')
  const [realBalance, setRealBalance] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentBalance = walletBalances[walletId] ?? 0
  const delta = useMemo(() => {
    const real = parseFloat(realBalance)
    if (!Number.isFinite(real)) return null
    return real - currentBalance
  }, [realBalance, currentBalance])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (delta === null) return toast.error('Cargá el saldo real')
    if (Math.abs(delta) < 0.01) return toast.error('Ese ya es el saldo que tenés cargado, no hace falta ajustar')
    setSubmitting(true)
    const res = await createAdjustment({
      date,
      walletId,
      deltaUsd: delta,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      const walletName = usable.find((w) => w.id === walletId)?.name
      toast.success(
        `Listo. Ajustamos ${walletName} en ${delta >= 0 ? '+' : '−'}USD ${formatUSD(Math.abs(delta))}.`,
      )
      onDone()
    } else toast.error(res.error)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-bg-elevated p-3 text-[11px] text-text-muted">
        Para cuando el saldo real de un bolsillo no coincide con lo que la app calculó (gastos que
        no se cargaron a tiempo). Esto no reescribe el pasado: solo corrige el saldo desde hoy en
        adelante, sin tocar el gráfico de meses anteriores.
      </div>

      <Field label="Fecha">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <Field label="¿Qué bolsillo?">
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí" />
          </SelectTrigger>
          <SelectContent>
            {usable.map((w) => (
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

      <div className="rounded-xl bg-bg-elevated px-3 py-2 text-xs text-text-secondary flex items-center justify-between">
        <span>Hoy la app dice que tiene</span>
        <span className="font-mono tabular-nums text-text-primary">USD {formatUSD(currentBalance)}</span>
      </div>

      <Field label="¿Cuánto tiene realmente hoy?">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={realBalance}
          onChange={(e) => setRealBalance(e.target.value)}
          required
          className="font-mono tabular-nums text-lg"
        />
      </Field>

      {delta !== null && Math.abs(delta) >= 0.01 && (
        <div
          className={`rounded-xl px-3 py-2 text-xs font-mono tabular-nums ${
            delta > 0 ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
          }`}
        >
          Se va a registrar un ajuste de {delta > 0 ? '+' : '−'}USD {formatUSD(Math.abs(delta))}
        </div>
      )}

      <Field label="¿Por qué? (opcional)">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ej: gastos con la tarjeta que no cargué en su momento"
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Guardando…' : 'Ajustar saldo'}
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
