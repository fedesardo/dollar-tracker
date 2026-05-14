import 'server-only'
import { db } from '@/lib/db'
import { monthlySnapshots } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function getRecentSnapshots(limit = 24) {
  return db.select().from(monthlySnapshots).orderBy(desc(monthlySnapshots.year), desc(monthlySnapshots.month)).limit(limit)
}
