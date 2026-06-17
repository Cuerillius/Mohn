import { drizzle } from "drizzle-orm/postgres-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import postgres from "postgres";
import * as schema from "./src/db/schema";

const {
  HYPERDRIVE_CONNECTION_STRING,
  VITE_GATEKEEPER_URL,
  BETTER_AUTH_SECRET,
  VITE_APP_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = process.env;

const connectionString = HYPERDRIVE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("Missing database URL. Set HYPERDRIVE_CONNECTION_STRING.");
}

const queryClient = postgres(connectionString);
const db = drizzle(queryClient);

export const auth = betterAuth({
  appName: "Mohn Gatekeeper",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: VITE_GATEKEEPER_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [...(VITE_APP_URL?.split(",") ?? [])],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
    },
  },
});
