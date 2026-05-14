'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { goalSchema, type GoalInput } from '@/lib/validations/goal'

type ActionResult = { success: true } | { success: false; error: string }

export async function createGoal(input: GoalInput): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    const data = goalSchema.parse(input)
    await db.insert(goals).values({
      name: data.name,
      targetUsd: data.targetUsd.toFixed(2),
      deadline: data.deadline ?? null,
      color: data.color,
      icon: data.icon,
    })
    revalidatePath('/goals')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    await db.update(goals).set({ isActive: false }).where(eq(goals.id, id))
    revalidatePath('/goals')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}
