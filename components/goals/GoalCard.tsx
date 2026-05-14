'use client'

import { useState } from 'react'
import { differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { deleteGoal } from '@/actions/goals'
import type { Goal } from '@/lib/db/schema'
import { formatUSD, toNumber } from '@/lib/utils/format'

export function GoalCard({
  goal,
  totalUsd,
  monthlyDelta,
}: {
  goal: Goal
  totalUsd: number
  monthlyDelta: number
}) {
  const [deleting, setDeleting] = useState(false)
  const target = toNumber(goal.targetUsd)
  const pct = Math.min(100, target > 0 ? (totalUsd / target) * 100 : 0)
  const remaining = Math.max(0, target - totalUsd)

  // Projection
  let projectionLabel: string | null = null
  if (remaining <= 0) {
    projectionLabel = '¡Cumplida!'
  } else if (monthlyDelta > 0) {
    const months = Math.ceil(remaining / monthlyDelta)
    const eta = new Date()
    eta.setMonth(eta.getMonth() + months)
    projectionLabel = `~${format(eta, "LLLL yyyy", { locale: es })}`
  }

  const deadline = goal.deadline ? parseISO(goal.deadline) : null
  const daysToDeadline = deadline ? differenceInDays(deadline, new Date()) : null

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteGoal(goal.id)
    setDeleting(false)
    if (res.success) toast.success('Meta archivada.')
    else toast.error(res.error)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-bg-card p-5"
      style={{ borderLeft: `3px solid ${goal.color}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{goal.icon}</div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">{goal.name}</h3>
            <p className="text-[11px] text-text-muted">
              USD {formatUSD(target)}
              {deadline && (
                <>
                  {' · '}
                  {daysToDeadline !== null && daysToDeadline >= 0
                    ? `faltan ${daysToDeadline} días`
                    : 'vencida'}
                </>
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting} className="h-8 w-8 text-text-muted hover:text-accent-red">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">
            <span className="font-mono tabular-nums">USD {formatUSD(Math.min(totalUsd, target))}</span>{' '}
            ahorrados
          </span>
          <span className="font-mono tabular-nums" style={{ color: goal.color }}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <Progress value={pct} indicatorColor={goal.color} />
        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>
            Faltan{' '}
            <span className="font-mono tabular-nums text-text-primary">USD {formatUSD(remaining)}</span>
          </span>
          {projectionLabel && (
            <span className="capitalize">A este ritmo: {projectionLabel}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
