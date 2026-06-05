import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

export const getDB = (env: CloudflareBindings) => {
  const connectionString = env.HYPERDRIVE.connectionString;
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema });
  return db;
};
