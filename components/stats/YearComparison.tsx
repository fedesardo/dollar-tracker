'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatUSD } from '@/lib/utils/format'

export type YearRow = { month: string } & Record<string, string | number>

export function YearComparison({ data, years }: { data: YearRow[]; years: number[] }) {
  if (years.length < 2) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-6 text-center text-text-muted text-sm">
        Cuando tengan más de un año de historia van a poder comparar año a año acá.
      </div>
    )
  }
  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa']
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1">Comparativa año a año</h3>
      <p className="text-xs text-text-muted mb-4">Ahorro neto por mes y año.</p>
      <div className="h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#50506a' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#50506a' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl space-y-1">
                    <div className="text-text-primary font-medium">{label}</div>
                    {payload.map((p) => (
                      <div key={p.dataKey as string} className="flex justify-between gap-4">
                        <span style={{ color: p.color as string }}>{p.dataKey as string}</span>
                        <span className="font-mono tabular-nums">USD {formatUSD(p.value as number)}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8080a0' }} />
            {years.map((y, i) => (
              <Bar
                key={y}
                dataKey={String(y)}
                fill={colors[i % colors.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
