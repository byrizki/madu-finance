import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("SUPABASE_DB_URL environment variable is not set");
}

const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
