import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Support DATABASE_URL (standard) or POSTGRES_URL (Vercel Postgres auto-injected)
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error("WARNING: Neither DATABASE_URL nor POSTGRES_URL is set — DB calls will fail");
}

const sslConfig = dbUrl
  ? dbUrl.startsWith("https://") || dbUrl.includes("sslmode=disable") || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString: dbUrl ?? "postgres://localhost/placeholder",
  ssl: sslConfig,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
