import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";

let db: any = null;

export const getDB = (env: CloudflareBindings) => {
  if (db) return db;
  
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  db = drizzle(pool, { schema });
  return db;
};
