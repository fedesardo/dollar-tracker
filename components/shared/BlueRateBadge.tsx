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

  if (!rates?.blue) {
    return (
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--border)] bg-bg-elevated px-3 py-1.5 text-xs text-text-muted">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="font-mono tabular-nums">cargando…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-bg-elevated px-3 py-1.5 text-xs">
      <TrendingUp className="h-3.5 w-3.5 text-accent-yellow" />
      <span className="text-text-muted uppercase tracking-wider hidden sm:inline">Blue</span>
      <span className="font-mono tabular-nums text-text-primary">
        {formatRate(rates.blue.venta)}
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
