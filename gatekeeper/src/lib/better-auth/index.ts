import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import * as schema from "../../db/schema";
import { getDB } from "../db";

export const auth = (env: CloudflareBindings) => {
  const db = getDB(env);
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    baseURL: env.VITE_GATEKEEPER_URL,
    appName: "Mohn Gatekeeper",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      ...(env.TRUSTED_ORIGINS ? env.TRUSTED_ORIGINS.split(",") : []),
      // Required for Social sign-in flows to work in the Tauri WebView
      "https://tauri.localhost",
      "tauri://localhost",
      "http://localhost:*",
      "http://127.0.0.1:*",
    ].filter(Boolean) as string[],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await db.insert(schema.profile).values({
              id: crypto.randomUUID(),
              name: user.name,
              userId: user.id,
              sortOrder: 0,
              createdAt: new Date(),
            });
          },
        },
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  });
};
