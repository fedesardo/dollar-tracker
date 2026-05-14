import { db } from './index'
import { wallets, loans } from './schema'
import { sql } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Seeding database...')

  // Wipe domain data (NOT auth tables)
  await db.execute(sql`TRUNCATE TABLE transaction_legs, transactions, loans, wallets, monthly_snapshots, goals RESTART IDENTITY CASCADE`)

  const walletRows = await db
    .insert(wallets)
    .values([
      {
        name: 'Wise Flor',
        type: 'virtual',
        owner: 'flor',
        initialBalance: '16380.00',
        color: '#60a5fa',
        icon: 'credit-card',
        sortOrder: 1,
      },
      {
        name: 'Santander Fede',
        type: 'virtual',
        owner: 'fede',
        initialBalance: '3600.00',
        color: '#fbbf24',
        icon: 'landmark',
        sortOrder: 2,
      },
      {
        name: 'Físicos',
        type: 'physical',
        owner: 'joint',
        initialBalance: '10500.00',
        color: '#34d399',
        icon: 'banknote',
        sortOrder: 3,
      },
      {
        name: 'Pendiente Lucho',
        type: 'receivable',
        owner: 'joint',
        initialBalance: '5000.00',
        color: '#a78bfa',
        icon: 'clock',
        sortOrder: 4,
      },
    ])
    .returning()

  console.log(`✅ Created ${walletRows.length} wallets`)

  await db.insert(loans).values({
    transactionId: null,
    debtorName: 'Lucho',
    totalAmount: '5000.00',
    amountPaid: '0',
    status: 'active',
    notes: 'Saldo inicial — préstamo previo al inicio del registro en la app',
  })

  console.log('✅ Created Lucho loan record')
  console.log('🎉 Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
