'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatUSD } from '@/lib/utils/format'

export type ProjectionPoint = {
  label: string
  actual: number | null
  projected: number | null
  band?: [number, number]
}

export function ProjectionChart({
  data,
  monthlyDelta,
}: {
  data: ProjectionPoint[]
  monthlyDelta: number
}) {
  const dataWithBand = data.map((d) => ({
    ...d,
    bandLow: d.band?.[0] ?? null,
    bandHigh: d.band?.[1] ?? null,
  }))

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="font-display text-base font-semibold flex items-center gap-1.5">
          Proyección
          <InfoTooltip
            text="Si seguís ahorrando al ritmo de los últimos 6 meses, así crecería el patrimonio en los próximos 12. La banda violeta clarito es la incertidumbre — cuanto más lejos, más amplia."
            size="sm"
          />
        </h3>
        <p className="text-xs text-text-muted">
          A este ritmo: {monthlyDelta >= 0 ? '+' : '−'}USD {Math.abs(monthlyDelta).toFixed(0)}{' '}
          / mes
        </p>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Histórico (sólido) + estimación a 12 meses (punteada).
      </p>
      <div className="h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataWithBand}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#7878a0' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#7878a0' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl">
                    <div className="text-text-primary font-medium mb-1">{label}</div>
                    {payload.map((p) =>
                      p.value !== null && p.dataKey === 'actual' ? (
                        <div key="a" className="font-mono tabular-nums text-accent-green">
                          USD {formatUSD(p.value as number)}
                        </div>
                      ) : p.value !== null && p.dataKey === 'projected' ? (
                        <div key="p" className="font-mono tabular-nums text-accent-purple">
                          USD {formatUSD(p.value as number)} (proyectado)
                        </div>
                      ) : null,
                    )}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="bandHigh"
              stroke="none"
              fill="url(#bandGrad)"
              stackId="band"
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#actualGrad)"
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#a78bfa"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
