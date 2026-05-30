import { Hono } from 'hono'
import { auth } from '../lib/better-auth'
import { getDB } from '../lib/db'
import * as schema from '../db/schema'
import { eq } from 'drizzle-orm'

const proxies = new Hono<{ Bindings: CloudflareBindings }>()

proxies.all('/torbox/*', async (c) => {
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

proxies.all('/tmdb/*', async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const tmdbPath = c.req.path.replace('/api/tmdb/', '')
  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`)

  const originUrl = new URL(c.req.raw.url)
  originUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value))

  const response = await fetch(url.toString(), {
    method: c.req.method,
    headers: {
      'Authorization': `Bearer ${c.env.TMDB_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  return c.json(data, response.status as any)
})

export default proxies
