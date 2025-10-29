import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
export type TransactionClient = Parameters<typeof db.transaction>[0];
