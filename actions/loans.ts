'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { loans } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

type ActionResult = { success: true } | { success: false; error: string }

export async function writeOffLoan(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    await db.update(loans).set({ status: 'written_off', updatedAt: new Date() }).where(eq(loans.id, id))
    revalidatePath('/loans')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}
