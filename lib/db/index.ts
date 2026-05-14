import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import { drizzle as drizzleNode, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import { Pool as PgPool } from 'pg'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is not defined')
}

const isNeon = url.includes('neon.tech') || url.includes('neon.aws')

type DB = NodePgDatabase<typeof schema> | ReturnType<typeof drizzleNeon<typeof schema>>

function makeDb(): DB {
  if (isNeon) {
    if (typeof WebSocket === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      neonConfig.webSocketConstructor = require('ws')
    }
    const pool = new NeonPool({ connectionString: url })
    return drizzleNeon(pool, { schema })
  }
  const pool = new PgPool({ connectionString: url })
  return drizzleNode(pool, { schema })
}

const globalForDb = globalThis as unknown as { __finanzas_db__?: DB }
export const db: DB = globalForDb.__finanzas_db__ ?? makeDb()
if (process.env.NODE_ENV !== 'production') globalForDb.__finanzas_db__ = db

export { schema }
