import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { auth } from './lib/better-auth'
import { getDB } from './lib/db'
import * as schema from './db/schema'
import { eq, and, desc, count, asc } from 'drizzle-orm'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use('*', (c, next) => {
  const allowedOrigins = [
    ...(c.env.FRONTEND_URL ? c.env.FRONTEND_URL.split(',') : [])
  ].filter(Boolean) as string[]

  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['set-cookie'],
    credentials: true,
  })(c, next)
})

// ── Auth passthrough ──────────────────────────────────────────────────────────
app.all('/api/auth/*', (c) => {
  return auth(c.env).handler(c.req.raw)
})

// ── TorBox proxy ─────────────────────────────────────────────────────────────
app.all('/api/torbox/*', async (c) => {
  console.log('[torbox proxy]', c.req.method, c.req.path)
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!session) { console.log('[torbox proxy] no session'); return c.json({ error: 'Unauthorized' }, 401) }

  const db = getDB(c.env)
  const [settings] = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, session.user.id))
    .limit(1)

  const apiKey = settings?.torboxKey
  if (!apiKey) { console.log('[torbox proxy] no api key for user', session.user.id); return c.json({ error: 'TorBox API key not configured' }, 400) }

  const torboxPath = c.req.path.replace('/api/torbox', '')
  const url = new URL(`https://api.torbox.app/v1/api${torboxPath}`)

  const originUrl = new URL(c.req.raw.url)
  originUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value))

  if (torboxPath.startsWith('/torrents/requestdl')) {
    url.searchParams.set('token', apiKey)
  }

  const fetchHeaders: Record<string, string> = { 'Authorization': `Bearer ${apiKey}` }
  const contentType = c.req.header('content-type')
  if (contentType) fetchHeaders['content-type'] = contentType

  const fetchOptions: RequestInit = { method: c.req.method, headers: fetchHeaders }
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    fetchOptions.body = await c.req.raw.clone().arrayBuffer() as BodyInit
  }

  console.log('[torbox proxy] forwarding to', url.toString())
  try {
    const response = await fetch(url.toString(), fetchOptions)
    console.log('[torbox proxy] upstream status', response.status)
    const data = await response.json()
    return c.json(data, response.status as any)
  } catch (err) {
    console.error('[torbox proxy] fetch error', err)
    return c.json({ error: String(err) }, 502)
  }
})

