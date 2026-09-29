import { Check, CircleHelp, Minus, X } from 'lucide-react'
import type { CoverageStatus } from '@/lib/utils/carInsurance'
import { COVERAGE_STATUS_LABEL } from '@/lib/utils/carInsurance'

const CONFIG = {
  yes: { Icon: Check, className: 'bg-accent-green/10 text-accent-green' },
  partial: { Icon: Minus, className: 'bg-accent-yellow/10 text-accent-yellow' },
  no: { Icon: X, className: 'bg-accent-red/10 text-accent-red' },
  unknown: { Icon: CircleHelp, className: 'bg-bg-elevated text-text-muted' },
} as const

export function CoverageStatusIcon({ status }: { status: CoverageStatus }) {
  const { Icon, className } = CONFIG[status]
  return (
    <span
      title={COVERAGE_STATUS_LABEL[status]}
      aria-label={COVERAGE_STATUS_LABEL[status]}
      className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}
