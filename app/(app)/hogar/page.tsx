import { getHouseholdDashboard } from '@/lib/queries/household'
import { Badge } from '@/components/ui/badge'
import { HouseholdBoard } from '@/components/household/HouseholdBoard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HouseholdPage() {
  const { items, usdRate, month } = await getHouseholdDashboard()

  return (
    <div className="space-y-5 stagger">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="purple">Independiente de tus dólares</Badge>
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Estructura del hogar</h1>
        <p className="mt-1 text-sm text-text-muted">
          Lo fijo que necesitamos por mes para que la casa funcione. Un número aproximado,
          no un control de gastos.
        </p>
      </div>

      {usdRate === null ? (
        <p className="rounded-2xl border border-accent-yellow/30 bg-accent-yellow/5 p-4 text-sm text-accent-yellow">
          No pude traer la cotización del blue. Probá de nuevo en un rato.
        </p>
      ) : (
        <HouseholdBoard items={items} usdRate={usdRate} month={month} />
      )}
    </div>
  )
}
