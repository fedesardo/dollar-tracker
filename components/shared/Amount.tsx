'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatUSD } from '@/lib/utils/format'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
  xl: 'text-5xl sm:text-6xl font-bold',
}

const prefixSizeClasses: Record<Size, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base sm:text-lg',
}

export type AmountProps = {
  value: number
  sign?: boolean
  size?: Size
  animate?: boolean
  showPrefix?: boolean
  className?: string
  positiveColor?: boolean
}

export function Amount({
  value,
  sign = false,
  size = 'md',
  animate = false,
  showPrefix = true,
  className,
  positiveColor = false,
}: AmountProps) {
  const [display, setDisplay] = useState(animate ? 0 : value)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef<number>(0)

  useEffect(() => {
    if (!animate) {
      setDisplay(value)
      return
    }
    fromRef.current = display
    startRef.current = null

    const duration = 800
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const t = Math.min(1, elapsed / duration)
      const eased = easeOutExpo(t)
      const current = fromRef.current + (value - fromRef.current) * eased
      setDisplay(current)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animate])

  const isPositive = display > 0
  const isNegative = display < 0
  const colorClass =
    sign || positiveColor
      ? isPositive
        ? 'text-accent-green'
        : isNegative
          ? 'text-accent-red'
          : 'text-text-primary'
      : 'text-text-primary'

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1.5 font-mono tabular-nums',
        sizeClasses[size],
        colorClass,
        className,
      )}
    >
      {showPrefix && (
        <span className={cn('font-mono uppercase tracking-wide text-text-muted', prefixSizeClasses[size])}>
          USD
        </span>
      )}
      <span>{formatUSD(display, { sign })}</span>
    </span>
  )
}
