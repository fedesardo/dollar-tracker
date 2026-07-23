import { db } from './index'
import { wallets, recurringIncomes } from './schema'
import { sql } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Seeding database...')

  // Wipe domain data (NOT auth tables)
  await db.execute(
    sql`TRUNCATE TABLE transaction_legs, transactions, loans, wallets, monthly_snapshots, goals, recurring_incomes RESTART IDENTITY CASCADE`,
  )

  const walletRows = await db
    .insert(wallets)
    .values([
      {
        name: 'Wise Flor',
        type: 'virtual',
        owner: 'flor',
        initialBalance: '0.00',
        color: '#60a5fa',
        icon: 'credit-card',
        sortOrder: 1,
      },
      {
        name: 'Santander Fede',
        type: 'virtual',
        owner: 'fede',
        initialBalance: '0.00',
        color: '#fbbf24',
        icon: 'landmark',
        sortOrder: 2,
      },
      {
        name: 'Físicos',
        type: 'physical',
        owner: 'joint',
        initialBalance: '0.00',
        color: '#34d399',
        icon: 'banknote',
        sortOrder: 3,
      },
    ])
    .returning()

  const wiseFlor = walletRows.find((w) => w.name === 'Wise Flor')
  if (wiseFlor) {
    await db.insert(recurringIncomes).values({
      description: 'Sueldo Flor',
      beneficiary: 'flor',
      walletId: wiseFlor.id,
      amountUsd: '2200.00',
      dayOfMonth: 21,
      isActive: true,
    })
    console.log('✅ Regla "Sueldo Flor" creada (día 21, USD 2200, Wise Flor).')
  }

  console.log(`✅ Created ${walletRows.length} wallets en cero.`)
  console.log('ℹ Editá los saldos iniciales desde /settings con los valores reales.')
  console.log('ℹ Los préstamos NO se cargan en el seed: usá la app (Movimientos →')
  console.log('  Préstamo otorgado) para que queden con transacción origen y legs como')
  console.log('  cualquier otro préstamo. Para préstamos históricos, usá la fecha original.')
  console.log('🎉 Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
