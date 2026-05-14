import { getAllWallets } from '@/lib/queries/wallets'
import { getAllLegs } from '@/lib/queries/transactions'
import { WalletList } from '@/components/settings/WalletList'
import { DangerZone } from '@/components/settings/DangerZone'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [wallets, legs] = await Promise.all([getAllWallets(), getAllLegs()])

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-sm text-text-muted mt-1">
          Bolsillos, saldos iniciales, y reset.
        </p>
      </div>

      <section>
        <WalletList wallets={wallets} legs={legs} />
      </section>

      <section>
        <DangerZone />
      </section>
    </div>
  )
}
