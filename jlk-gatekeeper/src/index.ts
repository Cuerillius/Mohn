import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/better-auth';
import { getDB } from './lib/db';
import * as schema from './db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', (c, next) => {
  const allowedOrigins = [
    c.env.FRONTEND_URL
  ].filter(Boolean) as string[]

  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['set-cookie'],
    credentials: true,
  })(c, next)
})

app.all('/api/auth/*', (c) => {
  return auth(c.env).handler(c.req.raw);
});

app.all('/api/tmdb/*', async (c) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const tmdbPath = c.req.path.replace('/api/tmdb/', '');
  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`);

  const originUrl = new URL(c.req.raw.url);
  originUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: c.req.method,
    headers: {
      'Authorization': `Bearer ${c.env.TMDB_API_TOKEN}`,
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  return c.json(data, response.status as any);
});

app.get('/api/profiles', async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const db = getDB(c.env);
  const profiles = await db.select().from(schema.profile).where(eq(schema.profile.userId, session.user.id));
  return c.json(profiles);
});

app.post('/api/profiles', async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const { name } = await c.req.json();
  if (!name) return c.json({ error: 'Profile name is required' }, 400);

  const db = getDB(c.env);

  const profileCount = await db.select({ count: count() }).from(schema.profile).where(eq(schema.profile.userId, session.user.id));
  if (profileCount[0].count >= 10) {
    return c.json({ error: 'Maximum limit of 10 profiles reached' }, 400);
  }

  const newProfile = await db.insert(schema.profile).values({
    id: crypto.randomUUID(),
    name,
    userId: session.user.id,
    createdAt: new Date(),
  }).returning();

  return c.json(newProfile[0], 201);
});

app.use('/api/profiles/:profileId/*', async (c, next) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const profileId = c.req.param('profileId');
  const db = getDB(c.env);

  const profile = await db.select().from(schema.profile)
    .where(and(eq(schema.profile.id, profileId), eq(schema.profile.userId, session.user.id)))
    .limit(1);

  if (profile.length === 0) {
    return c.json({ error: 'Profile not found or access denied' }, 404);
  }

  return next();
});

app.get('/api/profiles/:profileId/history', async (c) => {
  const profileId = c.req.param('profileId');
  const db = getDB(c.env);
  const history = await db.select().from(schema.watchHistory)
    .where(eq(schema.watchHistory.profileId, profileId))
    .orderBy(desc(schema.watchHistory.watchedAt));
  return c.json(history);
});

app.post('/api/profiles/:profileId/history', async (c) => {
  const profileId = c.req.param('profileId');
  const { mediaId, mediaType } = await c.req.json();
  if (!mediaId || !mediaType) return c.json({ error: 'mediaId and mediaType are required' }, 400);

  const db = getDB(c.env);

  const existing = await db.select().from(schema.watchHistory)
    .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(schema.watchHistory)
      .set({ watchedAt: new Date() })
      .where(and(eq(schema.watchHistory.profileId, profileId), eq(schema.watchHistory.mediaId, mediaId)));
    return c.json({ message: 'History updated' });
  }

  await db.insert(schema.watchHistory).values({
    id: crypto.randomUUID(),
    profileId,
    mediaId,
    mediaType,
    watchedAt: new Date(),
  });

  return c.json({ message: 'Added to history' }, 201);
});

app.get('/api/profiles/:profileId/watchlist', async (c) => {
  const profileId = c.req.param('profileId');
  const db = getDB(c.env);
  const watchlist = await db.select().from(schema.watchList)
    .where(eq(schema.watchList.profileId, profileId))
    .orderBy(desc(schema.watchList.createdAt));
  return c.json(watchlist);
});

app.post('/api/profiles/:profileId/watchlist', async (c) => {
  const profileId = c.req.param('profileId');
  const { mediaId, mediaType } = await c.req.json();
  if (!mediaId || !mediaType) return c.json({ error: 'mediaId and mediaType are required' }, 400);

  const db = getDB(c.env);
  const existing = await db.select().from(schema.watchList)
    .where(and(eq(schema.watchList.profileId, profileId), eq(schema.watchList.mediaId, mediaId)))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: 'Already in watchlist' }, 400);
  }

  await db.insert(schema.watchList).values({
    id: crypto.randomUUID(),
    profileId,
    mediaId,
    mediaType,
    createdAt: new Date(),
  });

  return c.json({ message: 'Added to watchlist' }, 201);
});

app.delete('/api/profiles/:profileId/watchlist/:mediaId', async (c) => {
  const profileId = c.req.param('profileId');
  const mediaId = c.req.param('mediaId');
  const db = getDB(c.env);

  await db.delete(schema.watchList)
    .where(and(eq(schema.watchList.profileId, profileId), eq(schema.watchList.mediaId, mediaId)));

  return c.json({ message: 'Removed from watchlist' });
});

export default app
