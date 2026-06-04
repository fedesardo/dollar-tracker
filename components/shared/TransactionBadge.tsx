import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  ArrowLeftRight,
  Banknote,
  Handshake,
  CheckCircle,
} from 'lucide-react'
import type { TransactionType } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'

const meta: Record<TransactionType, {
  label: string
  variant: 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'purple'
  Icon: React.ComponentType<{ className?: string }>
}> = {
  income: { label: 'Ingreso', variant: 'green', Icon: ArrowDownCircle },
  expense: { label: 'Egreso', variant: 'red', Icon: ArrowUpCircle },
  purchase: { label: 'Compra USD', variant: 'yellow', Icon: TrendingUp },
  transfer: { label: 'Transferencia', variant: 'blue', Icon: ArrowLeftRight },
  cash_out: { label: 'Extracción', variant: 'orange', Icon: Banknote },
  loan_out: { label: 'Préstamo', variant: 'purple', Icon: Handshake },
  loan_in: { label: 'Cobro', variant: 'green', Icon: CheckCircle },
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
