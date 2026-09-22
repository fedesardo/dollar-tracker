import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  ArrowLeftRight,
  Banknote,
  Handshake,
  CheckCircle,
  Scale,
} from 'lucide-react'
import type { TransactionType } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'

const meta: Record<TransactionType, {
  label: string
  variant: 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple' | 'muted'
  Icon: React.ComponentType<{ className?: string }>
}> = {
  income: { label: 'Ingreso', variant: 'green', Icon: ArrowDownCircle },
  expense: { label: 'Egreso', variant: 'red', Icon: ArrowUpCircle },
  purchase: { label: 'Compra USD', variant: 'yellow', Icon: TrendingUp },
  transfer: { label: 'Transferencia', variant: 'blue', Icon: ArrowLeftRight },
  cash_out: { label: 'Extracción', variant: 'orange', Icon: Banknote },
  loan_out: { label: 'Préstamo', variant: 'purple', Icon: Handshake },
  loan_in: { label: 'Cobro', variant: 'green', Icon: CheckCircle },
  adjustment: { label: 'Ajuste', variant: 'muted', Icon: Scale },
}

export function TransactionBadge({ type }: { type: TransactionType }) {
  const m = meta[type]
  const Icon = m.Icon
  return (
    <Badge variant={m.variant} className="gap-1.5">
      <Icon className="h-3 w-3" />
      {m.label}
    </Badge>
  )
}

export function transactionMeta(type: TransactionType) {
  return meta[type]
}

export type TransactionAccentVariant = (typeof meta)[TransactionType]['variant']

// Tailwind's JIT scanner needs each class name to appear literally somewhere —
// dynamic `bg-accent-${variant}` interpolations can't be resolved for a variant
// (like 'muted') that isn't already spelled out in a scanned file (e.g. badge.tsx).
// Centralizing the literal strings here keeps every consumer safe, including future variants.
export function transactionAccentClasses(variant: TransactionAccentVariant): {
  hoverBg: string
  staticBg: string
  iconBox: string
  bubbleBg: string
  iconText: string
  activeTag: string
} {
  switch (variant) {
    case 'green':
      return {
        hoverBg: 'hover:bg-accent-green/5',
        staticBg: 'bg-accent-green/5',
        iconBox: 'bg-accent-green/10 text-accent-green',
        bubbleBg: 'bg-accent-green/10',
        iconText: 'text-accent-green',
        activeTag: 'bg-accent-green/10 border-accent-green/30 text-accent-green',
      }
    case 'red':
      return {
        hoverBg: 'hover:bg-accent-red/5',
        staticBg: 'bg-accent-red/5',
        iconBox: 'bg-accent-red/10 text-accent-red',
        bubbleBg: 'bg-accent-red/10',
        iconText: 'text-accent-red',
        activeTag: 'bg-accent-red/10 border-accent-red/30 text-accent-red',
      }
    case 'blue':
      return {
        hoverBg: 'hover:bg-accent-blue/5',
        staticBg: 'bg-accent-blue/5',
        iconBox: 'bg-accent-blue/10 text-accent-blue',
        bubbleBg: 'bg-accent-blue/10',
        iconText: 'text-accent-blue',
        activeTag: 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue',
      }
    case 'yellow':
      return {
        hoverBg: 'hover:bg-accent-yellow/5',
        staticBg: 'bg-accent-yellow/5',
        iconBox: 'bg-accent-yellow/10 text-accent-yellow',
        bubbleBg: 'bg-accent-yellow/10',
        iconText: 'text-accent-yellow',
        activeTag: 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow',
      }
    case 'orange':
      return {
        hoverBg: 'hover:bg-accent-orange/5',
        staticBg: 'bg-accent-orange/5',
        iconBox: 'bg-accent-orange/10 text-accent-orange',
        bubbleBg: 'bg-accent-orange/10',
        iconText: 'text-accent-orange',
        activeTag: 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange',
      }
    case 'purple':
      return {
        hoverBg: 'hover:bg-accent-purple/5',
        staticBg: 'bg-accent-purple/5',
        iconBox: 'bg-accent-purple/10 text-accent-purple',
        bubbleBg: 'bg-accent-purple/10',
        iconText: 'text-accent-purple',
        activeTag: 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple',
      }
    case 'muted':
      return {
        hoverBg: 'hover:bg-bg-elevated',
        staticBg: 'bg-bg-elevated',
        iconBox: 'bg-bg-elevated text-text-muted',
        bubbleBg: 'bg-bg-elevated',
        iconText: 'text-text-muted',
        activeTag: 'bg-bg-elevated border-[var(--border-hover)] text-text-primary',
      }
  }
}
