'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTransfer } from '@/actions/transactions'
import type { Wallet } from '@/lib/db/schema'

const today = () => new Date().toISOString().slice(0, 10)

export function TransferForm({ wallets, onDone }: { wallets: Wallet[]; onDone: () => void }) {
  const usable = wallets.filter((w) => w.type !== 'receivable')
  const [date, setDate] = useState(today())
  const [from, setFrom] = useState(usable[0]?.id ?? '')
  const [to, setTo] = useState(usable[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const usd = parseFloat(amount)
    if (!usd) return toast.error('Cargá un monto')
    if (from === to) return toast.error('No podés transferir al mismo bolsillo')
    setSubmitting(true)
    const res = await createTransfer({
      date,
      fromWalletId: from,
      toWalletId: to,
      amountUsd: usd,
      notes: notes || null,
    })
    setSubmitting(false)
    if (res.success) {
      const fromName = usable.find((w) => w.id === from)?.name
      const toName = usable.find((w) => w.id === to)?.name
      toast.success(`Hecho. USD pasaron de ${fromName} a ${toName}.`)
      onDone()
    } else toast.error(res.error)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Fecha">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde">
          <WalletSelect wallets={usable} value={from} onChange={setFrom} />
        </Field>
        <Field label="Hacia">
          <WalletSelect wallets={usable.filter((w) => w.id !== from)} value={to} onChange={setTo} />
        </Field>
      </div>

      <Field label="¿Cuánto?">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="font-mono tabular-nums text-lg"
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
          {submitting ? 'Guardando…' : 'Transferir'}
        </Button>
      </div>
    </form>
  )
}

function WalletSelect({
  wallets,
  value,
  onChange,
}: {
  wallets: Wallet[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Elegí" />
      </SelectTrigger>
      <SelectContent>
        {wallets.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: w.color }} />
              {w.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
