import { differenceInDays } from 'date-fns'
import { HandCoins } from 'lucide-react'
import { getActiveWallets } from '@/lib/queries/wallets'
import { getLoansWithDetails, getAllLoans } from '@/lib/queries/loans'
import { LoanCard } from '@/components/loans/LoanCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Amount } from '@/components/shared/Amount'
import { toNumber } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
  const [loans, wallets, allLoans] = await Promise.all([
    getLoansWithDetails(),
    getActiveWallets(),
    getAllLoans(),
  ])

  const totalLent = loans.reduce((s, l) => s + toNumber(l.totalAmount), 0)
  const totalPending = loans.reduce(
    (s, l) =>
      l.status === 'active' || l.status === 'partially_paid'
        ? s + toNumber(l.totalAmount) - toNumber(l.amountPaid)
        : s,
    0,
  )
  const active = loans.filter((l) => l.status === 'active' || l.status === 'partially_paid')
  const avgDays =
    active.length > 0
      ? active.reduce((s, l) => s + differenceInDays(new Date(), new Date(l.createdAt)), 0) /
        active.length
      : 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Préstamos</h1>
        <p className="text-sm text-text-muted mt-1">
          Plata que les deben. Y los días que pasan.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Capital prestado" value={<Amount value={totalLent} size="md" showPrefix />} />
        <Stat
          label="Pendiente"
          value={<Amount value={totalPending} size="md" showPrefix />}
        />
        <Stat label="Activos" value={<span className="font-mono tabular-nums text-base">{active.length}</span>} />
        <Stat
          label="Días promedio"
          value={
            <span className="font-mono tabular-nums text-base">{avgDays.toFixed(0)}</span>
          }
        />
      </div>

      {loans.length === 0 ? (
        <EmptyState icon={HandCoins} title="Ningún préstamo activo. Bien así." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {loans.map((l) => (
            <LoanCard key={l.id} loan={l} wallets={wallets} loans={allLoans} />
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <div className="mt-2">{value}</div>
    </div>
  )
}
