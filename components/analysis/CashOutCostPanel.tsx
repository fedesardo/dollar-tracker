'use client'

import { Bar, BarChart, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { formatDateShort, formatUSD } from '@/lib/utils/format'

export type CashOutEntry = {
  id: string
  date: string
  gross: number
  feePct: number
  feeUsd: number
  net: number
}

export function CashOutCostPanel({
  entries,
  totalExtracted,
  totalLost,
  avgFeePct,
  bestPct,
  worstPct,
  hypotheticalSavings,
}: {
  entries: CashOutEntry[]
  totalExtracted: number
  totalLost: number
  avgFeePct: number | null
  bestPct: number | null
  worstPct: number | null
  hypotheticalSavings: number | null
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-6 text-center text-text-muted text-sm">
        Todavía no hay extracciones a físico registradas.
      </div>
    )
  }

  const chartData = entries.map((e) => ({
    date: e.date.slice(5),
    fullDate: e.date,
    feePct: e.feePct,
    avg: avgFeePct,
  }))

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5 space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold">Costo de extracciones</h3>
        <p className="text-xs text-text-muted mt-0.5">
          Cada vez que sacan a físicos, una financiera se queda con un cacho.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Extraído" value={`USD ${formatUSD(totalExtracted)}`} />
        <Stat label="Perdido" value={`USD ${formatUSD(totalLost)}`} tone="negative" />
        <Stat
          label="Promedio"
          value={avgFeePct !== null ? `${avgFeePct.toFixed(2)}%` : '—'}
        />
        <Stat
          label="Mejor → Peor"
          value={
            bestPct !== null && worstPct !== null
              ? `${bestPct.toFixed(2)}% → ${worstPct.toFixed(2)}%`
              : '—'
          }
        />
      </div>

      {hypotheticalSavings !== null && hypotheticalSavings > 0 && (
        <div className="rounded-xl border border-accent-yellow/20 bg-accent-yellow/5 p-3 text-sm text-text-primary">
          Si siempre hubieras negociado al 2%, habrías ahorrado{' '}
          <span className="font-mono tabular-nums text-accent-yellow font-semibold">
            USD {formatUSD(hypotheticalSavings)}
          </span>{' '}
          más.
        </div>
      )}

      <div className="h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#50506a' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#50506a' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const entry = chartData.find((d) => d.date === label)
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl">
                    <div className="text-text-secondary">{entry?.fullDate}</div>
                    <div className="font-mono tabular-nums text-text-primary">
                      {entry?.feePct.toFixed(2)}%
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="feePct" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    avgFeePct !== null && d.feePct > avgFeePct ? '#f87171' : '#34d399'
                  }
                />
              ))}
            </Bar>
            {avgFeePct !== null && (
              <Line
                type="linear"
                dataKey="avg"
                stroke="#fbbf24"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-text-muted">
            <tr>
              <Th>Fecha</Th>
              <Th align="right">Bruto</Th>
              <Th align="right">Comisión %</Th>
              <Th align="right">Costo</Th>
              <Th align="right">Neto</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-[var(--border)]">
                <Td>{formatDateShort(e.date)}</Td>
                <Td align="right">USD {formatUSD(e.gross)}</Td>
                <Td align="right" mono>
                  {e.feePct.toFixed(2)}%
                </Td>
                <Td align="right" tone="negative" mono>
                  USD {formatUSD(e.feeUsd)}
                </Td>
                <Td align="right" tone="positive" mono>
                  USD {formatUSD(e.net)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'negative' }) {
  return (
    <div className="rounded-xl bg-bg-elevated p-3">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className={`mt-1 font-mono tabular-nums text-sm ${
          tone === 'negative' ? 'text-accent-red' : 'text-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th className={`py-2 px-2 text-[10px] uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}
function Td({
  children,
  align,
  mono,
  tone,
}: {
  children: React.ReactNode
  align?: 'right'
  mono?: boolean
  tone?: 'positive' | 'negative'
}) {
  const colors = tone === 'positive' ? 'text-accent-green' : tone === 'negative' ? 'text-accent-red' : 'text-text-secondary'
  return (
    <td
      className={`py-2 px-2 ${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'font-mono tabular-nums' : ''} ${colors}`}
    >
      {children}
    </td>
  )
}
