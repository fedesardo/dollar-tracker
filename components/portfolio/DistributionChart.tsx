'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatUSD } from '@/lib/utils/format'

export type DistributionSlice = {
  name: string
  value: number
  color: string
  pct: number
}

export function DistributionChart({ slices, lostFees }: { slices: DistributionSlice[]; lostFees: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1">Distribución actual</h3>
      <p className="text-xs text-text-muted mb-4">Dónde está la plata.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
              >
                {slices.map((s, i) => (
                  <Cell key={i} fill={s.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const slice = payload[0].payload as DistributionSlice
                  return (
                    <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl">
                      <div className="text-text-primary font-medium">{slice.name}</div>
                      <div className="font-mono tabular-nums">USD {formatUSD(slice.value)}</div>
                      <div className="text-text-muted">{slice.pct.toFixed(1)}%</div>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {slices.map((s) => (
            <div key={s.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-text-secondary">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono tabular-nums text-text-primary">
                  {s.pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${s.pct}%`, background: s.color }}
                />
              </div>
              <p className="text-[10px] text-text-muted text-right font-mono tabular-nums">
                USD {formatUSD(s.value)}
              </p>
            </div>
          ))}
          {lostFees > 0 && (
            <div className="pt-2 border-t border-[var(--border)] mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Perdido en comisiones</span>
                <span className="font-mono tabular-nums text-accent-orange">
                  USD {formatUSD(lostFees)}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">
                Lo que la financiera se quedó. Informativo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
