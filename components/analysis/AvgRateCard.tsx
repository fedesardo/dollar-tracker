import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatARS, formatRate, formatUSD, formatDateShort } from '@/lib/utils/format'

export function AvgRateCard({
  avgRate,
  blueNow,
  best,
  worst,
  totalArs,
  totalUsd,
}: {
  avgRate: number | null
  blueNow: number | null
  best: { rate: number; date: string } | null
  worst: { rate: number; date: string } | null
  totalArs: number
  totalUsd: number
}) {
  if (!avgRate) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-6 text-center text-text-muted text-sm">
        Todavía no hay compras registradas.
      </div>
    )
  }

  const diff = blueNow ? ((avgRate - blueNow) / blueNow) * 100 : null
  let diffIcon = Minus
  let diffColor = 'text-text-muted'
  let diffText = 'sin comparativa'
  if (diff !== null) {
    if (diff < -1) {
      diffIcon = TrendingDown
      diffColor = 'text-accent-green'
      diffText = `${Math.abs(diff).toFixed(1)}% más barato que el blue de hoy`
    } else if (diff > 1) {
      diffIcon = TrendingUp
      diffColor = 'text-accent-red'
      diffText = `${diff.toFixed(1)}% más caro que el blue de hoy`
    } else {
      diffText = 'parecido al blue de hoy'
    }
  }
  const Icon = diffIcon

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-6">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">
        Tu costo promedio (ponderado)
      </p>
      <p className="mt-2 font-mono tabular-nums text-4xl text-text-primary">
        {formatRate(avgRate)}
        <span className="ml-1.5 text-sm text-text-muted normal-case">ARS/USD</span>
      </p>
      <div className={`mt-2 flex items-center gap-1.5 text-sm ${diffColor}`}>
        <Icon className="h-3.5 w-3.5" />
        {diffText}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        {best && (
          <div className="rounded-xl bg-bg-elevated p-3">
            <p className="text-text-muted uppercase tracking-wider text-[10px]">Mejor</p>
            <p className="font-mono tabular-nums text-accent-green mt-1">
              {formatRate(best.rate)}
            </p>
            <p className="text-text-muted mt-0.5">{formatDateShort(best.date)}</p>
          </div>
        )}
        {worst && (
          <div className="rounded-xl bg-bg-elevated p-3">
            <p className="text-text-muted uppercase tracking-wider text-[10px]">Peor</p>
            <p className="font-mono tabular-nums text-accent-red mt-1">
              {formatRate(worst.rate)}
            </p>
            <p className="text-text-muted mt-0.5">{formatDateShort(worst.date)}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
        <span>
          Total ARS: <span className="font-mono tabular-nums">{formatARS(totalArs)}</span>
        </span>
        <span>
          Total USD: <span className="font-mono tabular-nums">USD {formatUSD(totalUsd)}</span>
        </span>
      </div>
    </div>
  )
}
