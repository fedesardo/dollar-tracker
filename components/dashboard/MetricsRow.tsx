import { ArrowDownCircle, ArrowUpCircle, TrendingUp, PiggyBank } from 'lucide-react'
import { Amount } from '@/components/shared/Amount'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatARS, formatPct, formatRate } from '@/lib/utils/format'

type Metric = {
  Icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  caption: string
  accent: 'green' | 'red' | 'yellow' | 'cyan'
  delta?: number | null
  tooltip: string
}

export function MetricsRow({
  income,
  expense,
  expenseDeltaPct,
  purchaseUsd,
  purchaseArs,
  avgRate,
  netSavings,
  avgNetSavings,
}: {
  income: number
  expense: number
  expenseDeltaPct: number | null
  purchaseUsd: number
  purchaseArs: number
  avgRate: number | null
  netSavings: number
  avgNetSavings: number | null
}) {
  const items: Metric[] = [
    {
      Icon: ArrowDownCircle,
      label: 'Ingresos',
      value: income,
      caption: 'Sueldo Flor + compras',
      accent: 'green',
      tooltip:
        'Total de dólares que entraron este mes: sueldo de Flor + compras de USD que hizo Fede con pesos.',
    },
    {
      Icon: ArrowUpCircle,
      label: 'Egresos',
      value: expense,
      caption:
        expenseDeltaPct === null
          ? 'sin comparativa'
          : `${expenseDeltaPct >= 0 ? '▲' : '▼'} ${formatPct(expenseDeltaPct)} vs mes anterior`,
      accent: 'red',
      delta: expenseDeltaPct,
      tooltip:
        'Dólares que salieron este mes para gastos. Comparado contra el mismo cálculo del mes anterior.',
    },
    {
      Icon: TrendingUp,
      label: 'Compras USD',
      value: purchaseUsd,
      caption: avgRate
        ? `${formatARS(purchaseArs)} → cot. ${formatRate(avgRate)}`
        : `${formatARS(purchaseArs)}`,
      accent: 'yellow',
      tooltip:
        'Dólares conseguidos este mes a cambio de pesos. La cotización es el promedio ponderado de todas las compras del mes.',
    },
    {
      Icon: PiggyBank,
      label: 'Ahorro neto',
      value: netSavings,
      caption:
        avgNetSavings === null
          ? 'sin promedio'
          : `Promedio 6m: ${avgNetSavings >= 0 ? '+' : ''}${avgNetSavings.toFixed(0)} USD`,
      accent: 'cyan',
      tooltip:
        'Ingresos + Compras − Egresos − Comisiones de extracción. Lo que efectivamente sumó el patrimonio en el mes. El promedio te dice si este mes fue mejor o peor que lo habitual.',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-[var(--border)] bg-bg-card p-4 hover:border-[var(--border-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <m.Icon className={`h-4 w-4 text-accent-${m.accent}`} />
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              {m.label}
            </span>
            <InfoTooltip text={m.tooltip} size="xs" className="ml-auto" />
          </div>
          <div className="mt-2">
            <Amount value={m.value} size="md" showPrefix={false} positiveColor={false} />
          </div>
          <p className="mt-1 text-[11px] text-text-secondary truncate">{m.caption}</p>
        </div>
      ))}
    </div>
  )
}
