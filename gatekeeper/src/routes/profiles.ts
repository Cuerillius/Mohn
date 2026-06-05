import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../lib/db'
import * as schema from '../db/schema'
import { eq, and, desc, count, asc } from 'drizzle-orm'
import { getSession, verifyOwnership } from '../lib/helpers'

const profiles = new Hono<{ Bindings: CloudflareBindings }>()

profiles.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = getDB(c.env)
  const result = await db
    .select()
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.user.id))
    .orderBy(asc(schema.profile.sortOrder))
  return c.json(result)
})

profiles.post('/', zValidator('json', z.object({ name: z.string().min(1) })), async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const { name } = c.req.valid('json')
  const db = getDB(c.env)

  const profileCount = await db
    .select({ count: count() })
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.user.id))
  if (profileCount[0].count >= 10) {
    return c.json({ error: 'Maximum limit of 10 profiles reached' }, 400)
  }

  const existing = await db
    .select({ sortOrder: schema.profile.sortOrder })
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.user.id))
    .orderBy(desc(schema.profile.sortOrder))
    .limit(1)
  const nextOrder = existing.length > 0 ? existing[0].sortOrder + 1 : 0

  const [newProfile] = await db
    .insert(schema.profile)
    .values({ id: crypto.randomUUID(), name, userId: session.user.id, sortOrder: nextOrder, createdAt: new Date() })
    .returning()

  return c.json(newProfile, 201)
})

profiles.put('/reorder', zValidator('json', z.object({ profileIds: z.array(z.string()) })), async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const { profileIds } = c.req.valid('json')
  const db = getDB(c.env)

  const all = await db.select().from(schema.profile).where(eq(schema.profile.userId, session.user.id))
  const userProfileIds = new Set(all.map((p) => p.id))
  if (!profileIds.every((id) => userProfileIds.has(id))) {
    return c.json({ error: 'Invalid profile IDs' }, 400)
  }

  await Promise.all(
    profileIds.map((id, index) =>
      db.update(schema.profile).set({ sortOrder: index }).where(eq(schema.profile.id, id)),
    ),
  )

  return c.json({ message: 'Profiles reordered' })
})

profiles.patch('/:profileId', zValidator('json', z.object({ name: z.string().min(1) })), async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const profileId = c.req.param('profileId')
  const { name } = c.req.valid('json')
  const db = getDB(c.env)

  const profile = await verifyOwnership(c, profileId, session.user.id)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)

  const [updated] = await db
    .update(schema.profile)
    .set({ name })
    .where(eq(schema.profile.id, profileId))
    .returning()

  return c.json(updated)
})

profiles.delete('/:profileId', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const profileId = c.req.param('profileId')
  const db = getDB(c.env)

  const profileCountResult = await db
    .select({ count: count() })
    .from(schema.profile)
    .where(eq(schema.profile.userId, session.user.id))
  if (profileCountResult[0].count <= 1) {
    return c.json({ error: 'Cannot delete your last remaining profile' }, 400)
  }

  await db
    .delete(schema.profile)
    .where(and(eq(schema.profile.id, profileId), eq(schema.profile.userId, session.user.id)))

  return c.json({ message: 'Profile deleted' })
})

export default profiles
