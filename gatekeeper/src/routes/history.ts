import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../lib/db'
import * as schema from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getSession, verifyOwnership } from '../lib/helpers'

const history = new Hono<{ Bindings: CloudflareBindings }>()

history.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const profileId = c.req.param('profileId') as string
  const profile = await verifyOwnership(c, profileId, session.user.id)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)

  const db = getDB(c.env)
  const result = await db
    .select()
    .from(schema.watchHistory)
    .where(eq(schema.watchHistory.profileId, profileId))
    .orderBy(desc(schema.watchHistory.watchedAt))
  return c.json(result)
})

history.post(
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
      .from(schema.watchHistory)
      .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(schema.watchHistory)
        .set({ watchedAt: new Date() })
        .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)))
      return c.json({ message: 'History updated' })
    }

    await db.insert(schema.watchHistory).values({
      id: crypto.randomUUID(),
      profileId,
      mediaId,
      mediaType,
      watchedAt: new Date(),
    })
    return c.json({ message: 'Added to history' }, 201)
  },
)

history.get('/progress', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const profileId = c.req.param('profileId') as string
  const profile = await verifyOwnership(c, profileId, session.user.id)
  if (!profile) return c.json({ error: 'Profile not found' }, 404)

  const mediaId = c.req.query('mediaId')
  if (!mediaId) return c.json({ error: 'mediaId query param required' }, 400)

  const db = getDB(c.env)
  const [entry] = await db
    .select({ position: schema.watchHistory.position, duration: schema.watchHistory.duration })
    .from(schema.watchHistory)
    .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)))
    .limit(1)

  return c.json({ position: entry?.position ?? 0, duration: entry?.duration ?? 0 })
})

history.patch(
  '/progress',
  zValidator('json', z.object({
    mediaId: z.string(),
    mediaType: z.string(),
    position: z.number().int().min(0),
    duration: z.number().int().min(0),
  })),
  async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const profileId = c.req.param('profileId') as string
    const profile = await verifyOwnership(c, profileId, session.user.id)
    if (!profile) return c.json({ error: 'Profile not found' }, 404)

    const { mediaId, mediaType, position, duration } = c.req.valid('json')
    const db = getDB(c.env)

    const [existing] = await db
      .select()
      .from(schema.watchHistory)
      .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)))
      .limit(1)

    if (existing) {
      await db
        .update(schema.watchHistory)
        .set({ position, duration, watchedAt: new Date() })
        .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)))
    } else {
      await db.insert(schema.watchHistory).values({
        id: crypto.randomUUID(),
        profileId,
        mediaId,
        mediaType,
        position,
        duration,
        watchedAt: new Date(),
      })
    }

    return c.json({ message: 'Progress saved' })
  },
)

export default history
