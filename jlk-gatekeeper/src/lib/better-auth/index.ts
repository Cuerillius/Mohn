import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import * as schema from "../../db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const auth = (env: CloudflareBindings) => {
  console.log('INIT AUTH: Connecting to postgres...');
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  const db = drizzle(pool);
  console.log('INIT AUTH: Connection pool created.');

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    baseURL: env.BETTER_AUTH_URL,
    appName: 'JLK Gatekeeper',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.FRONTEND_URL].filter(Boolean) as string[],
  });
};
