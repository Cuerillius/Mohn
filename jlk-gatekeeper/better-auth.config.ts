import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as schema from "./src/db/schema";

const { DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET, FRONTEND_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
});
const db = drizzle(pool);

export const auth = betterAuth({
  appName: 'JLK Gatekeeper',
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [FRONTEND_URL].filter(Boolean) as string[],
});