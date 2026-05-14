'use client'

import { useEffect, useState } from 'react'
import type { RatesPayload } from '@/app/api/rates/route'
import { formatRate } from '@/lib/utils/format'
import { TrendingUp } from 'lucide-react'

export function BlueRateBadge() {
  const [rates, setRates] = useState<RatesPayload | null>(null)

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates', { cache: 'no-store' })
      if (res.ok) setRates(await res.json())
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchRates()
    const id = setInterval(fetchRates, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (!rates) {
    return (
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--border)] bg-bg-elevated px-3 py-1.5 text-xs text-text-muted">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="font-mono tabular-nums">cargando…</span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-bg-elevated text-xs"
      title="Cotizaciones de dolarapi.com — actualizadas cada 5 minutos"
    >
      {rates.blue && (
        <RatePill
          label="Blue"
          value={rates.blue.venta}
          color="text-accent-yellow"
        />
      )}
      {rates.oficial && (
        <>
          <span className="text-text-muted/40">·</span>
          <RatePill
            label="Oficial"
            value={rates.oficial.venta}
            color="text-accent-blue"
          />
        </>
      )}
    </div>
  )
}

function RatePill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5">
      <TrendingUp className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-text-secondary uppercase tracking-wider hidden sm:inline">
        {label}
      </span>
      <span className="font-mono tabular-nums text-text-primary">
        {formatRate(value)}
      </span>
    </div>
  )
}

export function useRates(): RatesPayload | null {
  const [rates, setRates] = useState<RatesPayload | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/rates', { cache: 'no-store' })
        if (!cancelled && res.ok) setRates(await res.json())
      } catch {
        // noop
      }
    }
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return rates
}
