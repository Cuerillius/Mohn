import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import * as schema from "../../db/schema";
import { getDB } from "../db";

export const auth = (env: CloudflareBindings) => {
  return betterAuth({
    database: drizzleAdapter(getDB(env), { provider: "pg", schema }),
    baseURL: env.BETTER_AUTH_URL,
    appName: "Mohn Gatekeeper",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      ...(env.FRONTEND_URL ? env.FRONTEND_URL.split(",") : []),
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
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  });
};
