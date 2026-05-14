'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Banknote, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCashOut } from '@/actions/transactions'
import type { Wallet } from '@/lib/db/schema'
import { formatUSD } from '@/lib/utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export function CashOutForm({
  wallets,
  avgFeePct,
  onDone,
}: {
  wallets: Wallet[]
  avgFeePct: number | null
  onDone: () => void
}) {
  const virtualWallets = wallets.filter((w) => w.type === 'virtual')
  const physicalWallets = wallets.filter((w) => w.type === 'physical')
  const [date, setDate] = useState(today())
  const [from, setFrom] = useState(virtualWallets[0]?.id ?? '')
  const [to, setTo] = useState(physicalWallets[0]?.id ?? '')
  const [gross, setGross] = useState('')
  const [feePct, setFeePct] = useState('2.5')
  const [notes, setNotes] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const g = parseFloat(gross) || 0
  const f = parseFloat(feePct) || 0
  const feeUsd = g * (f / 100)
  const net = g - feeUsd

  const submit = async () => {
    setSubmitting(true)
    const res = await createCashOut({
      date,
      fromWalletId: from,
      toWalletId: to,
      grossAmount: g,
      feePercentage: f,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success(`Listo. USD ${formatUSD(net)} a los billetes. Te costó USD ${formatUSD(feeUsd)}.`)
      onDone()
    } else toast.error(res.error)
  }

  if (confirming) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-accent-orange/20 bg-accent-orange/5 p-5 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-accent-orange mb-2" />
          <p className="text-sm text-text-primary">
            Vas a perder{' '}
            <span className="font-mono tabular-nums font-semibold text-accent-orange">
              USD {formatUSD(feeUsd)}
            </span>{' '}
            en comisión.
          </p>
          <p className="text-xs text-text-muted mt-1">¿Seguís?</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting} className="flex-1">
            {submitting ? 'Guardando…' : 'Sí, confirmo'}
          </Button>
        </div>
      </div>
    )
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!g) return toast.error('Cargá el monto a extraer')
    if (!from || !to) return toast.error('Faltan bolsillos')
    setConfirming(true)
  }

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <Field label="Fecha">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <Field label="¿De qué bolsillo extraés?">
        <Select value={from} onValueChange={setFrom}>
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

      <Field label="¿Cuánto extraés (bruto)?">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={gross}
          onChange={(e) => setGross(e.target.value)}
          placeholder="1000"
          required
          className="font-mono tabular-nums text-lg"
        />
      </Field>

      <Field label="Comisión financiera (%)">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={feePct}
          onChange={(e) => setFeePct(e.target.value)}
          required
          className="font-mono tabular-nums"
        />
      </Field>

      {g > 0 && (
        <div className="rounded-xl border border-accent-orange/20 bg-accent-orange/5 p-3 space-y-1.5 text-sm">
          <Row label="💸 Comisión" value={`USD ${formatUSD(feeUsd)}`} sub="se pierde" tone="orange" />
          <Row
            label="💵 Recibirás"
            value={`USD ${formatUSD(net)}`}
            sub="→ Físicos"
            tone="green"
          />
          {avgFeePct !== null && (
            <Row
              label="📊 Tu promedio"
              value={`${avgFeePct.toFixed(2)}%`}
              sub={`Esta vez: ${f.toFixed(2)}%`}
              tone="muted"
            />
          )}
        </div>
      )}

      <Field label="¿A qué bolsillo va?">
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí" />
          </SelectTrigger>
          <SelectContent>
            {physicalWallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="flex items-center gap-2">
                  <Banknote className="h-3 w-3" style={{ color: w.color }} />
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
        <Button type="submit" variant="primary" className="flex-1">
          Continuar
        </Button>
      </div>
    </form>
  )
}

function Row({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone: 'orange' | 'green' | 'muted'
}) {
  const colors = {
    orange: 'text-accent-orange',
    green: 'text-accent-green',
    muted: 'text-text-secondary',
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right">
        <span className={`font-mono tabular-nums ${colors[tone]}`}>{value}</span>
        {sub && <span className="ml-2 text-[11px] text-text-muted">{sub}</span>}
      </span>
    </div>
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
