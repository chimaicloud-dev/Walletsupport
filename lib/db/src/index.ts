import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("WARNING: DATABASE_URL is not set — DB calls will fail");
}

const sslConfig = dbUrl
  ? dbUrl.includes("sslmode=disable") || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString: dbUrl ?? "postgres://localhost/placeholder",
  ssl: sslConfig,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
