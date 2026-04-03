import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.HYPERDRIVE_CONNECTION_STRING;

if (!dbUrl) {
  throw new Error("Missing database URL. Set HYPERDRIVE_CONNECTION_STRING.");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
