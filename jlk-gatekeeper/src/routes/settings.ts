import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDB } from '../lib/db'
import * as schema from '../db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '../lib/helpers'

const settings = new Hono<{ Bindings: CloudflareBindings }>()

settings.get('/', async (c) => {
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
      return c.json({
        torboxKey: created.torboxKey,
        addonUrls: JSON.parse(created.addonUrls) as string[],
        inactiveAddonUrls: JSON.parse(created.inactiveAddonUrls) as string[],
      })
    }

    return c.json({
      torboxKey: existing.torboxKey,
      addonUrls: JSON.parse(existing.addonUrls) as string[],
      inactiveAddonUrls: JSON.parse(existing.inactiveAddonUrls) as string[],
    })
  } catch (err) {
    console.error('[GET /api/settings] error', err)
    return c.json({ error: String(err) }, 500)
  }
})

settings.patch(
  '/',
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
        await db.insert(schema.userSettings).values({
          userId: session.user.id,
          torboxKey: body.torboxKey ?? '',
          addonUrls: body.addonUrls ? JSON.stringify(body.addonUrls) : '[]',
          inactiveAddonUrls: body.inactiveAddonUrls ? JSON.stringify(body.inactiveAddonUrls) : '[]',
          updatedAt: now,
        })
      }

      return c.json({ message: 'Settings updated' })
    } catch (err) {
      console.error('[PATCH /api/settings] error', err)
      return c.json({ error: String(err) }, 500)
    }
  },
)

export default settings