// ── TMDB proxy ────────────────────────────────────────────────────────────────
app.all('/api/tmdb/*', async (c) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const tmdbPath = c.req.path.replace('/api/tmdb/', '')
  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`)

  const originUrl = new URL(c.req.raw.url)
  originUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  const response = await fetch(url.toString(), {
    method: c.req.method,
    headers: {
      'Authorization': `Bearer ${c.env.TMDB_API_TOKEN}`,
      'Content-Type': 'application/json',
    }
  })

  const data = await response.json()
  return c.json(data, response.status as any)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSession(c: any) {
  return auth(c.env).api.getSession({ headers: c.req.raw.headers })
}

async function verifyOwnership(c: any, profileId: string, userId: string) {
  const db = getDB(c.env)
  const [found] = await db
    .select()
    .from(schema.profile)
    .where(and(eq(schema.profile.id, profileId), eq(schema.profile.userId, userId)))
    .limit(1)
  return found || null
}

// ── RPC routes (chained for type inference) ───────────────────────────────────

const routes = app

  // ─ List profiles ──────────────────────────────────────────────────────────
  .get('/api/profiles', async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const db = getDB(c.env)
    const profiles = await db
      .select()
      .from(schema.profile)
      .where(eq(schema.profile.userId, session.user.id))
      .orderBy(asc(schema.profile.sortOrder))
    return c.json(profiles)
  })

  // ─ Create profile ────────────────────────────────────────────────────────
  .post(
    '/api/profiles',
    zValidator('json', z.object({ name: z.string().min(1) })),
    async (c) => {
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

      const newProfile = await db
        .insert(schema.profile)
        .values({
          id: crypto.randomUUID(),
          name,
          userId: session.user.id,
          sortOrder: nextOrder,
          createdAt: new Date(),
        })
        .returning()

      return c.json(newProfile[0], 201)
    },
  )

  // ─ Reorder profiles ──────────────────────────────────────────────────────
  .put(
    '/api/profiles/reorder',
    zValidator('json', z.object({ profileIds: z.array(z.string()) })),
    async (c) => {
      const session = await getSession(c)
      if (!session) return c.json({ error: 'Unauthorized' }, 401)

      const { profileIds } = c.req.valid('json')
      const db = getDB(c.env)

      const profiles = await db
        .select()
        .from(schema.profile)
        .where(eq(schema.profile.userId, session.user.id))
      const userProfileIds = new Set(profiles.map((p) => p.id))

      if (!profileIds.every((id) => userProfileIds.has(id))) {
        return c.json({ error: 'Invalid profile IDs' }, 400)
      }

      await Promise.all(
        profileIds.map((id, index) =>
          db
            .update(schema.profile)
            .set({ sortOrder: index })
            .where(eq(schema.profile.id, id)),
        ),
      )

      return c.json({ message: 'Profiles reordered' })
    },
  )

  // ─ Rename profile ────────────────────────────────────────────────────────
  .patch(
    '/api/profiles/:profileId',
    zValidator('json', z.object({ name: z.string().min(1) })),
    async (c) => {
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
    },
  )

  // ─ Delete profile ────────────────────────────────────────────────────────
  .delete('/api/profiles/:profileId', async (c) => {
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

  // ─ Watch history ──────────────────────────────────────────────────────────
  .get('/api/profiles/:profileId/history', async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const profileId = c.req.param('profileId')
    const profile = await verifyOwnership(c, profileId, session.user.id)
    if (!profile) return c.json({ error: 'Profile not found' }, 404)

    const db = getDB(c.env)
    const history = await db
      .select()
      .from(schema.watchHistory)
      .where(eq(schema.watchHistory.profileId, profileId))
      .orderBy(desc(schema.watchHistory.watchedAt))
    return c.json(history)
  })

  .post(
    '/api/profiles/:profileId/history',
    zValidator('json', z.object({ mediaId: z.string(), mediaType: z.string() })),
    async (c) => {
      const session = await getSession(c)
      if (!session) return c.json({ error: 'Unauthorized' }, 401)

      const profileId = c.req.param('profileId')
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

  // ─ Progress (position / duration) ────────────────────────────────────────
  .get('/api/profiles/:profileId/history/progress', async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const profileId = c.req.param('profileId')
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

  .patch(
    '/api/profiles/:profileId/history/progress',
    zValidator('json', z.object({
      mediaId: z.string(),
      mediaType: z.string(),
      position: z.number().int().min(0),
      duration: z.number().int().min(0),
    })),
    async (c) => {
      const session = await getSession(c)
      if (!session) return c.json({ error: 'Unauthorized' }, 401)

      const profileId = c.req.param('profileId')
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

  // ─ Watchlist ──────────────────────────────────────────────────────────────
  .get('/api/profiles/:profileId/watchlist', async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const profileId = c.req.param('profileId')
    const profile = await verifyOwnership(c, profileId, session.user.id)
    if (!profile) return c.json({ error: 'Profile not found' }, 404)

    const db = getDB(c.env)
    const watchlist = await db
      .select()
      .from(schema.watchList)
      .where(eq(schema.watchList.profileId, profileId))
      .orderBy(desc(schema.watchList.createdAt))
    return c.json(watchlist)
  })

  .post(
    '/api/profiles/:profileId/watchlist',
    zValidator('json', z.object({ mediaId: z.string(), mediaType: z.string() })),
    async (c) => {
      const session = await getSession(c)
      if (!session) return c.json({ error: 'Unauthorized' }, 401)

      const profileId = c.req.param('profileId')
      const profile = await verifyOwnership(c, profileId, session.user.id)
      if (!profile) return c.json({ error: 'Profile not found' }, 404)

      const { mediaId, mediaType } = c.req.valid('json')
      const db = getDB(c.env)

      const existing = await db
        .select()
        .from(schema.watchList)
        .where(and(eq(schema.watchList.profileId, profileId), eq(schema.watchList.mediaId, mediaId)))
        .limit(1)

      if (existing.length > 0) {
        return c.json({ error: 'Already in watchlist' }, 400)
      }

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

  .delete('/api/profiles/:profileId/watchlist/:mediaId', async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)

    const profileId = c.req.param('profileId')
    const profile = await verifyOwnership(c, profileId, session.user.id)
    if (!profile) return c.json({ error: 'Profile not found' }, 404)

    const mediaId = c.req.param('mediaId')
    const db = getDB(c.env)

    await db
      .delete(schema.watchList)
      .where(and(eq(schema.watchList.profileId, profileId), eq(schema.watchList.mediaId, mediaId)))

    return c.json({ message: 'Removed from watchlist' })
  })

  // ─ User settings ──────────────────────────────────────────────────────────
  .get('/api/settings', async (c) => {
    const session = await getSession(c)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)
    console.log('[GET /api/settings] user', session.user.id)

    const db = getDB(c.env)
    try {
      const [existing] = await db
        .select()
        .from(schema.userSettings)
        .where(eq(schema.userSettings.userId, session.user.id))
        .limit(1)

      if (!existing) {
        console.log('[GET /api/settings] creating default row')
        const [created] = await db
          .insert(schema.userSettings)
          .values({ userId: session.user.id, torboxKey: '', addonUrls: '[]', inactiveAddonUrls: '[]', updatedAt: new Date() })
          .returning()
        return c.json({ torboxKey: created.torboxKey, addonUrls: JSON.parse(created.addonUrls) as string[], inactiveAddonUrls: JSON.parse(created.inactiveAddonUrls) as string[] })
      }

      return c.json({ torboxKey: existing.torboxKey, addonUrls: JSON.parse(existing.addonUrls) as string[], inactiveAddonUrls: JSON.parse(existing.inactiveAddonUrls) as string[] })
    } catch (err) {
      console.error('[GET /api/settings] error', err)
      return c.json({ error: String(err) }, 500)
    }
  })

  .patch(
    '/api/settings',
    zValidator('json', z.object({
      torboxKey: z.string().optional(),
      addonUrls: z.array(z.string()).optional(),
      inactiveAddonUrls: z.array(z.string()).optional(),
    })),
    async (c) => {
      const session = await getSession(c)
      if (!session) return c.json({ error: 'Unauthorized' }, 401)

      const body = c.req.valid('json')
      console.log('[PATCH /api/settings] user', session.user.id, 'body keys', Object.keys(body))
      const db = getDB(c.env)

      const now = new Date()
      const insertValues = {
        userId: session.user.id,
        torboxKey: body.torboxKey ?? '',
        addonUrls: body.addonUrls ? JSON.stringify(body.addonUrls) : '[]',
        inactiveAddonUrls: body.inactiveAddonUrls ? JSON.stringify(body.inactiveAddonUrls) : '[]',
        updatedAt: now,
      }

      try {
        const [existing] = await db
          .select()
          .from(schema.userSettings)
          .where(eq(schema.userSettings.userId, session.user.id))
          .limit(1)

        if (existing) {
          console.log('[PATCH /api/settings] updating existing row')
          const set: Record<string, unknown> = { updatedAt: now }
          if (body.torboxKey !== undefined) set.torboxKey = body.torboxKey
          if (body.addonUrls !== undefined) set.addonUrls = JSON.stringify(body.addonUrls)
          if (body.inactiveAddonUrls !== undefined) set.inactiveAddonUrls = JSON.stringify(body.inactiveAddonUrls)
          await db.update(schema.userSettings).set(set).where(eq(schema.userSettings.userId, session.user.id))
        } else {
          console.log('[PATCH /api/settings] inserting new row')
          await db.insert(schema.userSettings).values(insertValues)
        }

        return c.json({ message: 'Settings updated' })
      } catch (err) {
        console.error('[PATCH /api/settings] error', err)
        return c.json({ error: String(err) }, 500)
      }
    },
  )

export type AppType = typeof routes
export default routes
