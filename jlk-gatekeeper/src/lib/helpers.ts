import { auth } from './better-auth'
import { getDB } from './db'
import * as schema from '../db/schema'
import { and, eq } from 'drizzle-orm'

export async function getSession(c: any) {
  return auth(c.env).api.getSession({ headers: c.req.raw.headers })
}

export async function verifyOwnership(c: any, profileId: string, userId: string) {
  const db = getDB(c.env)
  const [found] = await db
    .select()
    .from(schema.profile)
    .where(and(eq(schema.profile.id, profileId), eq(schema.profile.userId, userId)))
    .limit(1)
  return found || null
}
