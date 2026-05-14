import 'server-only'
import { db } from '@/lib/db'
import { wallets } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export async function getActiveWallets() {
  return db
    .select()
    .from(wallets)
    .where(eq(wallets.isActive, true))
    .orderBy(asc(wallets.sortOrder))
}

export async function getAllWallets() {
  return db.select().from(wallets).orderBy(asc(wallets.sortOrder))
}
