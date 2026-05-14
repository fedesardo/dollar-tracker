'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatUSD } from '@/lib/utils/format'

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee', '#f87171']

export type CatRow = { name: string; value: number }

export function CategoryPie({ data }: { data: CatRow[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-6 text-center text-text-muted text-sm">
        Sin egresos registrados con categoría.
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1">Egresos por categoría</h3>
      <p className="text-xs text-text-muted mb-4">Total USD {formatUSD(total)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as CatRow
                  return (
                    <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl">
                      <div className="text-text-primary font-medium">{d.name}</div>
                      <div className="font-mono tabular-nums">USD {formatUSD(d.value)}</div>
                      <div className="text-text-muted">
                        {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 text-xs">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-text-secondary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {d.name}
              </span>
              <span className="font-mono tabular-nums text-text-primary">
                USD {formatUSD(d.value)}{' '}
                <span className="text-text-muted ml-1">
                  ({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
