'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  Banknote,
  Percent,
  PartyPopper,
  Calendar,
  Sparkles,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Insight, InsightKind } from '@/lib/utils/insights'
import { cn } from '@/lib/utils/cn'

const iconMap: Record<string, LucideIcon> = {
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  Banknote,
  Percent,
  PartyPopper,
  Calendar,
  Sparkles,
}

const kindStyles: Record<InsightKind, string> = {
  warning: 'border-accent-yellow/20 bg-accent-yellow/5 text-accent-yellow',
  opportunity: 'border-accent-green/20 bg-accent-green/5 text-accent-green',
  info: 'border-accent-blue/20 bg-accent-blue/5 text-accent-blue',
  celebration: 'border-accent-purple/20 bg-accent-purple/5 text-accent-purple',
}

export function InsightPanel({ insights }: { insights: Insight[] }) {
  const [open, setOpen] = useState(true)
  if (insights.length === 0) return null

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm hover:bg-bg-elevated/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-text-secondary">
          <Sparkles className="h-4 w-4 text-accent-cyan" />
          <span className="font-medium uppercase tracking-wider text-[11px]">
            Insights ({insights.length})
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 space-y-2">
              {insights.map((ins) => {
                const Icon = iconMap[ins.icon] ?? Sparkles
                return (
                  <div
                    key={ins.id}
                    className={cn(
                      'rounded-xl border p-3 flex gap-3',
                      kindStyles[ins.kind],
                    )}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-text-primary">
                      <div className="font-semibold mb-0.5">
                        {ins.title}
                        {ins.emoji && <span className="ml-1">{ins.emoji}</span>}
                      </div>
                      <div className="text-text-secondary">{ins.message}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
