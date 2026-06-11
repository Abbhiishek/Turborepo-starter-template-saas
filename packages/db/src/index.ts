import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Export all drizzle helpers and generated table schemas.
export * from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: true,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool);