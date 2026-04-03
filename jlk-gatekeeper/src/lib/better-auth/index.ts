import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import * as schema from "../../db/schema";
import { getDB } from "../db";


export const auth = (env: CloudflareBindings) => {
  return betterAuth({
    database: drizzleAdapter(getDB(env), { provider: "pg", schema }),
    baseURL: env.BETTER_AUTH_URL,
    appName: 'JLK Gatekeeper',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      ...(env.FRONTEND_URL ? env.FRONTEND_URL.split(',') : [])
    ].filter(Boolean) as string[],
    emailAndPassword: {
      enabled: true,
    },
  });
};
