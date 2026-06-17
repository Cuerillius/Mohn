import { Hono } from 'hono'
import { getDB } from '../lib/db'
import * as schema from '../db/schema'
import { eq, inArray } from 'drizzle-orm'
import { getSession } from '../lib/helpers'

const account = new Hono<{ Bindings: CloudflareBindings }>()

account.delete('/', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const userId = session.user.id
  const db = getDB(c.env)

  try {
    const profiles = await db
      .select({ id: schema.profile.id })
      .from(schema.profile)
      .where(eq(schema.profile.userId, userId))

    const profileIds = profiles.map((p) => p.id)

    if (profileIds.length > 0) {
      await db.delete(schema.watchHistory).where(inArray(schema.watchHistory.profileId, profileIds))
      await db.delete(schema.watchList).where(inArray(schema.watchList.profileId, profileIds))
    }

    await db.delete(schema.profile).where(eq(schema.profile.userId, userId))
    await db.delete(schema.userSettings).where(eq(schema.userSettings.userId, userId))
    await db.delete(schema.account).where(eq(schema.account.userId, userId))
    await db.delete(schema.session).where(eq(schema.session.userId, userId))
    await db.delete(schema.user).where(eq(schema.user.id, userId))

    return c.json({ message: 'Account deleted' })
  } catch (err) {
    console.error('[DELETE /api/account] error', err)
    return c.json({ error: String(err) }, 500)
  }
})

export default account
