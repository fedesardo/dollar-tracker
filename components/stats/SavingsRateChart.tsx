'use client'

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPct } from '@/lib/utils/format'

export type SavingsRow = { label: string; rate: number }

export function SavingsRateChart({ data, average }: { data: SavingsRow[]; average: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1">Tasa de ahorro mensual</h3>
      <p className="text-xs text-text-muted mb-4">
        Promedio histórico: {formatPct(average, { sign: true })}
      </p>
      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7878a0' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#7878a0' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl">
                    <div className="text-text-primary">{label}</div>
                    <div className="font-mono tabular-nums">
                      {formatPct(payload[0].value as number, { sign: true })}
                    </div>
                  </div>
                )
              }}
            />
            <ReferenceLine y={average} stroke="#fbbf24" strokeDasharray="4 4" />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]} fill="#34d399" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
