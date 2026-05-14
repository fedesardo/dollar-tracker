'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Wallet } from '@/lib/db/schema'
import { formatUSD } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export type LegRow = { walletId: string; amountUsd: number }

export function MultiWalletSelector({
  wallets,
  legs,
  total,
  onChange,
  direction,
}: {
  wallets: Wallet[]
  legs: LegRow[]
  total: number
  onChange: (legs: LegRow[]) => void
  direction: 'in' | 'out'
}) {
  const sum = legs.reduce((s, l) => s + (Number.isFinite(l.amountUsd) ? l.amountUsd : 0), 0)
  const ok = total > 0 && Math.abs(sum - total) < 0.01

  const update = (i: number, patch: Partial<LegRow>) => {
    onChange(legs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  const remove = (i: number) => onChange(legs.filter((_, idx) => idx !== i))
  const add = () => onChange([...legs, { walletId: wallets[0]?.id ?? '', amountUsd: 0 }])

  return (
    <div className="space-y-2">
      {legs.map((leg, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={leg.walletId}
            onValueChange={(v) => update(i, { walletId: v })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={direction === 'in' ? 'A dónde' : 'De dónde'} />
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
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={Number.isFinite(leg.amountUsd) && leg.amountUsd !== 0 ? leg.amountUsd : ''}
            onChange={(e) => update(i, { amountUsd: parseFloat(e.target.value) || 0 })}
            placeholder="USD"
            className="w-32 text-right font-mono tabular-nums"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(i)}
            disabled={legs.length === 1}
            className="h-9 w-9 text-text-muted hover:text-accent-red"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="w-full justify-start">
        <Plus className="h-3.5 w-3.5" />
        Agregar {direction === 'in' ? 'destino' : 'origen'}
      </Button>
      <div
        className={cn(
          'flex items-center justify-between text-xs px-2 rounded-lg py-2',
          ok
            ? 'bg-accent-green/5 text-accent-green'
            : 'bg-bg-elevated text-text-muted',
        )}
      >
        <span>
          Asignado:{' '}
          <span className="font-mono tabular-nums">USD {formatUSD(sum)}</span>
        </span>
        <span>
          Total:{' '}
          <span className="font-mono tabular-nums">USD {formatUSD(total)}</span>{' '}
          {ok ? '✓' : '✗'}
        </span>
      </div>
    </div>
  )
}
