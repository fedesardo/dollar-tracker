import { getAllWallets } from '@/lib/queries/wallets'
import { getAllLegs } from '@/lib/queries/transactions'
import { getAllRecurringIncomes } from '@/lib/queries/recurringIncomes'
import { WalletList } from '@/components/settings/WalletList'
import { RecurringIncomes } from '@/components/settings/RecurringIncomes'
import { DangerZone } from '@/components/settings/DangerZone'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [wallets, legs, rules] = await Promise.all([
    getAllWallets(),
    getAllLegs(),
    getAllRecurringIncomes(),
  ])

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-sm text-text-muted mt-1">
          Bolsillos, ingresos automáticos, y reset.
        </p>
      </div>

      <section>
        <WalletList wallets={wallets} legs={legs} />
      </section>

      <section>
        <RecurringIncomes rules={rules} wallets={wallets} />
      </section>

      <section>
        <DangerZone />
      </section>
    </div>
  )
}
