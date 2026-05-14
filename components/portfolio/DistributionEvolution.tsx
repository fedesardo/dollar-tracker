'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatUSD } from '@/lib/utils/format'

export type EvoStack = { label: string; virtual: number; physical: number; receivable: number }

export function DistributionEvolution({ data }: { data: EvoStack[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-5">
      <h3 className="font-display text-base font-semibold mb-1">Evolución de la distribución</h3>
      <p className="text-xs text-text-muted mb-4">Cómo cambió el mix mes a mes.</p>
      <div className="h-72 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.1} />
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
                  <div className="rounded-xl border border-[var(--border)] bg-bg-elevated/95 backdrop-blur-md p-2 text-xs shadow-2xl space-y-1">
                    <div className="text-text-primary font-medium">{label}</div>
                    {payload.map((p) => (
                      <div key={p.dataKey as string} className="flex justify-between gap-4">
                        <span style={{ color: p.color as string }}>{labelFor(p.dataKey as string)}</span>
                        <span className="font-mono tabular-nums">USD {formatUSD(p.value as number)}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="virtual"
              stackId="1"
              stroke="#60a5fa"
              fill="url(#vGrad)"
            />
            <Area
              type="monotone"
              dataKey="physical"
              stackId="1"
              stroke="#34d399"
              fill="url(#pGrad)"
            />
            <Area
              type="monotone"
              dataKey="receivable"
              stackId="1"
              stroke="#a78bfa"
              fill="url(#rGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function labelFor(key: string) {
  if (key === 'virtual') return 'Virtual'
  if (key === 'physical') return 'Físico'
  if (key === 'receivable') return 'Pendiente'
  return key
}
