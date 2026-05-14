import 'server-only'
import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function getActiveGoals() {
  return db.select().from(goals).where(eq(goals.isActive, true)).orderBy(desc(goals.createdAt))
}
