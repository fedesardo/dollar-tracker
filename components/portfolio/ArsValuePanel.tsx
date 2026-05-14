'use client'

import { useRates } from '@/components/shared/BlueRateBadge'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatARS, formatRate } from '@/lib/utils/format'

export function ArsValuePanel({ totalUsd }: { totalUsd: number }) {
  const rates = useRates()
  const rows = [
    { label: 'Blue', rate: rates?.blue?.venta, color: 'text-accent-yellow' },
    { label: 'Oficial', rate: rates?.oficial?.venta, color: 'text-accent-blue' },
    { label: 'MEP', rate: rates?.mep?.venta, color: 'text-accent-cyan' },
    { label: 'CCL', rate: rates?.ccl?.venta, color: 'text-accent-purple' },
  ]
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1 flex items-center gap-1.5">
        Valor en ARS
        <InfoTooltip
          text="Si vendieras todos los USD al tipo elegido, te quedan tantos pesos. Blue es el informal, Oficial el de banco, MEP/CCL son legales para inversores. Da una idea de poder de compra real."
          size="sm"
        />
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Cuánto vale tu portfolio según con qué cotices.
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between rounded-xl bg-bg-elevated p-3"
          >
            <div>
              <p className={`text-xs font-medium ${r.color}`}>{r.label}</p>
              {r.rate && (
                <p className="text-[10px] text-text-muted font-mono tabular-nums">
                  {formatRate(r.rate)}
                </p>
              )}
            </div>
            <p className="font-mono tabular-nums text-text-primary text-sm">
              {r.rate ? formatARS(totalUsd * r.rate) : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
