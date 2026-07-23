import 'server-only'
import { db } from '@/lib/db'
import { recurringIncomes } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export async function getAllRecurringIncomes() {
  return db.select().from(recurringIncomes).orderBy(asc(recurringIncomes.dayOfMonth))
}

export async function getActiveRecurringIncomes() {
  return db
    .select()
    .from(recurringIncomes)
    .where(eq(recurringIncomes.isActive, true))
    .orderBy(asc(recurringIncomes.dayOfMonth))
}
