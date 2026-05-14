'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRates } from '@/components/shared/BlueRateBadge'
import { createPurchase } from '@/actions/transactions'
import type { Wallet } from '@/lib/db/schema'
import { formatARS, formatRate, formatUSD } from '@/lib/utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export function PurchaseForm({
  wallets,
  avgHistoricalRate,
  onDone,
}: {
  wallets: Wallet[]
  avgHistoricalRate: number | null
  onDone: () => void
}) {
  const usdWallets = wallets.filter((w) => w.type === 'virtual' || w.type === 'physical')
  const rates = useRates()
  const [date, setDate] = useState(today())
  const [amountArs, setAmountArs] = useState('')
  const [rate, setRate] = useState('')
  const [walletId, setWalletId] = useState(usdWallets[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ars = parseFloat(amountArs) || 0
  const r = parseFloat(rate) || 0
  const usd = r > 0 ? ars / r : 0

  const compareText = useMemo(() => {
    if (!avgHistoricalRate || !r) return null
    const diff = ((r - avgHistoricalRate) / avgHistoricalRate) * 100
    if (Math.abs(diff) < 0.5) return 'igual a tu promedio'
    if (diff < 0) return `${Math.abs(diff).toFixed(1)}% más barato que tu promedio`
    return `${diff.toFixed(1)}% más caro que tu promedio`
  }, [r, avgHistoricalRate])

  const useBlueNow = () => {
    if (rates?.blue) setRate(String(rates.blue.venta))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ars || !r || !walletId) return toast.error('Faltan datos')
    setSubmitting(true)
    const res = await createPurchase({
      date,
      amountArs: ars,
      exchangeRate: r,
      walletId,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success(`Dale. Compraste USD ${formatUSD(usd)} a ${formatRate(r)}.`)
      onDone()
    } else toast.error(res.error)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Fecha">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <Field label="¿Cuántos pesos?">
        <Input
          type="number"
          inputMode="decimal"
          step="1"
          value={amountArs}
          onChange={(e) => setAmountArs(e.target.value)}
          required
          className="font-mono tabular-nums text-lg"
        />
      </Field>

      <Field label="¿A qué cotización?">
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
            className="font-mono tabular-nums"
            placeholder="Ej: 1200"
          />
          <Button
            type="button"
            variant="outline"
            onClick={useBlueNow}
            disabled={!rates?.blue}
          >
            <RotateCw className="h-3.5 w-3.5" />
            {rates?.blue ? `Blue: ${formatRate(rates.blue.venta)}` : 'Cargando…'}
          </Button>
        </div>
      </Field>

      {usd > 0 && (
        <div className="rounded-xl border border-accent-yellow/20 bg-accent-yellow/5 p-3">
          <p className="text-xs text-text-muted uppercase tracking-wider">Vas a recibir</p>
          <p className="mt-1 font-mono tabular-nums text-2xl text-accent-yellow">
            USD {formatUSD(usd)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            por {formatARS(ars)}
            {compareText && <span className="ml-1.5 text-text-secondary">· {compareText}</span>}
          </p>
        </div>
      )}

      <Field label="¿A qué bolsillo?">
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí" />
          </SelectTrigger>
          <SelectContent>
            {usdWallets.map((w) => (
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
          {submitting ? 'Guardando…' : 'Confirmar compra'}
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
