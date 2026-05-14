'use client'

import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRates } from '@/components/shared/BlueRateBadge'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatARS, formatRate, formatUSD } from '@/lib/utils/format'

export function UsdSimulator() {
  const rates = useRates()
  const [ars, setArs] = useState('')

  const arsN = parseFloat(ars) || 0

  const rows = useMemo(() => {
    const r = [
      { label: 'Blue', rate: rates?.blue?.venta, color: 'text-accent-yellow' },
      { label: 'Oficial', rate: rates?.oficial?.venta, color: 'text-accent-blue' },
      { label: 'MEP', rate: rates?.mep?.venta, color: 'text-accent-cyan' },
      { label: 'CCL', rate: rates?.ccl?.venta, color: 'text-accent-purple' },
    ]
    return r
  }, [rates])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-4 w-4 text-accent-cyan" />
        <h3 className="font-display text-base font-semibold">Simulador de compra</h3>
        <InfoTooltip
          text="Ingresá un monto en pesos y te calcula cuántos USD obtenés según cada cotización (Blue, Oficial, MEP, CCL). No guarda nada, es solo para tantear antes de comprar."
          size="sm"
          className="ml-auto"
        />
      </div>
      <div className="space-y-1.5 mb-4">
        <Label>¿Cuántos pesos tenés?</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={ars}
          onChange={(e) => setArs(e.target.value)}
          placeholder="100000"
          className="font-mono tabular-nums text-lg"
        />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between rounded-xl bg-bg-elevated p-3 text-sm"
          >
            <div>
              <p className={`text-xs font-medium ${r.color}`}>{r.label}</p>
              {r.rate && (
                <p className="text-[11px] text-text-muted font-mono tabular-nums">
                  {formatRate(r.rate)}
                </p>
              )}
            </div>
            <p className="font-mono tabular-nums text-text-primary">
              {arsN > 0 && r.rate ? `USD ${formatUSD(arsN / r.rate)}` : '—'}
            </p>
          </div>
        ))}
      </div>
      {arsN > 0 && (
        <p className="mt-3 text-[11px] text-text-muted text-center">
          Convertís {formatARS(arsN)} al tipo que elijas.
        </p>
      )}
    </div>
  )
}
