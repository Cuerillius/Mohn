import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../lib/db'
import * as schema from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession, verifyOwnership } from '../lib/helpers'

const watchlist = new Hono<{ Bindings: CloudflareBindings }>()

watchlist.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const profileId = c.req.param('profileId') as string
  const profile = await verifyOwnership(c, profileId, session.user.id)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)

  const db = getDB(c.env)
  const result = await db
    .select()
    .from(schema.watchList)
    .where(eq(schema.watchList.profileId, profileId))
    .orderBy(desc(schema.watchList.createdAt))
  return c.json(result)
})

watchlist.post(
  '/',
  zValidator('json', z.object({ mediaId: z.string(), mediaType: z.string() })),
  async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const profileId = c.req.param('profileId') as string
    const profile = await verifyOwnership(c, profileId, session.user.id)
    if (!profile) return c.json({ error: 'Profile not found' }, 404)

    const { mediaId, mediaType } = c.req.valid('json')
    const db = getDB(c.env)

    const existing = await db
      .select()
      .from(schema.watchList)
      .where(and(eq(schema.watchList.profileId, profileId), eq(schema.watchList.mediaId, mediaId)))
      .limit(1)

    if (existing.length > 0) return c.json({ error: 'Already in watchlist' }, 400)

    await db.insert(schema.watchList).values({
      id: crypto.randomUUID(),
      profileId,
      mediaId,
      mediaType,
      createdAt: new Date(),
    })
    return c.json({ message: 'Added to watchlist' }, 201)
  },
)

watchlist.delete('/:mediaId', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const profileId = c.req.param('profileId') as string
  const profile = await verifyOwnership(c, profileId, session.user.id)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)

  const mediaId = c.req.param('mediaId')
  const db = getDB(c.env)

  await db
    .delete(schema.watchList)
    .where(and(eq(schema.watchList.profileId, profileId), eq(schema.watchList.mediaId, mediaId)))

  return c.json({ message: 'Removed from watchlist' })
})

export default watchlist
