'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Amount } from '@/components/shared/Amount'
import { formatARS, formatPct, formatUSD } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type Props = {
  total: number
  monthDelta: number
  monthDeltaPct: number
  blueRate: number | null
}

const MILESTONE_KEY = 'finanzas:lastMilestone'

export function HeroTotal({ total, monthDelta, monthDeltaPct, blueRate }: Props) {
  const positive = monthDelta >= 0
  const heroRef = useRef<HTMLDivElement>(null)
  const triggered = useRef(false)

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true
    const milestone = Math.floor(total / 5000) * 5000
    if (milestone < 5000) return
    let last = 0
    try {
      last = parseFloat(localStorage.getItem(MILESTONE_KEY) || '0')
    } catch {
      // ignore
    }
    if (milestone > last) {
      try {
        localStorage.setItem(MILESTONE_KEY, String(milestone))
      } catch {
        // ignore
      }
      const colors = ['#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#fbbf24']
      const end = Date.now() + 3000
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      toast.success(
        `¡Llegaron a los USD ${milestone.toLocaleString('es-AR')}! La rompen. 🎉`,
      )
      heroRef.current?.classList.add('animate-pulse-glow')
      setTimeout(() => heroRef.current?.classList.remove('animate-pulse-glow'), 320)
    }
  }, [total])

  const arsValue = blueRate ? total * blueRate : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-[var(--border)] p-7 sm:p-10',
        positive ? 'mesh-positive' : 'mesh-negative',
      )}
    >
      <div className="grain absolute inset-0 pointer-events-none" />
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Patrimonio total
        </p>
        <div ref={heroRef} className="mt-3">
          <Amount value={total} size="xl" animate className="text-white" showPrefix />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-mono tabular-nums',
              positive ? 'text-accent-green' : 'text-accent-red',
            )}
          >
            <span className="text-base leading-none">{positive ? '▲' : '▼'}</span>
            <span>{formatUSD(Math.abs(monthDelta), { sign: false })}</span>
            <span className="text-white/50">·</span>
            <span>{formatPct(monthDeltaPct, { sign: true })}</span>
            <span className="text-white/50 normal-case ml-1 font-sans">este mes</span>
          </span>
        </div>
        {arsValue !== null && (
          <p className="mt-1 text-xs text-white/60">
            En ARS al blue:{' '}
            <span className="font-mono tabular-nums text-white/80">{formatARS(arsValue)}</span>
          </p>
        )}
      </div>
    </motion.div>
  )
}
